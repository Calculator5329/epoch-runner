import { createContext, useContext } from 'react'
import { GameStore } from './GameStore'
import { PlayerStore } from './PlayerStore'
import { LevelStore } from './LevelStore'
import { CameraStore } from './CameraStore'
import { levelLoaderService } from '../services/LevelLoaderService'
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

  constructor() {
    this.gameStore = new GameStore()
    this.playerStore = new PlayerStore()
    this.levelStore = new LevelStore()
    this.cameraStore = new CameraStore()
  }

  /**
   * Initialize game state - loads default level
   */
  init(): void {
    // Load the default level from registry
    levelLoaderService.loadDefault(
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
  }

  /**
   * Load a level by ID from the registry
   */
  loadLevel(levelId: string): boolean {
    return levelLoaderService.loadFromRegistry(
      levelId,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
  }

  /**
   * Load a level definition directly
   */
  loadLevelDefinition(level: LevelDefinition): boolean {
    return levelLoaderService.loadLevel(
      level,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
  }

  /**
   * Load a level from JSON data
   */
  loadLevelFromJSON(json: LevelJSON): { success: boolean; errors: string[] } {
    return levelLoaderService.loadFromJSON(
      json,
      this.levelStore,
      this.cameraStore,
      this.playerStore,
      this.gameStore
    )
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
   * Reset all stores for level restart
   */
  reset(): void {
    this.gameStore.reset()
    this.playerStore.reset(this.levelStore.playerSpawn)
    
    // Reset camera to player spawn
    const playerCenter = this.playerStore.center
    this.cameraStore.setPosition(
      playerCenter.x - this.cameraStore.viewportWidth / 2,
      playerCenter.y - this.cameraStore.viewportHeight / 2
    )
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
