/**
 * Moving Platform System Types
 * 
 * Moving platforms are dynamic solid tiles that the player can ride.
 * Player "sticks" to the platform and inherits its velocity.
 */

import type { GridPosition } from '../../levels/types'

/**
 * Platform movement pattern type
 */
export type MovementPattern = 
  | 'horizontal'  // Slides left/right between two points
  | 'vertical'    // Moves up/down between two points
  | 'circular'    // Follows circular path (future)

/**
 * Runtime moving platform instance
 */
export interface MovingPlatform {
  /** Unique runtime ID */
  id: string
  
  /** Movement pattern type */
  pattern: MovementPattern
  
  /** Current position in world pixels (top-left corner) */
  x: number
  y: number
  
  /** Platform dimensions in pixels */
  width: number
  height: number
  
  /** Current velocity in pixels per second */
  vx: number
  vy: number
  
  /** Start position in world pixels */
  startX: number
  startY: number
  
  /** End position in world pixels */
  endX: number
  endY: number
  
  /** Movement speed in pixels per second */
  speed: number
  
  /** Current direction: 1 = toward end, -1 = toward start */
  direction: 1 | -1
  
  /** Whether platform is active */
  isActive: boolean
  
  /** Color for rendering */
  color: string
}

/**
 * Moving platform spawn definition for levels
 */
export interface MovingPlatformSpawn {
  /** Movement pattern */
  pattern: MovementPattern
  
  /** Start position in grid coordinates */
  start: GridPosition
  
  /** End position in grid coordinates */
  end: GridPosition
  
  /** Platform width in tiles */
  widthTiles: number
  
  /** Platform height in tiles (usually 1) */
  heightTiles?: number
  
  /** Movement speed in pixels per second */
  speed?: number
  
  /** Render color */
  color?: string
}

/**
 * Default values for moving platforms
 */
export const PLATFORM_DEFAULTS = {
  /** Default height in tiles */
  HEIGHT_TILES: 1,
  
  /** Default speed in pixels per second */
  SPEED: 120,
  
  /** Default color */
  COLOR: '#805ad5', // Purple
} as const

/**
 * Generate unique platform ID
 */
let platformIdCounter = 0
export function generatePlatformId(): string {
  return `platform_${Date.now()}_${platformIdCounter++}`
}

/**
 * Reset platform ID counter (for testing)
 */
export function resetPlatformIdCounter(): void {
  platformIdCounter = 0
}
