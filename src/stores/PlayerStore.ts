import { makeAutoObservable } from 'mobx'
import { 
  PLAYER_SPEED, 
  JUMP_VELOCITY, 
  PLAYER_WIDTH, 
  PLAYER_HEIGHT, 
  TRIPLE_JUMP_DURATION,
  SPEED_BOOST_DURATION,
  SUPER_JUMP_DURATION,
  INVINCIBILITY_DURATION,
  SPEED_BOOST_MULTIPLIER,
  SUPER_JUMP_MULTIPLIER,
  COYOTE_TIME,
  JUMP_BUFFER_TIME,
} from '../core/constants'
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
  
  // Animation state
  runAnimationTimer = 0      // Accumulates time for frame switching
  runAnimationFrame = 0      // Current frame (0 or 1)

  // Dimensions
  readonly width = PLAYER_WIDTH
  readonly height = PLAYER_HEIGHT

  // Jump system - baseMaxJumps determined by level (1 for levels 0-3, 2 for level 4+)
  baseMaxJumps = 1
  jumpsRemaining = 1
  
  // Forgiving jump timing
  coyoteTimeRemaining = 0    // Milliseconds since left ground
  jumpBufferTime = 0         // Milliseconds since jump was pressed
  
  // Triple jump power-up
  hasTripleJump = false
  tripleJumpTimer = 0  // Seconds remaining
  
  // Speed boost power-up
  hasSpeedBoost = false
  speedBoostTimer = 0
  
  // Super jump power-up
  hasSuperJump = false
  superJumpTimer = 0
  
  // Invincibility power-up
  hasInvincibility = false
  invincibilityTimer = 0

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

    // Calculate effective speed (with speed boost if active)
    const effectiveSpeed = this.hasSpeedBoost 
      ? PLAYER_SPEED * SPEED_BOOST_MULTIPLIER 
      : PLAYER_SPEED

    // Horizontal movement
    if (input.left && !input.right) {
      this.vx = -effectiveSpeed
      this.isFacingRight = false
    } else if (input.right && !input.left) {
      this.vx = effectiveSpeed
      this.isFacingRight = true
    } else {
      this.vx = 0
    }

    // Jump (uses jumpsRemaining for double jump support)
    // Store jump input in buffer for forgiving timing
    if (input.jumpJustPressed) {
      this.jumpBufferTime = JUMP_BUFFER_TIME
    }
    
    // Can jump if: grounded, in coyote time, or have air jumps remaining
    const canJump = (this.isGrounded || this.coyoteTimeRemaining > 0 || this.jumpsRemaining > 0)
    
    if (this.jumpBufferTime > 0 && canJump) {
      // Calculate effective jump velocity (with super jump if active)
      const effectiveJumpVelocity = this.hasSuperJump
        ? JUMP_VELOCITY * SUPER_JUMP_MULTIPLIER
        : JUMP_VELOCITY
      
      this.vy = effectiveJumpVelocity
      this.jumpsRemaining -= 1
      this.isGrounded = false
      this.coyoteTimeRemaining = 0  // Consume coyote time
      this.jumpBufferTime = 0       // Consume jump buffer
      
      // Play jump sound effect
      audioService.playSfx('jump')
    }
  }

  /**
   * Update forgiving input timers (coyote time, jump buffer)
   * Called each frame with deltaTime in milliseconds
   */
  updateInputTimers(deltaTime: number): void {
    // Decay coyote time (only when in air and not grounded)
    if (!this.isGrounded && this.coyoteTimeRemaining > 0) {
      this.coyoteTimeRemaining -= deltaTime
      if (this.coyoteTimeRemaining < 0) {
        this.coyoteTimeRemaining = 0
      }
    }
    
    // Decay jump buffer
    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime -= deltaTime
      if (this.jumpBufferTime < 0) {
        this.jumpBufferTime = 0
      }
    }
  }

  /**
   * Update power-up timers
   * Called each frame with deltaTime in milliseconds
   */
  updatePowerUps(deltaTime: number): void {
    // Triple jump timer
    if (this.hasTripleJump && this.tripleJumpTimer > 0) {
      this.tripleJumpTimer -= deltaTime
      
      if (this.tripleJumpTimer <= 0) {
        this.hasTripleJump = false
        this.tripleJumpTimer = 0
        // Don't reset jumpsRemaining mid-air
      }
    }
    
    // Speed boost timer
    if (this.hasSpeedBoost && this.speedBoostTimer > 0) {
      this.speedBoostTimer -= deltaTime
      
      if (this.speedBoostTimer <= 0) {
        this.hasSpeedBoost = false
        this.speedBoostTimer = 0
      }
    }
    
    // Super jump timer
    if (this.hasSuperJump && this.superJumpTimer > 0) {
      this.superJumpTimer -= deltaTime
      
      if (this.superJumpTimer <= 0) {
        this.hasSuperJump = false
        this.superJumpTimer = 0
      }
    }
    
    // Invincibility timer
    if (this.hasInvincibility && this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime
      
      if (this.invincibilityTimer <= 0) {
        this.hasInvincibility = false
        this.invincibilityTimer = 0
      }
    }
  }

  /**
   * Update run animation frame
   * @param deltaTime - Time since last frame in seconds
   */
  updateAnimation(deltaTime: number): void {
    // Only animate when moving horizontally on the ground
    if (this.vx !== 0 && this.isGrounded) {
      this.runAnimationTimer += deltaTime
      
      // Switch frames every 0.1 seconds (10 FPS animation)
      const FRAME_DURATION = 0.1
      if (this.runAnimationTimer >= FRAME_DURATION) {
        this.runAnimationTimer -= FRAME_DURATION
        this.runAnimationFrame = this.runAnimationFrame === 0 ? 1 : 0
      }
    } else {
      // Reset animation when not running
      this.runAnimationTimer = 0
      this.runAnimationFrame = 0
    }
  }

  /**
   * Called when player lands on ground
   */
  onLand(): void {
    this.isGrounded = true
    // Reset jumps: baseMaxJumps normally (1 or 2), 3 with triple jump power-up
    this.jumpsRemaining = this.hasTripleJump ? 3 : this.baseMaxJumps
    // Reset coyote time
    this.coyoteTimeRemaining = 0
  }

  /**
   * Called when player leaves ground (walks off edge)
   * Starts coyote time grace period
   */
  onLeaveGround(): void {
    // Only start coyote time if we didn't jump (vy should be near 0 or positive)
    // If we jumped, vy will be negative (upward)
    if (this.vy >= -50) {  // Small threshold for imprecision
      this.coyoteTimeRemaining = COYOTE_TIME
    }
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
   * Grant speed boost power-up (2x movement speed)
   */
  grantSpeedBoost(): void {
    this.hasSpeedBoost = true
    this.speedBoostTimer = SPEED_BOOST_DURATION
  }

  /**
   * Grant super jump power-up (1.5x jump height)
   */
  grantSuperJump(): void {
    this.hasSuperJump = true
    this.superJumpTimer = SUPER_JUMP_DURATION
  }

  /**
   * Grant invincibility power-up (immune to damage)
   */
  grantInvincibility(): void {
    this.hasInvincibility = true
    this.invincibilityTimer = INVINCIBILITY_DURATION
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
    
    // Reset all power-ups
    this.hasTripleJump = false
    this.tripleJumpTimer = 0
    this.hasSpeedBoost = false
    this.speedBoostTimer = 0
    this.hasSuperJump = false
    this.superJumpTimer = 0
    this.hasInvincibility = false
    this.invincibilityTimer = 0
    
    this.jumpsRemaining = this.baseMaxJumps
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
    // Keep power-ups if timer still active (they persist through death)
    this.jumpsRemaining = this.hasTripleJump ? 3 : this.baseMaxJumps
  }

  /**
   * Check if player has any active power-up
   */
  get hasAnyPowerUp(): boolean {
    return this.hasTripleJump || this.hasSpeedBoost || this.hasSuperJump || this.hasInvincibility
  }
}
