/**
 * Registry Module - Barrel Export
 * 
 * Provides dynamic registration systems for:
 * - Levels (built-in + custom packs)
 * - Entities (enemies, collectibles, triggers)
 * - Tile types (for custom content)
 */

// Level Registry
export {
  levelRegistry,
  LevelRegistryClass,
  LEVEL_PRIORITY,
  type LevelSource,
  type RegisteredLevel,
} from './LevelRegistry'

// Entity Registry
export {
  entityRegistry,
  EntityRegistryClass,
  ENTITY_PRIORITY,
  type EntitySource,
  type EntityCategory,
  type RegisteredEntity,
} from './EntityRegistry'

// Tile Registry
export {
  tileRegistry,
  TileRegistryClass,
  TILE_PRIORITY,
  type TileSource,
  type RegisteredTile,
} from './TileRegistry'
