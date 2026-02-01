import { makeAutoObservable } from 'mobx'
import { TILE_SIZE } from '../core/constants'
import { CollisionType, type LevelData, type Vector2 } from '../core/types'
import type { LevelDefinition } from '../levels/types'

/**
 * LevelStore - Level data and collision queries
 * 
 * Manages the current level's collision grid and provides
 * efficient O(1) tile lookups for physics collision detection.
 */
export class LevelStore {
  // Level metadata
  currentLevelId: string | null = null
  currentLevelName: string | null = null

  // Dimensions (in tiles)
  width = 16
  height = 12
  
  // Collision grid
  collision: CollisionType[][] = []
  
  // Player spawn (world coordinates)
  playerSpawn: Vector2 = { x: 0, y: 0 }

  constructor() {
    makeAutoObservable(this)
    // Initialize with empty level
    this.collision = this.createEmptyGrid(this.width, this.height)
  }

  /**
   * Create an empty collision grid
   */
  private createEmptyGrid(width: number, height: number): CollisionType[][] {
    return Array.from({ length: height }, () =>
      Array.from({ length: width }, () => CollisionType.EMPTY)
    )
  }

  /**
   * Load a level from LevelDefinition
   */
  loadLevelDefinition(level: LevelDefinition): void {
    this.currentLevelId = level.id
    this.currentLevelName = level.name
    this.width = level.width
    this.height = level.height
    this.collision = level.collision.map(row => [...row]) // Deep copy
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
      this.collision = data.collision.map(row => [...row])
      this.playerSpawn = { ...data.playerSpawn }
    } else {
      // Reset to empty
      this.width = 16
      this.height = 12
      this.collision = this.createEmptyGrid(this.width, this.height)
      this.playerSpawn = { x: TILE_SIZE, y: 10 * TILE_SIZE }
    }
    this.currentLevelId = null
    this.currentLevelName = null
  }

  /**
   * Get tile collision type at grid coordinates
   * Returns SOLID for out-of-bounds (acts as walls at edges)
   */
  getTileAt(col: number, row: number): CollisionType {
    // Treat out-of-bounds as solid (invisible walls)
    if (col < 0 || col >= this.width || row < 0 || row >= this.height) {
      return CollisionType.SOLID
    }
    return this.collision[row][col]
  }

  /**
   * Set tile at grid coordinates
   */
  setTileAt(col: number, row: number, type: CollisionType): void {
    if (col >= 0 && col < this.width && row >= 0 && row < this.height) {
      this.collision[row][col] = type
    }
  }

  /**
   * Get tile collision type at world coordinates
   */
  getTileAtWorld(worldX: number, worldY: number): CollisionType {
    const col = Math.floor(worldX / TILE_SIZE)
    const row = Math.floor(worldY / TILE_SIZE)
    return this.getTileAt(col, row)
  }

  /**
   * Check if a tile is solid (blocks movement)
   */
  isSolidAt(col: number, row: number): boolean {
    const tile = this.getTileAt(col, row)
    return tile === CollisionType.SOLID
  }

  /**
   * Check if a tile is the goal
   */
  isGoalAt(col: number, row: number): boolean {
    const tile = this.getTileAt(col, row)
    return tile === CollisionType.GOAL
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
}
