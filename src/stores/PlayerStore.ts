import { makeAutoObservable } from 'mobx'
import { PLAYER_SPEED, JUMP_VELOCITY, PLAYER_WIDTH, PLAYER_HEIGHT, DOUBLE_JUMP_DURATION } from '../core/constants'
import type { InputState, Vector2 } from '../core/types'

/**
 * PlayerStore - Player state and input handling
 * 
 * Manages player position, velocity, grounded state, and power-ups.
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
  isDead = false

  // Dimensions
  readonly width = PLAYER_WIDTH
  readonly height = PLAYER_HEIGHT

  // Double jump power-up
  hasDoubleJump = false
  jumpsRemaining = 1
  doubleJumpTimer = 0  // Seconds remaining

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
    if (this.isDead) return

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

    // Jump (uses jumpsRemaining for double jump support)
    if (input.jumpJustPressed && this.jumpsRemaining > 0) {
      this.vy = JUMP_VELOCITY
      this.jumpsRemaining -= 1
      this.isGrounded = false
    }
  }

  /**
   * Update power-up timers
   * Called each frame with deltaTime
   */
  updatePowerUps(deltaTime: number): void {
    if (this.hasDoubleJump && this.doubleJumpTimer > 0) {
      this.doubleJumpTimer -= deltaTime
      
      if (this.doubleJumpTimer <= 0) {
        this.hasDoubleJump = false
        this.doubleJumpTimer = 0
        // Don't reset jumpsRemaining mid-air
      }
    }
  }

  /**
   * Called when player lands on ground
   */
  onLand(): void {
    this.isGrounded = true
    // Reset jumps: 1 normally, 2 with double jump power-up
    this.jumpsRemaining = this.hasDoubleJump ? 2 : 1
  }

  /**
   * Grant double jump power-up
   */
  grantDoubleJump(): void {
    this.hasDoubleJump = true
    this.doubleJumpTimer = DOUBLE_JUMP_DURATION
    
    // If grounded, immediately get the extra jump
    if (this.isGrounded) {
      this.jumpsRemaining = 2
    } else {
      // If mid-air, grant one additional jump
      this.jumpsRemaining = Math.min(this.jumpsRemaining + 1, 2)
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
   * Mark player as dead (for death animation)
   */
  die(): void {
    this.isDead = true
    this.vx = 0
    this.vy = 0
  }

  /**
   * Reset player state for level restart or respawn
   */
  reset(spawnPosition: Vector2): void {
    this.x = spawnPosition.x
    this.y = spawnPosition.y
    this.vx = 0
    this.vy = 0
    this.isGrounded = false
    this.isFacingRight = true
    this.isDead = false
    this.hasDoubleJump = false
    this.jumpsRemaining = 1
    this.doubleJumpTimer = 0
  }

  /**
   * Respawn at checkpoint (keeps power-ups if still active)
   */
  respawn(spawnPosition: Vector2): void {
    this.x = spawnPosition.x
    this.y = spawnPosition.y
    this.vx = 0
    this.vy = 0
    this.isGrounded = false
    this.isDead = false
    // Keep power-ups if timer still active
    this.jumpsRemaining = this.hasDoubleJump ? 2 : 1
  }
}
