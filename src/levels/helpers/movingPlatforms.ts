/**
 * Moving Platform Helpers
 * 
 * Helper functions for adding moving platforms to levels.
 */

import type { MovingPlatformSpawn } from '../../core/types/movingPlatforms'
import type { GridPosition } from '../types'

/**
 * Create a horizontal moving platform
 * @param startCol - Starting column
 * @param startRow - Starting row
 * @param endCol - Ending column
 * @param endRow - Ending row (usually same as startRow for horizontal)
 * @param widthTiles - Platform width in tiles
 * @param speed - Optional movement speed (default 120 px/s)
 * @param color - Optional color (default purple)
 */
export function horizontalPlatform(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number = startRow,
  widthTiles: number = 3,
  speed?: number,
  color?: string
): MovingPlatformSpawn {
  return {
    pattern: 'horizontal',
    start: { col: startCol, row: startRow },
    end: { col: endCol, row: endRow },
    widthTiles,
    speed,
    color,
  }
}

/**
 * Create a vertical moving platform
 * @param startCol - Starting column
 * @param startRow - Starting row
 * @param endCol - Ending column (usually same as startCol for vertical)
 * @param endRow - Ending row
 * @param widthTiles - Platform width in tiles
 * @param speed - Optional movement speed (default 120 px/s)
 * @param color - Optional color (default purple)
 */
export function verticalPlatform(
  startCol: number,
  startRow: number,
  endCol: number = startCol,
  endRow: number,
  widthTiles: number = 3,
  speed?: number,
  color?: string
): MovingPlatformSpawn {
  return {
    pattern: 'vertical',
    start: { col: startCol, row: startRow },
    end: { col: endCol, row: endRow },
    widthTiles,
    speed,
    color,
  }
}

/**
 * Helper to combine multiple moving platforms
 */
export function movingPlatforms(...platforms: MovingPlatformSpawn[]): MovingPlatformSpawn[] {
  return platforms
}
