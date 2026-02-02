/**
 * Shapes Module - Barrel Export
 * 
 * This module provides the collision shape system and tile type definitions.
 * Import from './shapes' or './shapes/index' to get all exports.
 */

// Collision shapes
export {
  SHAPES,
  type CollisionShape,
  type NormalizedPoint,
  type NormalizedRect,
} from './collision'

// Tile types
export {
  TileTypeId,
  type TileType,
} from './tile-types'

// Tile colors
export { TILE_COLORS } from './tile-colors'

// Tile registry
export { TILE_TYPES } from './tile-registry'

// Tile helpers and initialization
export {
  getTileType,
  isTileTypeSolid,
  isTileTypeHazard,
  isTileTypePickup,
  isTileTypeTrigger,
  isTileTypePlatform,
  initBuiltInTiles,
} from './tile-helpers'
