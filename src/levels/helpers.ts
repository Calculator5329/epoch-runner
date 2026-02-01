import { CollisionType } from '../core/types'
import type { TilePlacement, LevelDefinition, GridPosition } from './types'

/**
 * Create an empty collision grid filled with EMPTY tiles
 */
export function createEmptyGrid(width: number, height: number): CollisionType[][] {
  return Array.from({ length: height }, () => 
    Array.from({ length: width }, () => CollisionType.EMPTY)
  )
}

/**
 * Build a collision grid using a function to determine each tile
 */
export function buildGrid(
  width: number,
  height: number,
  fn: (col: number, row: number) => CollisionType
): CollisionType[][] {
  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => fn(col, row))
  )
}

/**
 * Apply tile placements to a grid
 */
export function applyPlacements(
  grid: CollisionType[][],
  placements: TilePlacement[]
): CollisionType[][] {
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
// Tile Placement Helpers
// ============================================

/**
 * Create a horizontal platform (row of solid tiles)
 */
export function platform(startCol: number, row: number, length: number): TilePlacement[] {
  return Array.from({ length }, (_, i) => ({
    col: startCol + i,
    row,
    type: CollisionType.SOLID,
  }))
}

/**
 * Create a vertical wall (column of solid tiles)
 */
export function wall(col: number, startRow: number, height: number): TilePlacement[] {
  return Array.from({ length: height }, (_, i) => ({
    col,
    row: startRow + i,
    type: CollisionType.SOLID,
  }))
}

/**
 * Place a goal tile
 */
export function goal(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: CollisionType.GOAL }]
}

/**
 * Fill a rectangle with a tile type
 */
export function rect(
  startCol: number,
  startRow: number,
  width: number,
  height: number,
  type: CollisionType = CollisionType.SOLID
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
  type: CollisionType = CollisionType.SOLID
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
      placements.push({ col: col + w, row, type: CollisionType.SOLID })
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
      placements.push({ col: col + w, row, type: CollisionType.SOLID })
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
