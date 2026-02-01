import { TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from '../core/constants'
import { CollisionType } from '../core/types'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'

/**
 * PhysicsService - Stateless physics and collision logic
 * 
 * Handles gravity, movement, and collision detection/response.
 * Reads from stores, writes position updates back to PlayerStore.
 */
class PhysicsService {
  /**
   * Main physics update - called once per frame
   */
  update(
    deltaTime: number,
    playerStore: PlayerStore,
    levelStore: LevelStore,
    gameStore: GameStore
  ): void {
    // Don't update if game is paused or complete
    if (gameStore.isPaused || gameStore.levelComplete) {
      return
    }

    // Apply gravity
    playerStore.vy += GRAVITY * deltaTime
    
    // Cap fall speed
    if (playerStore.vy > MAX_FALL_SPEED) {
      playerStore.vy = MAX_FALL_SPEED
    }

    // Calculate intended movement
    const moveX = playerStore.vx * deltaTime
    const moveY = playerStore.vy * deltaTime

    // Move and collide horizontally first
    this.moveHorizontal(playerStore, levelStore, moveX)
    
    // Then move and collide vertically
    this.moveVertical(playerStore, levelStore, moveY)

    // Check for goal collision
    this.checkGoal(playerStore, levelStore, gameStore)
  }

  /**
   * Move player horizontally with collision detection
   */
  private moveHorizontal(
    player: PlayerStore,
    level: LevelStore,
    moveX: number
  ): void {
    if (moveX === 0) return

    const newX = player.x + moveX

    // Check collision at new position
    if (this.checkHorizontalCollision(newX, player.y, player.width, player.height, level)) {
      // Hit a wall - snap to tile edge
      if (moveX > 0) {
        // Moving right - snap to left edge of tile
        const rightEdge = newX + player.width
        const tileCol = Math.floor(rightEdge / TILE_SIZE)
        player.x = tileCol * TILE_SIZE - player.width
      } else {
        // Moving left - snap to right edge of tile
        const tileCol = Math.floor(newX / TILE_SIZE)
        player.x = (tileCol + 1) * TILE_SIZE
      }
      player.vx = 0
    } else {
      player.x = newX
    }
  }

  /**
   * Move player vertically with collision detection
   */
  private moveVertical(
    player: PlayerStore,
    level: LevelStore,
    moveY: number
  ): void {
    if (moveY === 0) return

    const newY = player.y + moveY

    // Check collision at new position
    if (this.checkVerticalCollision(player.x, newY, player.width, player.height, level)) {
      if (moveY > 0) {
        // Falling - land on ground
        const bottomEdge = newY + player.height
        const tileRow = Math.floor(bottomEdge / TILE_SIZE)
        player.y = tileRow * TILE_SIZE - player.height
        player.isGrounded = true
      } else {
        // Jumping up - hit ceiling
        const tileRow = Math.floor(newY / TILE_SIZE)
        player.y = (tileRow + 1) * TILE_SIZE
      }
      player.vy = 0
    } else {
      player.y = newY
      // If we're moving down and not colliding, we're not grounded
      if (moveY > 0) {
        player.isGrounded = false
      }
    }

    // Double-check grounded state by checking tile directly below
    this.updateGroundedState(player, level)
  }

  /**
   * Check for horizontal collision (left/right walls)
   */
  private checkHorizontalCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelStore
  ): boolean {
    // Check multiple points along the vertical edge
    const leftCol = Math.floor(x / TILE_SIZE)
    const rightCol = Math.floor((x + width - 1) / TILE_SIZE)
    
    const topRow = Math.floor(y / TILE_SIZE)
    const bottomRow = Math.floor((y + height - 1) / TILE_SIZE)

    // Check all tiles the player overlaps
    for (let row = topRow; row <= bottomRow; row++) {
      if (level.isSolidAt(leftCol, row) || level.isSolidAt(rightCol, row)) {
        return true
      }
    }
    return false
  }

  /**
   * Check for vertical collision (floor/ceiling)
   */
  private checkVerticalCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    level: LevelStore
  ): boolean {
    const leftCol = Math.floor(x / TILE_SIZE)
    const rightCol = Math.floor((x + width - 1) / TILE_SIZE)
    
    const topRow = Math.floor(y / TILE_SIZE)
    const bottomRow = Math.floor((y + height - 1) / TILE_SIZE)

    // Check all tiles the player overlaps
    for (let col = leftCol; col <= rightCol; col++) {
      if (level.isSolidAt(col, topRow) || level.isSolidAt(col, bottomRow)) {
        return true
      }
    }
    return false
  }

  /**
   * Update grounded state by checking tile directly below player
   */
  private updateGroundedState(player: PlayerStore, level: LevelStore): void {
    // Check a small distance below the player's feet
    const checkY = player.y + player.height + 1
    const leftCol = Math.floor(player.x / TILE_SIZE)
    const rightCol = Math.floor((player.x + player.width - 1) / TILE_SIZE)
    const row = Math.floor(checkY / TILE_SIZE)

    // Check if any tile below is solid
    for (let col = leftCol; col <= rightCol; col++) {
      if (level.isSolidAt(col, row)) {
        player.isGrounded = true
        return
      }
    }
    player.isGrounded = false
  }

  /**
   * Check if player has reached the goal
   */
  private checkGoal(
    player: PlayerStore,
    level: LevelStore,
    game: GameStore
  ): void {
    // Get tiles the player is overlapping
    const leftCol = Math.floor(player.x / TILE_SIZE)
    const rightCol = Math.floor((player.x + player.width - 1) / TILE_SIZE)
    const topRow = Math.floor(player.y / TILE_SIZE)
    const bottomRow = Math.floor((player.y + player.height - 1) / TILE_SIZE)

    // Check if any overlapping tile is the goal
    for (let row = topRow; row <= bottomRow; row++) {
      for (let col = leftCol; col <= rightCol; col++) {
        if (level.isGoalAt(col, row)) {
          game.setLevelComplete(true)
          return
        }
      }
    }
  }
}

// Singleton instance
export const physicsService = new PhysicsService()
