import { TileTypeId } from '../../core/types'
import type { TilePlacement, GridPosition } from '../types'

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
 * Place a triple jump power-up
 */
export function tripleJump(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.POWERUP_TRIPLE_JUMP }]
}

/**
 * Place a speed boost power-up (2x movement speed)
 */
export function speedBoost(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.POWERUP_SPEED }]
}

/**
 * Place a super jump power-up (1.5x jump height)
 */
export function superJump(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.POWERUP_SUPER_JUMP }]
}

/**
 * Place an invincibility power-up (immune to damage)
 */
export function invincibility(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: TileTypeId.POWERUP_INVINCIBILITY }]
}
