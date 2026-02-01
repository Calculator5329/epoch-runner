import { makeAutoObservable } from 'mobx'
import { PLAYER_SPEED, JUMP_VELOCITY, PLAYER_WIDTH, PLAYER_HEIGHT } from '../core/constants'
import type { InputState, Vector2 } from '../core/types'

/**
 * PlayerStore - Player state and input handling
 * 
 * Manages player position, velocity, and grounded state.
 * Applies input to set intended velocity (physics service handles actual movement).
 */
export class PlayerStore {
  // Position (top-left corner of player, world coordinates)
  x = 0
  y = 0
  
  // Velocity (pixels per second)
  vx = 0
  vy = 0
  
  // State flags
  isGrounded = false
  isFacingRight = true

  // Dimensions
  readonly width = PLAYER_WIDTH
  readonly height = PLAYER_HEIGHT

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * Set player position directly (e.g., spawn, teleport)
   */
  setPosition(pos: Vector2): void {
    this.x = pos.x
    this.y = pos.y
  }

  /**
   * Apply input state to set intended velocity
   * Called each frame before physics update
   */
  applyInput(input: InputState): void {
    // Horizontal movement
    if (input.left && !input.right) {
      this.vx = -PLAYER_SPEED
      this.isFacingRight = false
    } else if (input.right && !input.left) {
      this.vx = PLAYER_SPEED
      this.isFacingRight = true
    } else {
      this.vx = 0
    }

    // Jump (only if grounded and jump was just pressed)
    if (input.jumpJustPressed && this.isGrounded) {
      this.vy = JUMP_VELOCITY
      this.isGrounded = false
    }
  }

  /**
   * Get player center position
   */
  get center(): Vector2 {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    }
  }

  /**
   * Get player bounding box
   */
  get bounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    }
  }

  /**
   * Reset player state for level restart
   */
  reset(spawnPosition: Vector2): void {
    this.x = spawnPosition.x
    this.y = spawnPosition.y
    this.vx = 0
    this.vy = 0
    this.isGrounded = false
    this.isFacingRight = true
  }
}
