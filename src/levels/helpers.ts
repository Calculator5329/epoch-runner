import { TileTypeId } from '../core/types'
import type { TilePlacement, LevelDefinition, GridPosition } from './types'

/**
 * Create an empty collision grid filled with EMPTY tiles
 */
export function createEmptyGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => 
    Array.from({ length: width }, () => TileTypeId.EMPTY)
  )
}

/**
 * Build a collision grid using a function to determine each tile
 */
export function buildGrid(
  width: number,
  height: number,
  fn: (col: number, row: number) => number
): number[][] {
  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => fn(col, row))
  )
}

/**
 * Apply tile placements to a grid
 */
export function applyPlacements(
  grid: number[][],
  placements: TilePlacement[]
): number[][] {
  // Clone the grid
  const result = grid.map(row => [...row])
  
  // Apply each placement
  for (const { col, row, type } of placements) {
    if (row >= 0 && row < result.length && col >= 0 && col < result[0].length) {
      result[row][col] = type
    }
  }
  
  return result
}

// ============================================
// Basic Solid Tile Helpers
// ============================================

/**
 * Create a horizontal platform (row of solid tiles)
 */
export function platform(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.SOLID_FULL,
  }))
}

/**
 * Create a vertical wall (column of solid tiles)
 */
export function wall(col: number, startRow: number, height: number): TilePlacement[] {
  return Array.from({ length: height }, (_, i) => ({
    col,
    row: startRow + i,
    type: TileTypeId.SOLID_FULL,
  }))
}

/**
 * Fill a rectangle with a tile type
 */
export function rect(
  startCol: number,
  startRow: number,
  width: number,
  height: number,
  type: number = TileTypeId.SOLID_FULL
): TilePlacement[] {
  const placements: TilePlacement[] = []
  for (let row = startRow; row < startRow + height; row++) {
    for (let col = startCol; col < startCol + width; col++) {
      placements.push({ col, row, type })
    }
  }
  return placements
}

/**
 * Create a hollow rectangle (outline only)
 */
export function hollowRect(
  startCol: number,
  startRow: number,
  width: number,
  height: number,
  type: number = TileTypeId.SOLID_FULL
): TilePlacement[] {
  const placements: TilePlacement[] = []
  
  // Top and bottom edges
  for (let col = startCol; col < startCol + width; col++) {
    placements.push({ col, row: startRow, type })
    placements.push({ col, row: startRow + height - 1, type })
  }
  
  // Left and right edges (excluding corners already placed)
  for (let row = startRow + 1; row < startRow + height - 1; row++) {
    placements.push({ col: startCol, row, type })
    placements.push({ col: startCol + width - 1, row, type })
  }
  
  return placements
}

// ============================================
// Partial Block Helpers
// ============================================

/**
 * Place a half block (left side)
 */
export function halfBlockLeft(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_HALF_LEFT }]
}

/**
 * Place a half block (right side)
 */
export function halfBlockRight(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_HALF_RIGHT }]
}

/**
 * Place a half block (top)
 */
export function halfBlockTop(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_HALF_TOP }]
}

/**
 * Place a half block (bottom)
 */
export function halfBlockBottom(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_HALF_BOTTOM }]
}

/**
 * Place a quarter block
 */
export function quarterBlock(col: number, row: number, corner: 'tl' | 'tr' | 'bl' | 'br'): TilePlacement[] {
  const typeMap = {
    tl: TileTypeId.SOLID_QUARTER_TL,
    tr: TileTypeId.SOLID_QUARTER_TR,
    bl: TileTypeId.SOLID_QUARTER_BL,
    br: TileTypeId.SOLID_QUARTER_BR,
  }
  return [{ col, row, type: typeMap[corner] }]
}

// ============================================
// Slope Helpers
// ============================================

/**
 * Place a slope going up to the right
 */
export function slopeUpRight(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_SLOPE_UP_RIGHT }]
}

/**
 * Place a slope going up to the left
 */
export function slopeUpLeft(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.SOLID_SLOPE_UP_LEFT }]
}

/**
 * Create a ramp going up-right over multiple tiles
 */
export function rampUpRight(startCol: number, startRow: number, length: number): TilePlacement[] {
  const placements: TilePlacement[] = []
  for (let i = 0; i < length; i++) {
    placements.push({
      col: startCol + i,
      row: startRow - i,
      type: TileTypeId.SOLID_SLOPE_UP_RIGHT,
    })
    // Fill below with solid
    for (let j = startRow - i + 1; j <= startRow; j++) {
      placements.push({
        col: startCol + i,
        row: j,
        type: TileTypeId.SOLID_FULL,
      })
    }
  }
  return placements
}

/**
 * Create a ramp going up-left over multiple tiles
 */
export function rampUpLeft(startCol: number, startRow: number, length: number): TilePlacement[] {
  const placements: TilePlacement[] = []
  for (let i = 0; i < length; i++) {
    placements.push({
      col: startCol - i,
      row: startRow - i,
      type: TileTypeId.SOLID_SLOPE_UP_LEFT,
    })
    // Fill below with solid
    for (let j = startRow - i + 1; j <= startRow; j++) {
      placements.push({
        col: startCol - i,
        row: j,
        type: TileTypeId.SOLID_FULL,
      })
    }
  }
  return placements
}

// ============================================
// One-Way Platform Helpers
// ============================================

