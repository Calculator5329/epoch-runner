/**
 * Collision Shape System
 * 
 * Grid is for placement; collision shapes define actual physics boundaries.
 * Shapes are normalized to 0-1 range relative to tile size.
 */

// Normalized point (0-1 range within a tile)
export interface NormalizedPoint {
  x: number  // 0 = left edge, 1 = right edge
  y: number  // 0 = top edge, 1 = bottom edge
}

// Normalized rectangle (0-1 range within a tile)
export interface NormalizedRect {
  x: number      // left edge (0-1)
  y: number      // top edge (0-1)
  w: number      // width (0-1)
  h: number      // height (0-1)
}

// Collision shape definition
export interface CollisionShape {
  type: 'none' | 'rect' | 'polygon'
  rect?: NormalizedRect
  vertices?: NormalizedPoint[]  // For polygon type
}

// Tile type definition with collision shape and visual info
export interface TileType {
  id: number
  name: string
  category: 'solid' | 'hazard' | 'pickup' | 'trigger' | 'decoration'
  collision: CollisionShape
  color: string  // MVP color, replaced by sprite later
}

// ============================================
// Predefined Collision Shapes
// ============================================

export const SHAPES = {
  // No collision
  NONE: { type: 'none' } as CollisionShape,
  
  // Full tile
  FULL: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 1, h: 1 } 
  } as CollisionShape,
  
  // Half blocks (horizontal)
  HALF_LEFT: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 0.5, h: 1 } 
  } as CollisionShape,
  
  HALF_RIGHT: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0, w: 0.5, h: 1 } 
  } as CollisionShape,
  
  // Half blocks (vertical)
  HALF_TOP: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 1, h: 0.5 } 
  } as CollisionShape,
  
  HALF_BOTTOM: { 
    type: 'rect', 
    rect: { x: 0, y: 0.5, w: 1, h: 0.5 } 
  } as CollisionShape,
  
  // Quarter blocks
  QUARTER_TL: { 
    type: 'rect', 
    rect: { x: 0, y: 0, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_TR: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_BL: { 
    type: 'rect', 
    rect: { x: 0, y: 0.5, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  QUARTER_BR: { 
    type: 'rect', 
    rect: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 } 
  } as CollisionShape,
  
  // Slopes (triangles) - vertices in clockwise order
  SLOPE_UP_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 1 },   // bottom-left
      { x: 1, y: 1 },   // bottom-right
      { x: 1, y: 0 },   // top-right
    ]
  } as CollisionShape,
  
  SLOPE_UP_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 0, y: 1 },   // bottom-left
      { x: 1, y: 1 },   // bottom-right
    ]
  } as CollisionShape,
  
  SLOPE_DOWN_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 1, y: 0 },   // top-right
      { x: 1, y: 1 },   // bottom-right
    ]
  } as CollisionShape,
  
  SLOPE_DOWN_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0 },   // top-left
      { x: 1, y: 0 },   // top-right
      { x: 0, y: 1 },   // bottom-left
    ]
  } as CollisionShape,
  
  // Spike shapes (thin triangles for hazards)
  SPIKE_UP: {
    type: 'polygon',
    vertices: [
      { x: 0.2, y: 1 },   // bottom-left
      { x: 0.8, y: 1 },   // bottom-right
      { x: 0.5, y: 0.2 }, // top point
    ]
  } as CollisionShape,
  
  SPIKE_DOWN: {
    type: 'polygon',
    vertices: [
      { x: 0.2, y: 0 },   // top-left
      { x: 0.5, y: 0.8 }, // bottom point
      { x: 0.8, y: 0 },   // top-right
    ]
  } as CollisionShape,
  
  SPIKE_LEFT: {
    type: 'polygon',
    vertices: [
      { x: 1, y: 0.2 },   // top-right
      { x: 1, y: 0.8 },   // bottom-right
      { x: 0.2, y: 0.5 }, // left point
    ]
  } as CollisionShape,
  
  SPIKE_RIGHT: {
    type: 'polygon',
    vertices: [
      { x: 0, y: 0.2 },   // top-left
      { x: 0.8, y: 0.5 }, // right point
      { x: 0, y: 0.8 },   // bottom-left
    ]
  } as CollisionShape,
  
  // Small centered shape for pickups (coins, powerups)
  PICKUP: {
    type: 'rect',
    rect: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 }
  } as CollisionShape,
} as const

// ============================================
// Tile Type Registry
// ============================================

// Tile type IDs (used in collision grid)
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
  
  // Custom solid blocks (14-29) - same collision, different sprites
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

// MVP colors for tile types
export const TILE_COLORS = {
  empty: '#16213e',
  solid: '#4a5568',
  platform: '#9f7aea',
  hazard: '#e53e3e',
  coin: '#f6e05e',
  powerup: '#48bb78',       // Green for triple jump power-up
  speedBoost: '#f6ad55',    // Orange for speed boost
  superJump: '#9f7aea',     // Purple for super jump
  invincibility: '#ffd700', // Gold for invincibility
  goal: '#48bb78',
  checkpoint: '#4299e1',
  // Custom solid colors (for different sprite themes)
  brick: '#8b4513',     // Saddle brown
  stone: '#708090',     // Slate gray
  metal: '#71797E',     // Steel gray
  wood: '#deb887',      // Burlywood tan
  ice: '#b0e0e6',       // Powder blue
  grass: '#228b22',     // Forest green
  sand: '#f4a460',      // Sandy brown
  dirt: '#8b5a2b',      // Sienna brown
  crystal: '#e066ff',   // Medium orchid
  lavaRock: '#4a0404',  // Dark red/maroon
} as const

// Tile type definitions registry
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

// Helper to get tile type by ID
export function getTileType(id: number): TileType {
  return TILE_TYPES[id as TileTypeId] || TILE_TYPES[TileTypeId.EMPTY]
}

// Helper to check if tile type is solid (blocks movement)
export function isTileTypeSolid(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'solid'
}

// Helper to check if tile type is a hazard
export function isTileTypeHazard(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'hazard'
}

// Helper to check if tile type is a pickup
export function isTileTypePickup(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'pickup'
}

// Helper to check if tile type is a trigger
export function isTileTypeTrigger(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'trigger'
}

// Helper to check if tile type is a one-way platform
export function isTileTypePlatform(id: number): boolean {
  return id >= TileTypeId.PLATFORM_FULL && id <= TileTypeId.PLATFORM_HALF_RIGHT
}
