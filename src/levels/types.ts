import { CollisionType } from '../core/types'

/**
 * Position in grid coordinates (tiles, not pixels)
 */
export interface GridPosition {
  col: number
  row: number
}

/**
 * A tile placement instruction for level building
 */
export interface TilePlacement {
  col: number
  row: number
  type: CollisionType
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
  
  // Dimensions (in tiles)
  width: number
  height: number
  
  // Player spawn position (grid coordinates)
  playerSpawn: GridPosition
  
  // Collision grid - 2D array of CollisionType
  // collision[row][col] - row-major order
  collision: CollisionType[][]
  
  // Optional: Par time for time-star (seconds)
  parTime?: number
  
  // Optional: Theme ID for visual styling (future)
  themeId?: string
}

/**
 * Level definition for JSON serialization (player spawn as object)
 */
export interface LevelJSON {
  id: string
  name: string
  description?: string
  author?: string
  width: number
  height: number
  playerSpawn: { col: number; row: number }
  collision: number[][]  // CollisionType values as numbers
  parTime?: number
  themeId?: string
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
    width: level.width,
    height: level.height,
    playerSpawn: { col: level.playerSpawn.col, row: level.playerSpawn.row },
    collision: level.collision.map(row => row.map(tile => tile as number)),
    parTime: level.parTime,
    themeId: level.themeId,
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
    width: json.width,
    height: json.height,
    playerSpawn: { col: json.playerSpawn.col, row: json.playerSpawn.row },
    collision: json.collision.map(row => row.map(tile => tile as CollisionType)),
    parTime: json.parTime,
    themeId: json.themeId,
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
  if (level.collision[level.playerSpawn.row]?.[level.playerSpawn.col] === CollisionType.SOLID) {
    errors.push('Player spawn is inside a solid tile')
  }
  
  // Check there's at least one goal
  let hasGoal = false
  for (const row of level.collision) {
    if (row.includes(CollisionType.GOAL)) {
      hasGoal = true
      break
    }
  }
  if (!hasGoal) {
    errors.push('Level has no goal tile')
  }
  
  return errors
}
