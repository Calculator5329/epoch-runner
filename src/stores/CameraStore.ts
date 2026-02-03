import { makeAutoObservable } from 'mobx'
import { 
  VIEWPORT_WIDTH, 
  VIEWPORT_HEIGHT, 
  CAMERA_LERP_SPEED, 
  CAMERA_DEADZONE_X, 
  CAMERA_DEADZONE_Y,
  TILE_SIZE
} from '../core/constants'

/**
 * CameraStore - Viewport position and camera behavior
 * 
 * Tracks where the camera is looking in world coordinates.
 * Supports smooth following with deadzone and bounds clamping.
 */
export class CameraStore {
  // Camera position (top-left corner of viewport in world coordinates)
  x = 0
  y = 0

  // Target position for smooth following
  targetX = 0
  targetY = 0

  // Level bounds (set when level loads)
  levelWidth = VIEWPORT_WIDTH
  levelHeight = VIEWPORT_HEIGHT

  // Viewport size (constant, but stored for convenience)
  readonly viewportWidth = VIEWPORT_WIDTH
  readonly viewportHeight = VIEWPORT_HEIGHT

  // Screen shake state
  shakeX = 0
  shakeY = 0
  shakeIntensity = 0
  shakeDuration = 0

  constructor() {
    makeAutoObservable(this)
  }

  /**
   * Set camera position instantly (e.g., on level load)
   */
  setPosition(x: number, y: number): void {
    this.x = Math.round(x)
    this.y = Math.round(y)
    this.targetX = this.x
    this.targetY = this.y
    this.clampToBounds()
  }

  /**
   * Set level bounds for camera clamping
   */
  setLevelBounds(widthTiles: number, heightTiles: number): void {
    this.levelWidth = widthTiles * TILE_SIZE
    this.levelHeight = heightTiles * TILE_SIZE
  }

  /**
   * Update camera to follow a target position with smooth interpolation
   * Uses deadzone so camera doesn't move for small player movements
   */
  follow(targetWorldX: number, targetWorldY: number, deltaTime: number): void {
    // Calculate ideal camera position (center target in viewport)
    const idealX = targetWorldX - this.viewportWidth / 2
    const idealY = targetWorldY - this.viewportHeight / 2

    // Apply deadzone - only update target if outside deadzone
    const dx = idealX - this.targetX
    const dy = idealY - this.targetY

    if (Math.abs(dx) > CAMERA_DEADZONE_X) {
      this.targetX = idealX - Math.sign(dx) * CAMERA_DEADZONE_X
    }
    if (Math.abs(dy) > CAMERA_DEADZONE_Y) {
      this.targetY = idealY - Math.sign(dy) * CAMERA_DEADZONE_Y
    }

    // Smooth interpolation toward target
    const lerpFactor = 1 - Math.exp(-CAMERA_LERP_SPEED * deltaTime)
    this.x += (this.targetX - this.x) * lerpFactor
    this.y += (this.targetY - this.y) * lerpFactor

    // Clamp to level bounds
    this.clampToBounds()
  }

  /**
   * Clamp camera position to stay within level bounds
   */
  private clampToBounds(): void {
    // Don't scroll past left/top edge
    this.x = Math.max(0, this.x)
    this.y = Math.max(0, this.y)

    // Don't scroll past right/bottom edge
    const maxX = Math.max(0, this.levelWidth - this.viewportWidth)
    const maxY = Math.max(0, this.levelHeight - this.viewportHeight)
    this.x = Math.min(maxX, this.x)
    this.y = Math.min(maxY, this.y)
    
    // Round to nearest pixel to avoid sub-pixel rendering artifacts
    this.x = Math.round(this.x)
    this.y = Math.round(this.y)
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    }
  }

  /**
   * Check if a world rectangle is visible on screen
   */
  isVisible(worldX: number, worldY: number, width: number, height: number): boolean {
    return (
      worldX + width > this.x &&
      worldX < this.x + this.viewportWidth &&
      worldY + height > this.y &&
      worldY < this.y + this.viewportHeight
    )
  }

  /**
   * Trigger screen shake effect
   * @param intensity - Shake intensity in pixels (max offset)
   * @param duration - Shake duration in seconds
   */
  shake(intensity: number, duration: number): void {
    // If already shaking, take the stronger shake
    if (intensity > this.shakeIntensity) {
      this.shakeIntensity = intensity
      this.shakeDuration = duration
    }
  }

  /**
   * Update screen shake effect (called each frame)
   * @param deltaTime - Frame time in milliseconds
   */
  updateShake(deltaTime: number): void {
    if (this.shakeDuration <= 0) {
      this.shakeX = 0
      this.shakeY = 0
      this.shakeIntensity = 0
      return
    }

    // Decay shake over time
    this.shakeDuration -= deltaTime / 1000

    if (this.shakeDuration <= 0) {
      this.shakeX = 0
      this.shakeY = 0
      this.shakeIntensity = 0
      return
    }

    // Generate random shake offset within intensity bounds
    // Use a random angle for smooth shake motion
    const angle = Math.random() * Math.PI * 2
    const intensity = this.shakeIntensity * (this.shakeDuration / 0.3) // Fade out
    
    this.shakeX = Math.cos(angle) * intensity * (Math.random() * 0.5 + 0.5)
    this.shakeY = Math.sin(angle) * intensity * (Math.random() * 0.5 + 0.5)
  }

  /**
   * Get camera position with shake applied
   */
  getShakeX(): number {
    return this.x + this.shakeX
  }

  getShakeY(): number {
    return this.y + this.shakeY
  }

  /**
   * Reset camera to default position
   */
  reset(): void {
    this.x = 0
    this.y = 0
    this.targetX = 0
    this.targetY = 0
    this.shakeX = 0
    this.shakeY = 0
    this.shakeIntensity = 0
    this.shakeDuration = 0
  }
}
