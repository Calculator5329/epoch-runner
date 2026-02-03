import { makeAutoObservable } from 'mobx'
import { TILE_SIZE } from '../core/constants'
import type { 
  MovingPlatform, 
  MovingPlatformSpawn 
} from '../core/types/movingPlatforms'
import {
  PLATFORM_DEFAULTS,
  generatePlatformId,
  resetPlatformIdCounter
} from '../core/types/movingPlatforms'

/**
 * MovingPlatformStore - Manages all moving platforms in the level
 * 
 * Handles platform spawning, movement, and player interaction.
 * Moving platforms are solid dynamic tiles that player can ride.
 */
export class MovingPlatformStore {
  /** Map of active platforms by ID */
  platforms: Map<string, MovingPlatform> = new Map()
  
  /** Original spawn data for level reset */
  private originalSpawns: MovingPlatformSpawn[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Platform Creation & Destruction
  // ============================================

  /**
   * Spawn a moving platform from spawn data
   */
  spawn(spawnData: MovingPlatformSpawn): MovingPlatform {
    // Convert grid positions to world pixels
    const startX = spawnData.start.col * TILE_SIZE
    const startY = spawnData.start.row * TILE_SIZE
    const endX = spawnData.end.col * TILE_SIZE
    const endY = spawnData.end.row * TILE_SIZE
    
    // Apply defaults
    const width = spawnData.widthTiles * TILE_SIZE
    const height = (spawnData.heightTiles ?? PLATFORM_DEFAULTS.HEIGHT_TILES) * TILE_SIZE
    const speed = spawnData.speed ?? PLATFORM_DEFAULTS.SPEED
    const color = spawnData.color ?? PLATFORM_DEFAULTS.COLOR
    
    const platform: MovingPlatform = {
      id: generatePlatformId(),
      pattern: spawnData.pattern,
      x: startX,
      y: startY,
      width,
      height,
      vx: 0,
      vy: 0,
      startX,
      startY,
      endX,
      endY,
      speed,
      direction: 1, // Start moving toward end
      isActive: true,
      color,
    }
    
    this.platforms.set(platform.id, platform)
    return platform
  }

  /**
   * Remove a platform from the world
   */
  despawn(id: string): void {
    this.platforms.delete(id)
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get platform by ID
   */
  get(id: string): MovingPlatform | undefined {
    return this.platforms.get(id)
  }

  /**
   * Get all active platforms
   */
  getActive(): MovingPlatform[] {
    return [...this.platforms.values()].filter(p => p.isActive)
  }

  /**
   * Count of active platforms
   */
  get activeCount(): number {
    return this.getActive().length
  }

  // ============================================
  // Level Management
  // ============================================

  /**
   * Load platforms from level spawn data
   */
  loadFromLevel(spawns: MovingPlatformSpawn[]): void {
    // Store original spawns for reset
    this.originalSpawns = spawns.map(s => ({ ...s }))
    
    // Clear existing platforms
    this.clear()
    
    // Spawn all platforms
    for (const spawn of spawns) {
      this.spawn(spawn)
    }
  }

  /**
   * Reset platforms to original level state
   * Called when player dies or restarts level
   */
  reset(): void {
    this.clear()
    resetPlatformIdCounter()
    
    // Respawn from original data
    for (const spawn of this.originalSpawns) {
      this.spawn(spawn)
    }
  }

  /**
   * Clear all platforms
   */
  clear(): void {
    this.platforms.clear()
  }

  /**
   * Full reset including original spawns
   * Called when loading a new level
   */
  fullReset(): void {
    this.clear()
    this.originalSpawns = []
    resetPlatformIdCounter()
  }
}
