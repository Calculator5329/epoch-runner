import { createContext, useContext } from 'react'
import { TILE_SIZE } from '../core/constants'
import { GameStore } from './GameStore'
import { PlayerStore } from './PlayerStore'
import { LevelStore } from './LevelStore'
import { CameraStore } from './CameraStore'
import { CampaignStore } from './CampaignStore'
import { UIStore } from './UIStore'
import { EditorStore } from './EditorStore'
import { AssetStore } from './AssetStore'
import { levelLoaderService } from '../services/LevelLoaderService'
import { audioService } from '../services/AudioService'
import { CAMPAIGN_LEVELS, hasDoubleJumpUnlocked } from '../levels'
import type { LevelDefinition } from '../levels/types'
import type { LevelJSON } from '../levels/types'

/**
 * RootStore - Composes all stores and provides context
 * 
 * Single source of truth for all game state.
 * Stores can reference each other through the root.
 */
export class RootStore {
  gameStore: GameStore
  playerStore: PlayerStore
  levelStore: LevelStore
  cameraStore: CameraStore
  campaignStore: CampaignStore
  uiStore: UIStore
  editorStore: EditorStore
  assetStore: AssetStore

  constructor() {
    this.gameStore = new GameStore()
    this.playerStore = new PlayerStore()
    this.levelStore = new LevelStore()
    this.cameraStore = new CameraStore()
    this.campaignStore = new CampaignStore()
    this.uiStore = new UIStore()
    this.editorStore = new EditorStore()
    this.assetStore = new AssetStore()
  }

  /**
   * Initialize game state - loads first campaign level
   */
  init(): void {
    // Initialize campaign with available levels
    this.campaignStore.initCampaign(CAMPAIGN_LEVELS)
    
    // Start at intro screen - don't load level yet
    this.campaignStore.setScreenState('intro')
  }

  /**
   * Start the campaign from intro screen
   */
  startCampaign(): void {
    this.campaignStore.startCampaign()
    
    // Load first level
    const firstLevelId = CAMPAIGN_LEVELS[0]
    this.loadLevel(firstLevelId)
  }

  /**
   * Continue to next level after completing current one
   */
  continueToNextLevel(): void {
    const nextLevelId = this.campaignStore.advanceToNextLevel(CAMPAIGN_LEVELS)
    
    if (nextLevelId) {
      this.loadLevel(nextLevelId)
    }
    // If null, campaign is complete - campaignStore handles screen state
  }

  /**
   * Called when player reaches the goal
   */
  onLevelComplete(): void {
    const levelId = this.levelStore.currentLevelId
    const levelName = this.levelStore.currentLevelName
    
    if (!levelId) return
    
    // Get raw coins collected before completing (completeLevel doesn't reset this)
    const coinsCollected = this.gameStore.coinsThisAttempt
    
    // Complete level in GameStore (adds to wallet with replay multiplier)
    this.gameStore.completeLevel()
    
    // Record in campaign store with raw count
    this.campaignStore.onLevelComplete(levelId, levelName || 'Unknown', coinsCollected)
  }

  /**
   * Restart campaign from beginning
   */
  restartCampaign(): void {
    this.campaignStore.returnToIntro()
    this.gameStore.fullReset()
  }

  /**
   * Jump to a specific level (admin mode)
   */
  adminJumpToLevel(levelIndex: number): void {
    if (!this.campaignStore.isAdminMode) return
    
    const levelId = this.campaignStore.jumpToLevel(levelIndex, CAMPAIGN_LEVELS)
    if (levelId) {
      this.loadLevel(levelId)
    }
  }

  /**
   * Jump to a specific level by ID (admin mode)
   */
  adminJumpToLevelById(levelId: string): void {
    if (!this.campaignStore.isAdminMode) return
    
    const levelIndex = CAMPAIGN_LEVELS.indexOf(levelId)
    if (levelIndex !== -1) {
      this.adminJumpToLevel(levelIndex)
    }
  }

