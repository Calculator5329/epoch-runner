import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

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
