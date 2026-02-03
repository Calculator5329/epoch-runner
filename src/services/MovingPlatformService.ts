import type { MovingPlatform } from '../core/types/movingPlatforms'

/**
 * MovingPlatformService - Updates platform positions each frame
 * 
 * Stateless service that handles platform movement logic.
 * Platforms oscillate between start and end points.
 */
export class MovingPlatformService {
  /**
   * Update all platforms for one frame
   */
  update(platforms: MovingPlatform[], deltaTime: number): void {
    for (const platform of platforms) {
      if (!platform.isActive) continue
      
      this.updatePlatform(platform, deltaTime)
    }
  }

  /**
   * Update a single platform's position
   */
  private updatePlatform(platform: MovingPlatform, deltaTime: number): void {
    const dt = deltaTime / 1000 // Convert to seconds
    
    switch (platform.pattern) {
      case 'horizontal':
        this.updateHorizontal(platform, dt)
        break
      case 'vertical':
        this.updateVertical(platform, dt)
        break
      case 'circular':
        // Future implementation
        break
    }
  }

  /**
   * Update horizontal platform (left/right)
   */
  private updateHorizontal(platform: MovingPlatform, dt: number): void {
    // Calculate velocity based on direction
    platform.vx = platform.speed * platform.direction
    platform.vy = 0
    
    // Move platform
    const newX = platform.x + platform.vx * dt
    
    // Check if reached endpoint
    if (platform.direction === 1) {
      // Moving toward end
      if (newX >= platform.endX) {
        platform.x = platform.endX
        platform.direction = -1 // Reverse direction
      } else {
        platform.x = newX
      }
    } else {
      // Moving toward start
      if (newX <= platform.startX) {
        platform.x = platform.startX
        platform.direction = 1 // Reverse direction
      } else {
        platform.x = newX
      }
    }
  }

  /**
   * Update vertical platform (up/down)
   */
  private updateVertical(platform: MovingPlatform, dt: number): void {
    // Calculate velocity based on direction
    platform.vx = 0
    platform.vy = platform.speed * platform.direction
    
    // Move platform
    const newY = platform.y + platform.vy * dt
    
    // Check if reached endpoint
    if (platform.direction === 1) {
      // Moving toward end
      if (newY >= platform.endY) {
        platform.y = platform.endY
        platform.direction = -1 // Reverse direction
      } else {
        platform.y = newY
      }
    } else {
      // Moving toward start
      if (newY <= platform.startY) {
        platform.y = platform.startY
        platform.direction = 1 // Reverse direction
      } else {
        platform.y = newY
      }
    }
  }

  /**
   * Check if a point (player) is on top of a platform
   * Returns platform if player is riding it, null otherwise
   */
  checkPlayerOnPlatform(
    playerX: number,
    playerY: number,
    playerWidth: number,
    playerHeight: number,
    platforms: MovingPlatform[]
  ): MovingPlatform | null {
    for (const platform of platforms) {
      if (!platform.isActive) continue
      
      // Check if player's feet are on platform surface
      const playerBottom = playerY + playerHeight
      const platformTop = platform.y
      
      // Player must be just above platform (within 2 pixels)
      if (Math.abs(playerBottom - platformTop) > 2) continue
      
      // Check horizontal overlap
      const playerRight = playerX + playerWidth
      const platformRight = platform.x + platform.width
      
      if (playerRight > platform.x && playerX < platformRight) {
        return platform
      }
    }
    
    return null
  }
}

// Singleton instance
export const movingPlatformService = new MovingPlatformService()