  /**
   * Load a level by ID from the registry
   */
  loadLevel(levelId: string): boolean {
    const success = levelLoaderService.loadFromRegistry(
      levelId,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
    
    if (success) {
      this.gameStore.initLevel(levelId, this.levelStore.startingLives)
      // Set base max jumps: 2 for level 4+, 1 for levels 0-3
      this.playerStore.setBaseMaxJumps(hasDoubleJumpUnlocked(levelId) ? 2 : 1)
    }
    
    return success
  }

  /**
   * Load a level definition directly
   */
  loadLevelDefinition(level: LevelDefinition): boolean {
    const success = levelLoaderService.loadLevel(
      level,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
    
    if (success) {
      this.gameStore.initLevel(level.id, level.startingLives ?? 3)
      // Set base max jumps: 2 for level 4+, 1 for levels 0-3
      this.playerStore.setBaseMaxJumps(hasDoubleJumpUnlocked(level.id) ? 2 : 1)
    }
    
    return success
  }

  /**
   * Load a level from JSON data
   */
  loadLevelFromJSON(json: LevelJSON): { success: boolean; errors: string[] } {
    const result = levelLoaderService.loadFromJSON(
      json,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
    
    if (result.success) {
      this.gameStore.initLevel(json.id, json.startingLives ?? 3)
      // Custom/imported levels get double jump by default
      this.playerStore.setBaseMaxJumps(hasDoubleJumpUnlocked(json.id) ? 2 : 1)
    }
    
    return result
  }

  /**
   * Export current level to JSON and download
   */
  downloadCurrentLevel(filename?: string): void {
    levelLoaderService.downloadLevel(this.levelStore, filename)
  }

  /**
   * Get available level IDs
   */
  getAvailableLevels(): string[] {
    return levelLoaderService.getAvailableLevels()
  }

  /**
   * Respawn player after death (at checkpoint or level start)
   */
  respawnPlayer(): void {
    // Record death in campaign stats
    this.campaignStore.recordDeath()
    
    const checkpoint = this.gameStore.spawnPosition
    
    let spawnPos = this.levelStore.playerSpawn
    if (checkpoint) {
      // Convert grid to world coordinates
      spawnPos = {
        x: checkpoint.col * TILE_SIZE,
        y: checkpoint.row * TILE_SIZE,
      }
    }
    
    // Reset level to restore collected coins/powerups
    this.levelStore.resetToOriginal()
    
    this.playerStore.respawn(spawnPos)
    
    // Center camera on spawn
    const playerCenter = this.playerStore.center
    this.cameraStore.setPosition(
      playerCenter.x - this.cameraStore.viewportWidth / 2,
      playerCenter.y - this.cameraStore.viewportHeight / 2
    )
  }

  /**
   * Reset all stores for level restart (R key)
   */
  reset(): void {
    this.gameStore.reset()
    this.levelStore.resetToOriginal()
    this.playerStore.reset(this.levelStore.playerSpawn)
    
    // Reset camera to player spawn
    const playerCenter = this.playerStore.center
    this.cameraStore.setPosition(
      playerCenter.x - this.cameraStore.viewportWidth / 2,
      playerCenter.y - this.cameraStore.viewportHeight / 2
    )
  }

  /**
   * Teleport player to grid position (debug/admin tool)
   */
  teleport(col: number, row: number): void {
    this.playerStore.setPosition({
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
    })
    
    // Update camera to follow
    const playerCenter = this.playerStore.center
    this.cameraStore.setPosition(
      playerCenter.x - this.cameraStore.viewportWidth / 2,
      playerCenter.y - this.cameraStore.viewportHeight / 2
    )
  }

  /**
   * Sync audio from AssetStore to AudioService
   * Call this after loading a level pack with custom audio
   */
  syncAudioFromAssets(): void {
    // Clear previous audio
    audioService.clear()

    // Load music if available
    if (this.assetStore.music) {
      audioService.loadMusic(this.assetStore.music)
      audioService.playMusic()
    }

    // Load sound effects if available
    if (this.assetStore.sfx.size > 0) {
      for (const [name, url] of this.assetStore.sfx) {
        audioService.loadSfx(name, url)
      }
    }
  }

  /**
   * Clear custom assets and audio
   * Call this when returning to built-in levels
   */
  clearCustomAssets(): void {
    this.assetStore.clear()
    audioService.clear()
  }
}

// Create singleton instance
export const rootStore = new RootStore()

// React context
const RootStoreContext = createContext<RootStore | null>(null)

export const RootStoreProvider = RootStoreContext.Provider

/**
 * Hook to access the root store from React components
 */
export function useRootStore(): RootStore {
  const store = useContext(RootStoreContext)
  if (!store) {
    throw new Error('useRootStore must be used within RootStoreProvider')
  }
  return store
}

/**
 * Convenience hooks for individual stores
 */
export function useGameStore(): GameStore {
  return useRootStore().gameStore
}

export function usePlayerStore(): PlayerStore {
  return useRootStore().playerStore
}

export function useLevelStore(): LevelStore {
  return useRootStore().levelStore
}

export function useCameraStore(): CameraStore {
  return useRootStore().cameraStore
}

export function useCampaignStore(): CampaignStore {
  return useRootStore().campaignStore
}

export function useUIStore(): UIStore {
  return useRootStore().uiStore
}

export function useEditorStore(): EditorStore {
  return useRootStore().editorStore
}

export function useAssetStore(): AssetStore {
  return useRootStore().assetStore
}
