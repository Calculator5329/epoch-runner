import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

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
