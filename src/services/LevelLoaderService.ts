import { TILE_SIZE } from '../core/constants'
import type { LevelStore } from '../stores/LevelStore'
import type { CameraStore } from '../stores/CameraStore'
import type { PlayerStore } from '../stores/PlayerStore'
import type { GameStore } from '../stores/GameStore'
import type { EntityStore } from '../stores/EntityStore'
import type { AssetStore } from '../stores/AssetStore'
import type { MovingPlatformStore } from '../stores/MovingPlatformStore'
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
    entityStore?: EntityStore,
    assetStore?: AssetStore,
    movingPlatformStore?: MovingPlatformStore
  ): boolean {
    const level = getLevel(levelId)
    if (!level) {
      console.error(`Level not found: ${levelId}`)
      return false
    }

    return this.loadLevel(level, levelStore, cameraStore, playerStore, gameStore, entityStore, assetStore, movingPlatformStore)
  }

  /**
   * Load the default level
   */
  loadDefault(
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore,
    assetStore?: AssetStore,
    movingPlatformStore?: MovingPlatformStore
  ): boolean {
    return this.loadFromRegistry(DEFAULT_LEVEL_ID, levelStore, cameraStore, playerStore, gameStore, entityStore, assetStore, movingPlatformStore)
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
    entityStore?: EntityStore,
    assetStore?: AssetStore,
    movingPlatformStore?: MovingPlatformStore
  ): { success: boolean; errors: string[] } {
    try {
      const level = jsonToLevel(json)
      const errors = validateLevel(level)
      
      if (errors.length > 0) {
        return { success: false, errors }
      }

      const success = this.loadLevel(level, levelStore, cameraStore, playerStore, gameStore, entityStore, assetStore, movingPlatformStore)
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
   * 
   * @param preserveCustomAssets - If true, don't clear custom assets (backgrounds, sprites)
   *   that were uploaded by the user. Used when testing editor levels.
   */
  loadLevel(
    level: LevelDefinition,
    levelStore: LevelStore,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    entityStore?: EntityStore,
    assetStore?: AssetStore,
    movingPlatformStore?: MovingPlatformStore,
    preserveCustomAssets: boolean = false
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

    // Load moving platforms
    if (movingPlatformStore) {
      movingPlatformStore.fullReset()
      if (level.movingPlatforms && level.movingPlatforms.length > 0) {
        movingPlatformStore.loadFromLevel(level.movingPlatforms)
        console.log(`Loaded ${level.movingPlatforms.length} moving platforms`)
      }
    }

    // Handle background image
    if (assetStore && level.backgroundUrl) {
      // Level specifies a background URL - load it
      this.loadBackgroundImage(level.backgroundUrl, assetStore)
    } else if (assetStore && !level.backgroundUrl && !preserveCustomAssets) {
      // No background URL and not preserving custom assets - clear background
      // This happens when loading campaign levels that don't have backgrounds
      assetStore.setBackground(undefined as unknown as HTMLImageElement)
    }
    // When preserveCustomAssets is true and no backgroundUrl, keep existing background
    // (e.g., user-uploaded background when testing editor level)

    // Handle player sprites
    if (assetStore && level.playerSprites) {
      // Level specifies player sprites - load them
      this.loadPlayerSprites(level.playerSprites, assetStore)
    } else if (assetStore && !level.playerSprites && !preserveCustomAssets) {
      // No player sprites and not preserving custom assets - clear them
      assetStore.setPlayerSprites({})
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
   * Load a background image from URL and set it in the asset store
   */
  private loadBackgroundImage(url: string, assetStore: AssetStore): void {
    const img = new Image()
    img.onload = () => {
      assetStore.setBackground(img)
      console.log(`Loaded background image: ${url}`)
    }
    img.onerror = () => {
      console.error(`Failed to load background image: ${url}`)
    }
    img.src = url
  }

  /**
   * Load player sprites from URLs and set them in the asset store
   */
  private loadPlayerSprites(
    sprites: { idle?: string; run1?: string; run2?: string; jump?: string },
    assetStore: AssetStore
  ): void {
    const loadedSprites: {
      idle?: HTMLImageElement
      run1?: HTMLImageElement
      run2?: HTMLImageElement
      jump?: HTMLImageElement
    } = {}

    let loadCount = 0
    const totalToLoad = Object.values(sprites).filter(Boolean).length

    const checkComplete = () => {
      loadCount++
      if (loadCount >= totalToLoad) {
        assetStore.setPlayerSprites(loadedSprites)
        console.log(`Loaded ${totalToLoad} player sprites`)
      }
    }

    if (sprites.idle) {
      const img = new Image()
      img.onload = () => {
        loadedSprites.idle = img
        checkComplete()
      }
      img.onerror = () => {
        console.error(`Failed to load idle sprite: ${sprites.idle}`)
        checkComplete()
      }
      img.src = sprites.idle
    }

    if (sprites.run1) {
      const img = new Image()
      img.onload = () => {
        loadedSprites.run1 = img
        checkComplete()
      }
      img.onerror = () => {
        console.error(`Failed to load run1 sprite: ${sprites.run1}`)
        checkComplete()
      }
      img.src = sprites.run1
    }

    if (sprites.run2) {
      const img = new Image()
      img.onload = () => {
        loadedSprites.run2 = img
        checkComplete()
      }
      img.onerror = () => {
        console.error(`Failed to load run2 sprite: ${sprites.run2}`)
        checkComplete()
      }
      img.src = sprites.run2
    }

    if (sprites.jump) {
      const img = new Image()
      img.onload = () => {
        loadedSprites.jump = img
        checkComplete()
      }
      img.onerror = () => {
        console.error(`Failed to load jump sprite: ${sprites.jump}`)
        checkComplete()
      }
      img.src = sprites.jump
    }
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
