import { TILE_SIZE } from '../core/constants'
import type { LevelStore } from '../stores/LevelStore'
import type { CameraStore } from '../stores/CameraStore'
import type { PlayerStore } from '../stores/PlayerStore'
import type { GameStore } from '../stores/GameStore'
import type { EntityStore } from '../stores/EntityStore'
import { 
  getLevel, 
  getLevelIds, 
  DEFAULT_LEVEL_ID,
  type LevelDefinition,
  type LevelJSON,
  jsonToLevel,
  levelToJSON,
  validateLevel,
} from '../levels'

/**
 * LevelLoaderService - Load levels from registry or JSON
 * 
 * Handles level loading, validation, and state initialization.
 */
class LevelLoaderService {
  /**
   * Load a level by ID from the registry
   */
  loadFromRegistry(
    levelId: string,
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore
  ): boolean {
    const level = getLevel(levelId)
    if (!level) {
      console.error(`Level not found: ${levelId}`)
      return false
    }

    return this.loadLevel(level, levelStore, cameraStore, playerStore, gameStore, entityStore)
  }

  /**
   * Load the default level
   */
  loadDefault(
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore
  ): boolean {
    return this.loadFromRegistry(DEFAULT_LEVEL_ID, levelStore, cameraStore, playerStore, gameStore, entityStore)
  }

  /**
   * Load a level from JSON data
   */
  loadFromJSON(
    json: LevelJSON,
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore
  ): { success: boolean; errors: string[] } {
    try {
      const level = jsonToLevel(json)
      const errors = validateLevel(level)
      
      if (errors.length > 0) {
        return { success: false, errors }
      }

      const success = this.loadLevel(level, levelStore, cameraStore, playerStore, gameStore, entityStore)
      return { success, errors: [] }
    } catch (error) {
      return { 
        success: false, 
        errors: [`Failed to parse level JSON: ${error}`] 
      }
    }
  }

  /**
   * Load a LevelDefinition into the game state
   */
  loadLevel(
    level: LevelDefinition,
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore
  ): boolean {
    // Validate the level
    const errors = validateLevel(level)
    if (errors.length > 0) {
      console.error('Level validation failed:', errors)
      return false
    }

    // Reset game state
    gameStore.reset()

    // Load level data into store
    levelStore.loadLevelDefinition(level)

    // Set up camera bounds
    cameraStore.setLevelBounds(level.width, level.height)

    // Spawn player at level's spawn point
    const spawnX = level.playerSpawn.col * TILE_SIZE
    const spawnY = level.playerSpawn.row * TILE_SIZE
    playerStore.reset({ x: spawnX, y: spawnY })

    // Load entities (enemies, etc.)
    if (entityStore) {
      entityStore.fullReset()
      if (level.entities && level.entities.length > 0) {
        entityStore.loadFromLevel(level.entities)
        console.log(`Loaded ${level.entities.length} entities`)
      }
    }

    // Center camera on player
    const playerCenter = playerStore.center
    cameraStore.setPosition(
      playerCenter.x - cameraStore.viewportWidth / 2,
      playerCenter.y - cameraStore.viewportHeight / 2
    )

    console.log(`Loaded level: ${level.name} (${level.width}x${level.height})`)
    return true
  }

  /**
   * Export current level to JSON
   */
  exportToJSON(levelStore: LevelStore): LevelJSON {
    const level: LevelDefinition = {
      id: levelStore.currentLevelId || 'exported_level',
      name: levelStore.currentLevelName || 'Exported Level',
      width: levelStore.width,
      height: levelStore.height,
      playerSpawn: {
        col: Math.floor(levelStore.playerSpawn.x / TILE_SIZE),
        row: Math.floor(levelStore.playerSpawn.y / TILE_SIZE),
      },
      collision: levelStore.collision,
    }
    
    return levelToJSON(level)
  }

  /**
   * Download level as JSON file
   */
  downloadLevel(levelStore: LevelStore, filename?: string): void {
    const json = this.exportToJSON(levelStore)
    const jsonString = JSON.stringify(json, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `${json.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Get list of available level IDs
   */
  getAvailableLevels(): string[] {
    return getLevelIds()
  }
}

// Singleton instance
export const levelLoaderService = new LevelLoaderService()
