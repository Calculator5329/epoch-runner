import { TILE_SIZE } from '../core/constants'
import type { CollisionShape, NormalizedPoint } from '../core/types/shapes'
import { getTileType, isTileTypeSolid, isTileTypeHazard, isTileTypePickup, isTileTypePlatform } from '../core/types/shapes'

/**
 * CollisionUtils - Shape-based collision detection utilities
 * 
 * Handles collision between player AABB and tile shapes (rectangles and polygons).
 * All tile shapes are normalized (0-1) and converted to world coordinates for checks.
 */

// Player AABB (axis-aligned bounding box)
export interface AABB {
  x: number
  y: number
  width: number
  height: number
}

// World-space rectangle
interface WorldRect {
  x: number
  y: number
  w: number
  h: number
}

// ============================================
// AABB vs AABB Collision
// ============================================

export function aabbOverlap(a: AABB, b: WorldRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.width > b.x &&
    a.y < b.y + b.h &&
    a.y + a.height > b.y
  )
}

// ============================================
// AABB vs Polygon Collision
// ============================================

// Check if AABB overlaps with a convex polygon (using SAT - Separating Axis Theorem)
export function aabbPolygonOverlap(aabb: AABB, polygon: NormalizedPoint[], tileX: number, tileY: number): boolean {
  // Convert polygon to world coordinates
  const worldPoly = polygon.map(p => ({
    x: tileX + p.x * TILE_SIZE,
    y: tileY + p.y * TILE_SIZE,
  }))
  
  // Convert AABB to polygon (4 corners)
  const aabbPoly = [
    { x: aabb.x, y: aabb.y },
    { x: aabb.x + aabb.width, y: aabb.y },
    { x: aabb.x + aabb.width, y: aabb.y + aabb.height },
    { x: aabb.x, y: aabb.y + aabb.height },
  ]
  
  // SAT: Test separation along all edge normals of both polygons
  return !hasSeparatingAxis(aabbPoly, worldPoly) && !hasSeparatingAxis(worldPoly, aabbPoly)
}

// Check if there's a separating axis between two convex polygons
function hasSeparatingAxis(polyA: { x: number; y: number }[], polyB: { x: number; y: number }[]): boolean {
  for (let i = 0; i < polyA.length; i++) {
    const j = (i + 1) % polyA.length
    
    // Edge vector
    const edge = {
      x: polyA[j].x - polyA[i].x,
      y: polyA[j].y - polyA[i].y,
    }
    
    // Normal (perpendicular) - no need to normalize for projection comparison
    const normal = { x: -edge.y, y: edge.x }
    
    // Project both polygons onto the normal
    const projA = projectPolygon(polyA, normal)
    const projB = projectPolygon(polyB, normal)
    
    // Check for gap
    if (projA.max < projB.min || projB.max < projA.min) {
      return true // Found separating axis
    }
  }
  return false
}

// Project polygon onto axis and return min/max
function projectPolygon(poly: { x: number; y: number }[], axis: { x: number; y: number }): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  
  for (const p of poly) {
    const proj = p.x * axis.x + p.y * axis.y
    min = Math.min(min, proj)
    max = Math.max(max, proj)
  }
  
  return { min, max }
}

// ============================================
// Shape Collision Check
// ============================================

/**
 * Check if AABB overlaps with a tile's collision shape
 */
export function checkShapeCollision(
  aabb: AABB,
  shape: CollisionShape,
  tileX: number,
  tileY: number
): boolean {
  if (shape.type === 'none') {
    return false
  }
  
  if (shape.type === 'rect' && shape.rect) {
    const worldRect: WorldRect = {
      x: tileX + shape.rect.x * TILE_SIZE,
      y: tileY + shape.rect.y * TILE_SIZE,
      w: shape.rect.w * TILE_SIZE,
      h: shape.rect.h * TILE_SIZE,
    }
    return aabbOverlap(aabb, worldRect)
  }
  
  if (shape.type === 'polygon' && shape.vertices) {
    return aabbPolygonOverlap(aabb, shape.vertices, tileX, tileY)
  }
  
  return false
}

// ============================================
// Tile Grid Collision Checks
// ============================================

export interface TileCollisionResult {
  collides: boolean
  tileId: number
  col: number
  row: number
  tileX: number
  tileY: number
}

/**
 * Check collision against all tiles the AABB overlaps
 */
