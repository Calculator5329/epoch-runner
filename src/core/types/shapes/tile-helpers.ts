import { TileTypeId, type TileType } from './tile-types'
import { TILE_TYPES } from './tile-registry'
import { tileRegistry } from '../../registry'

/**
 * Get tile type definition by ID
 * Uses the dynamic registry with fallback to static TILE_TYPES
 */
export function getTileType(id: number): TileType {
  // Try dynamic registry first
  const fromRegistry = tileRegistry.get(id as TileTypeId)
  if (fromRegistry) return fromRegistry
  
  // Fall back to static definitions
  return TILE_TYPES[id as TileTypeId] || TILE_TYPES[TileTypeId.EMPTY]
}

/**
 * Check if tile type is solid (blocks movement)
 */
export function isTileTypeSolid(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'solid'
}

/**
 * Check if tile type is a hazard
 */
export function isTileTypeHazard(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'hazard'
}

/**
 * Check if tile type is a pickup
 */
export function isTileTypePickup(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'pickup'
}

/**
 * Check if tile type is a trigger
 */
export function isTileTypeTrigger(id: number): boolean {
  const tileType = getTileType(id)
  return tileType.category === 'trigger'
}

/**
 * Check if tile type is a one-way platform
 */
export function isTileTypePlatform(id: number): boolean {
  return id >= TileTypeId.PLATFORM_FULL && id <= TileTypeId.PLATFORM_HALF_RIGHT
}

/**
 * Initialize the tile registry with built-in tile types
 * Should be called once at app startup
 */
export function initBuiltInTiles(): void {
  tileRegistry.registerFromRecord(TILE_TYPES, 'built-in')
}
