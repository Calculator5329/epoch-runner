import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

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
