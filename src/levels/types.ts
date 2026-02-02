import { CollisionType, TileTypeId } from '../core/types'
import type { EntitySpawn } from '../core/types/entities'

/**
 * Position in grid coordinates (tiles, not pixels)
 */
export interface GridPosition {
  col: number
  row: number
}

/**
 * A tile placement instruction for level building
 * Supports both legacy CollisionType and new TileTypeId
 */
export interface TilePlacement {
  col: number
  row: number
  type: number  // CollisionType or TileTypeId
}

/**
 * Level difficulty rating
 */
export type LevelDifficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'unrated'

/**
 * Level metadata for discovery and filtering
 */
export interface LevelMetadata {
  /** Difficulty rating */
  difficulty?: LevelDifficulty
  
  /** Estimated completion time in seconds */
  estimatedTime?: number
  
  /** Tags for categorization and search */
  tags?: string[]
  
  /** Version of the level (for updates) */
  version?: string
  
  /** Creation timestamp */
  createdAt?: number
  
  /** Last modified timestamp */
  updatedAt?: number
  
  /** Level pack ID this level belongs to */
  packId?: string
  
  /** Source of the level (built-in, pack, firebase, user) */
  source?: 'built-in' | 'pack' | 'firebase' | 'user'
  
  /** Whether the level has been verified playable */
  verified?: boolean
  
  /** Minimum game version required */
  minGameVersion?: string
  
  /** Dependencies (other pack IDs required) */
  dependencies?: string[]
}

/**
 * Complete level definition - everything needed to load and play a level
 */
export interface LevelDefinition {
  // Metadata
  id: string
  name: string
  description?: string
  author?: string
  
  // Extended metadata
  metadata?: LevelMetadata
  
  // Dimensions (in tiles)
  width: number
  height: number
  
  // Player spawn position (grid coordinates)
  playerSpawn: GridPosition
  
  // Collision grid - 2D array of tile IDs
  // collision[row][col] - row-major order
  // Supports both CollisionType (legacy) and TileTypeId (new)
  collision: number[][]
  
  // Optional: Entity spawn data (enemies, etc.)
  entities?: EntitySpawn[]
  
  // Optional: Starting lives for this level (default 3)
  startingLives?: number
  
  // Optional: Par time for time-star (seconds)
  parTime?: number
  
  // Optional: Theme ID for visual styling (future)
  themeId?: string
  
  // Optional: Background image URL (relative to public/)
  backgroundUrl?: string
  
  // Optional: Player sprite URLs (relative to public/)
  playerSprites?: {
    idle?: string
    run1?: string
    run2?: string
    jump?: string
  }
}

/**
 * Entity spawn for JSON serialization
 */
export interface EntitySpawnJSON {
  definitionId: string
  position: { col: number; row: number }
  properties?: {
    startDirection?: 'left' | 'right'
    respawns?: boolean
    patrolRange?: number
  }
}

/**
 * Level definition for JSON serialization
 */
export interface LevelJSON {
  id: string
  name: string
  description?: string
  author?: string
  metadata?: LevelMetadata
  width: number
  height: number
  playerSpawn: { col: number; row: number }
  collision: number[][]
  entities?: EntitySpawnJSON[]
  startingLives?: number
  parTime?: number
  themeId?: string
  backgroundUrl?: string
  playerSprites?: {
    idle?: string
    run1?: string
    run2?: string
    jump?: string
  }
}

/**
 * Convert LevelDefinition to JSON-serializable format
 */
export function levelToJSON(level: LevelDefinition): LevelJSON {
  return {
    id: level.id,
    name: level.name,
    description: level.description,
    author: level.author,
    metadata: level.metadata,
    width: level.width,
    height: level.height,
    playerSpawn: { col: level.playerSpawn.col, row: level.playerSpawn.row },
    collision: level.collision.map(row => row.map(tile => tile as number)),
    entities: level.entities?.map(e => ({
      definitionId: e.definitionId,
      position: { col: e.position.col, row: e.position.row },
      properties: e.properties,
    })),
    startingLives: level.startingLives,
    parTime: level.parTime,
    themeId: level.themeId,
    backgroundUrl: level.backgroundUrl,
    playerSprites: level.playerSprites,
  }
}

/**
 * Convert JSON to LevelDefinition
 */
export function jsonToLevel(json: LevelJSON): LevelDefinition {
  return {
    id: json.id,
    name: json.name,
    description: json.description,
    author: json.author,
    metadata: json.metadata,
    width: json.width,
    height: json.height,
    playerSpawn: { col: json.playerSpawn.col, row: json.playerSpawn.row },
    collision: json.collision.map(row => [...row]),
    entities: json.entities?.map(e => ({
      definitionId: e.definitionId,
      position: { col: e.position.col, row: e.position.row },
      properties: e.properties,
    })),
    startingLives: json.startingLives,
    parTime: json.parTime,
    themeId: json.themeId,
    backgroundUrl: json.backgroundUrl,
    playerSprites: json.playerSprites,
  }
}

/**
 * Validate a level definition
 */
export function validateLevel(level: LevelDefinition): string[] {
  const errors: string[] = []
  
  // Check dimensions
  if (level.width < 1) errors.push('Level width must be at least 1')
  if (level.height < 1) errors.push('Level height must be at least 1')
  
  // Check collision grid matches dimensions
  if (level.collision.length !== level.height) {
    errors.push(`Collision grid has ${level.collision.length} rows, expected ${level.height}`)
  }
  
  for (let row = 0; row < level.collision.length; row++) {
    if (level.collision[row].length !== level.width) {
      errors.push(`Row ${row} has ${level.collision[row].length} columns, expected ${level.width}`)
    }
  }
  
  // Check player spawn is within bounds
  if (level.playerSpawn.col < 0 || level.playerSpawn.col >= level.width) {
    errors.push(`Player spawn column ${level.playerSpawn.col} is out of bounds`)
  }
  if (level.playerSpawn.row < 0 || level.playerSpawn.row >= level.height) {
    errors.push(`Player spawn row ${level.playerSpawn.row} is out of bounds`)
  }
  
  // Check player spawn is not inside a solid tile
  const spawnTile = level.collision[level.playerSpawn.row]?.[level.playerSpawn.col]
  const solidTileIds: number[] = [
    CollisionType.SOLID,
    TileTypeId.SOLID_FULL,
    TileTypeId.SOLID_HALF_LEFT,
    TileTypeId.SOLID_HALF_RIGHT,
    TileTypeId.SOLID_HALF_TOP,
    TileTypeId.SOLID_HALF_BOTTOM,
  ]
  if (solidTileIds.includes(spawnTile)) {
    errors.push('Player spawn is inside a solid tile')
  }
  
  // Check there's at least one goal
  let hasGoal = false
  const goalTileIds: number[] = [CollisionType.GOAL, TileTypeId.GOAL]
  for (const row of level.collision) {
    for (const tile of row) {
      if (goalTileIds.includes(tile)) {
        hasGoal = true
        break
      }
    }
    if (hasGoal) break
  }
  if (!hasGoal) {
    errors.push('Level has no goal tile')
  }
  
  return errors
}