/**
 * Create a one-way platform (can jump through from below)
 */
export function oneWayPlatform(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.PLATFORM_FULL,
  }))
}

// ============================================
// Hazard Helpers
// ============================================

/**
 * Place a hazard block
 */
export function hazard(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.HAZARD_FULL }]
}

/**
 * Create a row of spikes pointing up
 */
export function spikesUp(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.HAZARD_SPIKE_UP,
  }))
}

/**
 * Create a row of spikes pointing down
 */
export function spikesDown(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.HAZARD_SPIKE_DOWN,
  }))
}

/**
 * Create a column of spikes pointing left
 */
export function spikesLeft(col: number, startRow: number, height: number): TilePlacement[] {
  return Array.from({ length: height }, (_, i) => ({
    col,
    row: startRow + i,
    type: TileTypeId.HAZARD_SPIKE_LEFT,
  }))
}

/**
 * Create a column of spikes pointing right
 */
export function spikesRight(col: number, startRow: number, height: number): TilePlacement[] {
  return Array.from({ length: height }, (_, i) => ({
    col,
    row: startRow + i,
    type: TileTypeId.HAZARD_SPIKE_RIGHT,
  }))
}

// ============================================
// Pickup Helpers
// ============================================

/**
 * Place a coin
 */
export function coin(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.COIN }]
}

/**
 * Place multiple coins at positions
 */
export function coins(positions: GridPosition[]): TilePlacement[] {
  return positions.map(pos => ({
    col: pos.col,
    row: pos.row,
    type: TileTypeId.COIN,
  }))
}

/**
 * Create a row of coins
 */
export function coinRow(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: TileTypeId.COIN,
  }))
}

/**
 * Create an arc of coins (for jumping paths)
 */
export function coinArc(startCol: number, peakRow: number, length: number, height: number = 2): TilePlacement[] {
  const placements: TilePlacement[] = []
  const mid = Math.floor(length / 2)
  
  for (let i = 0; i < length; i++) {
    const distFromMid = Math.abs(i - mid)
    // Guard against division by zero when length <= 1
    const rowOffset = mid > 0 ? Math.floor((distFromMid / mid) * height) : 0
    placements.push({
      col: startCol + i,
      row: peakRow + rowOffset,
      type: TileTypeId.COIN,
    })
  }
  
  return placements
}

/**
 * Place a double jump power-up
 */
export function doubleJump(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.POWERUP_DOUBLE_JUMP }]
}

// ============================================
// Trigger Helpers
// ============================================

/**
 * Place a goal tile
 */
export function goal(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.GOAL }]
}

/**
 * Place a checkpoint
 */
export function checkpoint(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.CHECKPOINT }]
}

// ============================================
// Stair Helpers
// ============================================

/**
 * Create stairs going up-right
 */
export function stairsUpRight(
  startCol: number,
  startRow: number,
  steps: number,
  stepWidth: number = 1,
  stepHeight: number = 1
): TilePlacement[] {
  const placements: TilePlacement[] = []
  
  for (let step = 0; step < steps; step++) {
    const col = startCol + step * stepWidth
    const row = startRow - step * stepHeight
    
    // Each step is a platform
    for (let w = 0; w < stepWidth; w++) {
      placements.push({ col: col + w, row, type: TileTypeId.SOLID_FULL })
    }
  }
  
  return placements
}

/**
 * Create stairs going up-left
 */
export function stairsUpLeft(
  startCol: number,
  startRow: number,
  steps: number,
  stepWidth: number = 1,
  stepHeight: number = 1
): TilePlacement[] {
  const placements: TilePlacement[] = []
  
  for (let step = 0; step < steps; step++) {
    const col = startCol - step * stepWidth - (stepWidth - 1)
    const row = startRow - step * stepHeight
    
    for (let w = 0; w < stepWidth; w++) {
      placements.push({ col: col + w, row, type: TileTypeId.SOLID_FULL })
    }
  }
  
  return placements
}

// ============================================
// Level Building Helpers
// ============================================

/**
 * Create a level from tile placements
 */
export function createLevel(
  id: string,
  name: string,
  width: number,
  height: number,
  playerSpawn: GridPosition,
  placements: TilePlacement[],
  options?: {
    description?: string
    author?: string
    startingLives?: number
    parTime?: number
    themeId?: string
  }
): LevelDefinition {
  const grid = createEmptyGrid(width, height)
  const collision = applyPlacements(grid, placements)
  
  return {
    id,
    name,
    width,
    height,
    playerSpawn,
    collision,
    ...options,
  }
}

/**
 * Merge multiple tile placement arrays
 */
export function tiles(...placementArrays: TilePlacement[][]): TilePlacement[] {
  return placementArrays.flat()
}

/**
 * Create a ground floor across the entire level width
 */
export function ground(width: number, row: number): TilePlacement[] {
  return platform(0, row, width)
}

/**
 * Create left and right walls for the entire level height
 */
export function walls(height: number, width: number): TilePlacement[] {
  return [
    ...wall(0, 0, height),
    ...wall(width - 1, 0, height),
  ]
}

/**
 * Create a ceiling across the entire level width
 */
export function ceiling(width: number): TilePlacement[] {
  return platform(0, 0, width)
}

/**
 * Create a full border around the level
 */
export function border(width: number, height: number): TilePlacement[] {
  return hollowRect(0, 0, width, height)
}
