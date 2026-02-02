/**
 * Core Types Module - Barrel Export
 * 
 * Re-exports all core types and provides legacy compatibility.
 */

/**
 * @deprecated Legacy collision type system. 
 * Use TileTypeId from shapes.ts instead.
 * Kept for backward compatibility with legacy level loading.
 */
export const CollisionType = {
  EMPTY: 0,
  SOLID: 1,
  GOAL: 2,
  PLATFORM: 3,
  HAZARD: 4,
} as const
export type CollisionType = typeof CollisionType[keyof typeof CollisionType]

// Re-export shape system
export * from './shapes'

// Re-export entity types
export * from './entities'

// Input state snapshot consumed each frame
export interface InputState {
  left: boolean
  right: boolean
  up: boolean      // For noclip fly up
  down: boolean    // For noclip fly down
  jump: boolean
  jumpJustPressed: boolean
}

// Vector2 for positions and velocities
export interface Vector2 {
  x: number
  y: number
}

/**
 * @deprecated Legacy level data structure.
 * Use LevelDefinition from levels/types.ts instead.
 */
export interface LevelData {
  width: number
  height: number
  collision: CollisionType[][]
  playerSpawn: Vector2
}
