// Legacy collision types (kept for backward compatibility)
// New code should use TileTypeId from shapes.ts
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

// Level data structure
export interface LevelData {
  width: number
  height: number
  collision: CollisionType[][]
  playerSpawn: Vector2
}

// Bounding box for collision detection
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
