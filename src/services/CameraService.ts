import type { CameraStore } from '../stores/CameraStore'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'

/**
 * CameraService - Stateless camera update logic
 * 
 * Handles camera following and bounds management.
 * Called each frame by the game loop.
 */
class CameraService {
  /**
   * Update camera to follow player
   * Called once per frame after physics update
   */
  update(
    deltaTime: number,
    cameraStore: CameraStore,
    playerStore: PlayerStore,
    _levelStore?: LevelStore
  ): void {
    // Get player center position
    const playerCenter = playerStore.center

    // Update camera to follow player
    cameraStore.follow(playerCenter.x, playerCenter.y, deltaTime)
  }

  /**
   * Initialize camera for a new level
   */
  initForLevel(
    cameraStore: CameraStore,
    levelStore: LevelStore,
    playerStore: PlayerStore
  ): void {
    // Set level bounds
    cameraStore.setLevelBounds(levelStore.width, levelStore.height)

    // Center camera on player
    const playerCenter = playerStore.center
    cameraStore.setPosition(
      playerCenter.x - cameraStore.viewportWidth / 2,
      playerCenter.y - cameraStore.viewportHeight / 2
    )
  }
}

// Singleton instance
export const cameraService = new CameraService()
