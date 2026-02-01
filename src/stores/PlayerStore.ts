import { makeAutoObservable } from 'mobx'
import { PLAYER_SPEED, JUMP_VELOCITY, PLAYER_WIDTH, PLAYER_HEIGHT, TRIPLE_JUMP_DURATION } from '../core/constants'
import type { InputState, Vector2 } from '../core/types'
import { audioService } from '../services/AudioService'

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

  // Jump system - baseMaxJumps determined by level (1 for levels 0-3, 2 for level 4+)
  baseMaxJumps = 1
  jumpsRemaining = 1
  
  // Triple jump power-up
  hasTripleJump = false
  tripleJumpTimer = 0  // Seconds remaining

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
      
      // Play jump sound effect
      audioService.playSfx('jump')
    }
  }

  /**
   * Update power-up timers
   * Called each frame with deltaTime
   */
  updatePowerUps(deltaTime: number): void {
    if (this.hasTripleJump && this.tripleJumpTimer > 0) {
      this.tripleJumpTimer -= deltaTime
      
      if (this.tripleJumpTimer <= 0) {
        this.hasTripleJump = false
        this.tripleJumpTimer = 0
        // Don't reset jumpsRemaining mid-air
      }
    }
  }

  /**
   * Called when player lands on ground
   */
  onLand(): void {
    this.isGrounded = true
    // Reset jumps: baseMaxJumps normally (1 or 2), 3 with triple jump power-up
    this.jumpsRemaining = this.hasTripleJump ? 3 : this.baseMaxJumps
  }

  /**
   * Set base max jumps for current level
   * 1 for levels 0-3, 2 for level 4+
   */
  setBaseMaxJumps(maxJumps: number): void {
    this.baseMaxJumps = maxJumps
    // Update jumpsRemaining if grounded and no power-up active
    if (this.isGrounded && !this.hasTripleJump) {
      this.jumpsRemaining = maxJumps
    }
  }

  /**
   * Grant triple jump power-up
   */
  grantTripleJump(): void {
    this.hasTripleJump = true
    this.tripleJumpTimer = TRIPLE_JUMP_DURATION
    
    // If grounded, immediately get triple jump
    if (this.isGrounded) {
      this.jumpsRemaining = 3
    } else {
      // If mid-air, grant additional jumps up to 3
      this.jumpsRemaining = Math.min(this.jumpsRemaining + (3 - this.baseMaxJumps), 3)
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
    
    // Play death sound effect
    audioService.playSfx('death')
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
    this.hasTripleJump = false
    this.jumpsRemaining = this.baseMaxJumps
    this.tripleJumpTimer = 0
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
    this.jumpsRemaining = this.hasTripleJump ? 3 : this.baseMaxJumps
  }
}
