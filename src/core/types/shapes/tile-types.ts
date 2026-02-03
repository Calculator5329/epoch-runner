import type { CollisionShape } from './collision'

/**
 * Tile type definition with collision shape and visual info
 */
export interface TileType {
  id: number
  name: string
  category: 'solid' | 'hazard' | 'pickup' | 'trigger' | 'decoration'
  collision: CollisionShape
  color: string  // MVP color, replaced by sprite later
}

/**
 * Tile type IDs (used in collision grid)
 */
export const TileTypeId = {
  EMPTY: 0,
  
  // Solid blocks (1-49)
  SOLID_FULL: 1,
  SOLID_HALF_LEFT: 2,
  SOLID_HALF_RIGHT: 3,
  SOLID_HALF_TOP: 4,
  SOLID_HALF_BOTTOM: 5,
  SOLID_QUARTER_TL: 6,
  SOLID_QUARTER_TR: 7,
  SOLID_QUARTER_BL: 8,
  SOLID_QUARTER_BR: 9,
  SOLID_SLOPE_UP_RIGHT: 10,
  SOLID_SLOPE_UP_LEFT: 11,
  SOLID_SLOPE_DOWN_RIGHT: 12,
  SOLID_SLOPE_DOWN_LEFT: 13,
  
  // Custom solid blocks (14-23) - same collision, different sprites
  SOLID_BRICK: 14,
  SOLID_STONE: 15,
  SOLID_METAL: 16,
  SOLID_WOOD: 17,
  SOLID_ICE: 18,
  SOLID_GRASS: 19,
  SOLID_SAND: 20,
  SOLID_DIRT: 21,
  SOLID_CRYSTAL: 22,
  SOLID_LAVA_ROCK: 23,
  
  // One-way platforms (50-59)
  PLATFORM_FULL: 50,
  PLATFORM_HALF_LEFT: 51,
  PLATFORM_HALF_RIGHT: 52,
  
  // Hazards (60-79)
  HAZARD_FULL: 60,
  HAZARD_SPIKE_UP: 61,
  HAZARD_SPIKE_DOWN: 62,
  HAZARD_SPIKE_LEFT: 63,
  HAZARD_SPIKE_RIGHT: 64,
  
  // Pickups (80-99)
  COIN: 80,
  POWERUP_TRIPLE_JUMP: 81,
  POWERUP_SPEED: 82,
  POWERUP_SUPER_JUMP: 83,
  POWERUP_INVINCIBILITY: 84,
  
  // Triggers (100-119)
  GOAL: 100,
  CHECKPOINT: 101,
} as const

export type TileTypeId = typeof TileTypeId[keyof typeof TileTypeId]
