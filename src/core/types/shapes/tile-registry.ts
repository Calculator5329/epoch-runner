import { SHAPES } from './collision'
import { TileTypeId, type TileType } from './tile-types'
import { TILE_COLORS } from './tile-colors'

/**
 * Tile type definitions registry
 * Maps TileTypeId to full TileType definitions
 */
export const TILE_TYPES: Record<TileTypeId, TileType> = {
  [TileTypeId.EMPTY]: {
    id: TileTypeId.EMPTY,
    name: 'Empty',
    category: 'decoration',
    collision: SHAPES.NONE,
    color: TILE_COLORS.empty,
  },
  
  // Solid blocks
  [TileTypeId.SOLID_FULL]: {
    id: TileTypeId.SOLID_FULL,
    name: 'Solid Block',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_HALF_LEFT]: {
    id: TileTypeId.SOLID_HALF_LEFT,
    name: 'Half Block Left',
    category: 'solid',
    collision: SHAPES.HALF_LEFT,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_HALF_RIGHT]: {
    id: TileTypeId.SOLID_HALF_RIGHT,
    name: 'Half Block Right',
    category: 'solid',
    collision: SHAPES.HALF_RIGHT,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_HALF_TOP]: {
    id: TileTypeId.SOLID_HALF_TOP,
    name: 'Half Block Top',
    category: 'solid',
    collision: SHAPES.HALF_TOP,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_HALF_BOTTOM]: {
    id: TileTypeId.SOLID_HALF_BOTTOM,
    name: 'Half Block Bottom',
    category: 'solid',
    collision: SHAPES.HALF_BOTTOM,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_QUARTER_TL]: {
    id: TileTypeId.SOLID_QUARTER_TL,
    name: 'Quarter Block TL',
    category: 'solid',
    collision: SHAPES.QUARTER_TL,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_QUARTER_TR]: {
    id: TileTypeId.SOLID_QUARTER_TR,
    name: 'Quarter Block TR',
    category: 'solid',
    collision: SHAPES.QUARTER_TR,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_QUARTER_BL]: {
    id: TileTypeId.SOLID_QUARTER_BL,
    name: 'Quarter Block BL',
    category: 'solid',
    collision: SHAPES.QUARTER_BL,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_QUARTER_BR]: {
    id: TileTypeId.SOLID_QUARTER_BR,
    name: 'Quarter Block BR',
    category: 'solid',
    collision: SHAPES.QUARTER_BR,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_SLOPE_UP_RIGHT]: {
    id: TileTypeId.SOLID_SLOPE_UP_RIGHT,
    name: 'Slope Up Right',
    category: 'solid',
    collision: SHAPES.SLOPE_UP_RIGHT,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_SLOPE_UP_LEFT]: {
    id: TileTypeId.SOLID_SLOPE_UP_LEFT,
    name: 'Slope Up Left',
    category: 'solid',
    collision: SHAPES.SLOPE_UP_LEFT,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_SLOPE_DOWN_RIGHT]: {
    id: TileTypeId.SOLID_SLOPE_DOWN_RIGHT,
    name: 'Slope Down Right',
    category: 'solid',
    collision: SHAPES.SLOPE_DOWN_RIGHT,
    color: TILE_COLORS.solid,
  },
  [TileTypeId.SOLID_SLOPE_DOWN_LEFT]: {
    id: TileTypeId.SOLID_SLOPE_DOWN_LEFT,
    name: 'Slope Down Left',
    category: 'solid',
    collision: SHAPES.SLOPE_DOWN_LEFT,
    color: TILE_COLORS.solid,
  },
  
  // Custom solid blocks (same collision, different sprites)
  [TileTypeId.SOLID_BRICK]: {
    id: TileTypeId.SOLID_BRICK,
    name: 'Brick',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.brick,
  },
  [TileTypeId.SOLID_STONE]: {
    id: TileTypeId.SOLID_STONE,
    name: 'Stone',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.stone,
  },
  [TileTypeId.SOLID_METAL]: {
    id: TileTypeId.SOLID_METAL,
    name: 'Metal',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.metal,
  },
  [TileTypeId.SOLID_WOOD]: {
    id: TileTypeId.SOLID_WOOD,
    name: 'Wood',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.wood,
  },
  [TileTypeId.SOLID_ICE]: {
    id: TileTypeId.SOLID_ICE,
    name: 'Ice',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.ice,
  },
  [TileTypeId.SOLID_GRASS]: {
    id: TileTypeId.SOLID_GRASS,
    name: 'Grass',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.grass,
  },
  [TileTypeId.SOLID_SAND]: {
    id: TileTypeId.SOLID_SAND,
    name: 'Sand',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.sand,
  },
  [TileTypeId.SOLID_DIRT]: {
    id: TileTypeId.SOLID_DIRT,
    name: 'Dirt',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.dirt,
  },
  [TileTypeId.SOLID_CRYSTAL]: {
    id: TileTypeId.SOLID_CRYSTAL,
    name: 'Crystal',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.crystal,
  },
  [TileTypeId.SOLID_LAVA_ROCK]: {
    id: TileTypeId.SOLID_LAVA_ROCK,
    name: 'Lava Rock',
    category: 'solid',
    collision: SHAPES.FULL,
    color: TILE_COLORS.lavaRock,
  },
  
  // One-way platforms
  [TileTypeId.PLATFORM_FULL]: {
    id: TileTypeId.PLATFORM_FULL,
    name: 'Platform',
    category: 'solid',
    collision: SHAPES.HALF_TOP,  // Only top half collides
    color: TILE_COLORS.platform,
  },
  [TileTypeId.PLATFORM_HALF_LEFT]: {
    id: TileTypeId.PLATFORM_HALF_LEFT,
    name: 'Platform Half Left',
    category: 'solid',
    collision: SHAPES.QUARTER_TL,
    color: TILE_COLORS.platform,
  },
  [TileTypeId.PLATFORM_HALF_RIGHT]: {
    id: TileTypeId.PLATFORM_HALF_RIGHT,
    name: 'Platform Half Right',
    category: 'solid',
    collision: SHAPES.QUARTER_TR,
    color: TILE_COLORS.platform,
  },
  
  // Hazards
  [TileTypeId.HAZARD_FULL]: {
    id: TileTypeId.HAZARD_FULL,
    name: 'Hazard Block',
    category: 'hazard',
    collision: SHAPES.FULL,
    color: TILE_COLORS.hazard,
  },
  [TileTypeId.HAZARD_SPIKE_UP]: {
    id: TileTypeId.HAZARD_SPIKE_UP,
    name: 'Spike Up',
    category: 'hazard',
    collision: SHAPES.SPIKE_UP,
    color: TILE_COLORS.hazard,
  },
  [TileTypeId.HAZARD_SPIKE_DOWN]: {
    id: TileTypeId.HAZARD_SPIKE_DOWN,
    name: 'Spike Down',
    category: 'hazard',
    collision: SHAPES.SPIKE_DOWN,
    color: TILE_COLORS.hazard,
  },
  [TileTypeId.HAZARD_SPIKE_LEFT]: {
    id: TileTypeId.HAZARD_SPIKE_LEFT,
    name: 'Spike Left',
    category: 'hazard',
    collision: SHAPES.SPIKE_LEFT,
    color: TILE_COLORS.hazard,
  },
  [TileTypeId.HAZARD_SPIKE_RIGHT]: {
    id: TileTypeId.HAZARD_SPIKE_RIGHT,
    name: 'Spike Right',
    category: 'hazard',
    collision: SHAPES.SPIKE_RIGHT,
    color: TILE_COLORS.hazard,
  },
  
  // Pickups
  [TileTypeId.COIN]: {
    id: TileTypeId.COIN,
    name: 'Coin',
    category: 'pickup',
    collision: SHAPES.PICKUP,
    color: TILE_COLORS.coin,
  },
  [TileTypeId.POWERUP_TRIPLE_JUMP]: {
    id: TileTypeId.POWERUP_TRIPLE_JUMP,
    name: 'Triple Jump',
    category: 'pickup',
    collision: SHAPES.PICKUP,
    color: TILE_COLORS.powerup,
  },
  [TileTypeId.POWERUP_SPEED]: {
    id: TileTypeId.POWERUP_SPEED,
    name: 'Speed Boost',
    category: 'pickup',
    collision: SHAPES.PICKUP,
    color: TILE_COLORS.speedBoost,
  },
  [TileTypeId.POWERUP_SUPER_JUMP]: {
    id: TileTypeId.POWERUP_SUPER_JUMP,
    name: 'Super Jump',
    category: 'pickup',
    collision: SHAPES.PICKUP,
    color: TILE_COLORS.superJump,
  },
  [TileTypeId.POWERUP_INVINCIBILITY]: {
    id: TileTypeId.POWERUP_INVINCIBILITY,
    name: 'Invincibility',
    category: 'pickup',
    collision: SHAPES.PICKUP,
    color: TILE_COLORS.invincibility,
  },
  
  // Triggers
  [TileTypeId.GOAL]: {
    id: TileTypeId.GOAL,
    name: 'Goal',
    category: 'trigger',
    collision: SHAPES.FULL,
    color: TILE_COLORS.goal,
  },
  [TileTypeId.CHECKPOINT]: {
    id: TileTypeId.CHECKPOINT,
    name: 'Checkpoint',
    category: 'trigger',
    collision: SHAPES.FULL,
    color: TILE_COLORS.checkpoint,
  },
}
