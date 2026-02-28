import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

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
