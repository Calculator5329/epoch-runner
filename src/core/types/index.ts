// Collision types for tiles
export enum CollisionType {
  EMPTY = 0,
  SOLID = 1,
  GOAL = 2,
  PLATFORM = 3,  // Future: pass-through from below
  HAZARD = 4,    // Future: triggers damage
}

// Input state snapshot consumed each frame
export interface InputState {
  left: boolean
  right: boolean
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