export function checkTileCollisions(
  aabb: AABB,
  getTile: (col: number, row: number) => number,
  levelWidth: number,
  levelHeight: number,
  filter: (tileId: number) => boolean = isTileTypeSolid
): TileCollisionResult[] {
  const results: TileCollisionResult[] = []
  
  // Get tile range that AABB overlaps
  const startCol = Math.max(0, Math.floor(aabb.x / TILE_SIZE))
  const endCol = Math.min(levelWidth - 1, Math.floor((aabb.x + aabb.width) / TILE_SIZE))
  const startRow = Math.max(0, Math.floor(aabb.y / TILE_SIZE))
  const endRow = Math.min(levelHeight - 1, Math.floor((aabb.y + aabb.height) / TILE_SIZE))
  
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const tileId = getTile(col, row)
      
      if (!filter(tileId)) continue
      
      const tileType = getTileType(tileId)
      const tileX = col * TILE_SIZE
      const tileY = row * TILE_SIZE
      
      if (checkShapeCollision(aabb, tileType.collision, tileX, tileY)) {
        results.push({
          collides: true,
          tileId,
          col,
          row,
          tileX,
          tileY,
        })
      }
    }
  }
  
  return results
}

/**
 * Check if AABB collides with any solid tile
 */
export function checkSolidCollision(
  aabb: AABB,
  getTile: (col: number, row: number) => number,
  levelWidth: number,
  levelHeight: number
): boolean {
  const results = checkTileCollisions(aabb, getTile, levelWidth, levelHeight, isTileTypeSolid)
  return results.length > 0
}

/**
 * Check if AABB collides with any hazard tile
 */
export function checkHazardCollision(
  aabb: AABB,
  getTile: (col: number, row: number) => number,
  levelWidth: number,
  levelHeight: number
): TileCollisionResult | null {
  const results = checkTileCollisions(aabb, getTile, levelWidth, levelHeight, isTileTypeHazard)
  return results.length > 0 ? results[0] : null
}

/**
 * Check if AABB collides with any pickup tile
 */
export function checkPickupCollision(
  aabb: AABB,
  getTile: (col: number, row: number) => number,
  levelWidth: number,
  levelHeight: number
): TileCollisionResult[] {
  return checkTileCollisions(aabb, getTile, levelWidth, levelHeight, isTileTypePickup)
}

/**
 * Check if AABB collides with a one-way platform (only from above)
 */
export function checkPlatformCollision(
  aabb: AABB,
  prevY: number,
  getTile: (col: number, row: number) => number,
  levelWidth: number,
  levelHeight: number
): TileCollisionResult | null {
  // Only check if moving downward (falling)
  if (aabb.y <= prevY) {
    return null
  }
  
  const results = checkTileCollisions(aabb, getTile, levelWidth, levelHeight, isTileTypePlatform)
  
  for (const result of results) {
    const tileType = getTileType(result.tileId)
    
    // For platforms, only collide if player was above the platform's collision top
    if (tileType.collision.type === 'rect' && tileType.collision.rect) {
      const platformTop = result.tileY + tileType.collision.rect.y * TILE_SIZE
      const prevBottom = prevY + aabb.height
      
      // Only collide if player's previous bottom was above platform top
      if (prevBottom <= platformTop + 1) { // +1 for tolerance
        return result
      }
    }
  }
  
  return null
}

/**
 * Get the penetration depth for collision resolution
 */
export function getPenetrationDepth(
  aabb: AABB,
  shape: CollisionShape,
  tileX: number,
  tileY: number,
  direction: 'horizontal' | 'vertical'
): number {
  if (shape.type !== 'rect' || !shape.rect) {
    // For polygons, use simplified AABB of the polygon
    // This is approximate but sufficient for most cases
    return 0
  }
  
  const rect: WorldRect = {
    x: tileX + shape.rect.x * TILE_SIZE,
    y: tileY + shape.rect.y * TILE_SIZE,
    w: shape.rect.w * TILE_SIZE,
    h: shape.rect.h * TILE_SIZE,
  }
  
  if (direction === 'horizontal') {
    const aabbRight = aabb.x + aabb.width
    const rectRight = rect.x + rect.w
    
    // Moving right - penetration from left side of rect
    const rightPen = aabbRight - rect.x
    // Moving left - penetration from right side of rect
    const leftPen = rectRight - aabb.x
    
    return Math.min(rightPen, leftPen)
  } else {
    const aabbBottom = aabb.y + aabb.height
    const rectBottom = rect.y + rect.h
    
    // Moving down - penetration from top of rect
    const downPen = aabbBottom - rect.y
    // Moving up - penetration from bottom of rect
    const upPen = rectBottom - aabb.y
    
    return Math.min(downPen, upPen)
  }
}
