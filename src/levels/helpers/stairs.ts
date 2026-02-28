import { TileTypeId } from '../../core/types'
import type { TilePlacement } from '../types'

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
