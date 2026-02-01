import { makeAutoObservable } from 'mobx'
import { TILE_SIZE } from '../core/constants'
import { CollisionType, type LevelData, type Vector2 } from '../core/types'
import { TileTypeId, isTileTypeSolid, isTileTypeHazard, isTileTypePlatform } from '../core/types/shapes'
import type { LevelDefinition } from '../levels/types'

/**
 * LevelStore - Level data and collision queries
 * 
 * Manages the current level's tile grid and provides
 * efficient O(1) tile lookups for physics collision detection.
 * 
 * Uses the new TileTypeId system for shapes, but maintains
 * backward compatibility with CollisionType for legacy levels.
 */
export class LevelStore {
  // Level metadata
  currentLevelId: string | null = null
  currentLevelName: string | null = null

  // Dimensions (in tiles)
  width = 16
  height = 12
  
  // Tile grid (stores TileTypeId values)
  // Note: For backward compatibility, also accepts legacy CollisionType values
  collision: number[][] = []
  
  // Original collision grid (for reset after collecting items)
  private originalCollision: number[][] = []
  
  // Player spawn (world coordinates)
  playerSpawn: Vector2 = { x: 0, y: 0 }
  
  // Starting lives for this level
  startingLives = 3

  constructor() {
    makeAutoObservable(this)
    // Initialize with empty level
    this.collision = this.createEmptyGrid(this.width, this.height)
    this.originalCollision = this.createEmptyGrid(this.width, this.height)
  }

  /**
   * Create an empty tile grid
   */
  private createEmptyGrid(width: number, height: number): number[][] {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => TileTypeId.EMPTY)
    )
  }

  /**
   * Convert legacy CollisionType to new TileTypeId (only for legacy levels)
   * 
   * Legacy levels use CollisionType values 0-4.
   * New levels use TileTypeId values which can overlap (e.g., SOLID_HALF_LEFT = 2).
   * 
   * We detect legacy levels by checking if all values are in the 0-4 range.
   * This is called with isLegacy=true only for legacy LevelData format.
   */
  private convertLegacyTile(tile: number, isLegacy: boolean): number {
    // Only convert if this is a legacy level
    if (!isLegacy) return tile
    
    // Convert legacy CollisionType to TileTypeId
    switch (tile) {
      case CollisionType.EMPTY:
        return TileTypeId.EMPTY
      case CollisionType.SOLID:
        return TileTypeId.SOLID_FULL
      case CollisionType.GOAL:
        return TileTypeId.GOAL
      case CollisionType.PLATFORM:
        return TileTypeId.PLATFORM_FULL
      case CollisionType.HAZARD:
        return TileTypeId.HAZARD_FULL
      default:
        return tile // Pass through unknown values
    }
  }

  /**
   * Load a level from LevelDefinition
   */
  loadLevelDefinition(level: LevelDefinition): void {
    // Validate required fields
    if (!level || !level.collision || !Array.isArray(level.collision)) {
      console.error('Invalid level definition: missing collision grid')
      return
    }
    if (level.collision.length !== level.height) {
      console.error(`Invalid level: collision grid height (${level.collision.length}) doesn't match declared height (${level.height})`)
      return
    }
    
    this.currentLevelId = level.id
    this.currentLevelName = level.name
    this.width = level.width
    this.height = level.height
    this.startingLives = level.startingLives ?? 3
    
    // Deep copy collision grid (no conversion needed - new format uses TileTypeId directly)
    this.collision = level.collision.map(row => [...row])
    this.originalCollision = level.collision.map(row => [...row])
    
    this.playerSpawn = {
      x: level.playerSpawn.col * TILE_SIZE,
      y: level.playerSpawn.row * TILE_SIZE,
    }
  }

  /**
   * Load a level from LevelData (legacy format)
   */
  loadLevel(data?: LevelData): void {
    if (data) {
      this.width = data.width
      this.height = data.height
      // Legacy format uses CollisionType values, so convert them
      this.collision = data.collision.map(row => 
        row.map(tile => this.convertLegacyTile(tile, true))
      )
      this.originalCollision = data.collision.map(row => 
        row.map(tile => this.convertLegacyTile(tile, true))
      )
      this.playerSpawn = { ...data.playerSpawn }
    } else {
      // Reset to empty
      this.width = 16
      this.height = 12
      this.collision = this.createEmptyGrid(this.width, this.height)
      this.originalCollision = this.createEmptyGrid(this.width, this.height)
      this.playerSpawn = { x: TILE_SIZE, y: 10 * TILE_SIZE }
    }
    this.currentLevelId = null
    this.currentLevelName = null
    this.startingLives = 3
  }

  /**
   * Reset level to original state (restores collected items)
   */
  resetToOriginal(): void {
    this.collision = this.originalCollision.map(row => [...row])
  }

  /**
   * Get tile type ID at grid coordinates
   * Returns SOLID_FULL for out-of-bounds (acts as walls at edges)
   */
  getTileAt(col: number, row: number): number {
    // Treat out-of-bounds as solid (invisible walls)
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return TileTypeId.SOLID_FULL
    }
    return this.collision[row][col]
  }

  /**
   * Set tile at grid coordinates
   */
  setTileAt(col: number, row: number, type: number): void {
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      this.collision[row][col] = type
    }
  }

  /**
   * Get tile type ID at world coordinates
   */
  getTileAtWorld(worldX: number, worldY: number): number {
    const col = Math.floor(worldX / TILE_SIZE)
    const row = Math.floor(worldY / TILE_SIZE)
    return this.getTileAt(col, row)
  }

  /**
   * Check if a tile blocks movement (solid category)
   */
  isSolidAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return isTileTypeSolid(tileId)
  }

  /**
   * Check if a tile is a hazard
   */
  isHazardAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return isTileTypeHazard(tileId)
  }

  /**
   * Check if a tile is a one-way platform
   */
  isPlatformAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return isTileTypePlatform(tileId)
  }

  /**
   * Check if a tile is the goal
   */
  isGoalAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return tileId === TileTypeId.GOAL
  }

  /**
   * Check if a tile is a checkpoint
   */
  isCheckpointAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return tileId === TileTypeId.CHECKPOINT
  }

  /**
   * Check if a tile is a coin
   */
  isCoinAt(col: number, row: number): boolean {
    const tileId = this.getTileAt(col, row)
    return tileId === TileTypeId.COIN
  }

  /**
   * Get level dimensions in pixels
   */
  get levelWidth(): number {
    return this.width * TILE_SIZE
  }

  get levelHeight(): number {
    return this.height * TILE_SIZE
  }

  // Legacy aliases
  get canvasWidth(): number {
    return this.levelWidth
  }

  get canvasHeight(): number {
    return this.levelHeight
  }

  /**
   * Convert current level to LevelDefinition format
   */
  toLevelDefinition(): LevelDefinition | null {
    if (!this.currentLevelId) return null
    
    return {
      id: this.currentLevelId,
      name: this.currentLevelName || 'Untitled',
      width: this.width,
      height: this.height,
      playerSpawn: {
        col: Math.floor(this.playerSpawn.x / TILE_SIZE),
        row: Math.floor(this.playerSpawn.y / TILE_SIZE),
      },
      collision: this.collision.map(row => [...row]),
      startingLives: this.startingLives,
    }
  }
}
