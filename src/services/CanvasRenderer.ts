import { TILE_SIZE, COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../core/constants'
import { CollisionType } from '../core/types'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'
import type { CameraStore } from '../stores/CameraStore'

/**
 * CanvasRenderer - Stateless rendering service
 * 
 * Draws the game state to a canvas context.
 * All world objects are offset by camera position.
 * UI overlays are drawn in screen space (not affected by camera).
 */
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D | null = null

  /**
   * Set the canvas context to render to
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
  }

  /**
   * Main draw call - renders entire frame
   */
  draw(
    levelStore: LevelStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    cameraStore: CameraStore
  ): void {
    if (!this.ctx) return

    const ctx = this.ctx

    // Clear canvas with background color
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Draw tiles (with camera offset, only visible tiles)
    this.drawTiles(ctx, levelStore, cameraStore)

    // Draw player (with camera offset)
    this.drawPlayer(ctx, playerStore, cameraStore)

    // Draw UI overlays (in screen space, no camera offset)
    if (gameStore.levelComplete) {
      this.drawLevelComplete(ctx, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    }

    if (gameStore.isPaused) {
      this.drawPaused(ctx, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    }

    // Draw debug info (optional)
    // this.drawDebugInfo(ctx, cameraStore, playerStore, levelStore)
  }

  /**
   * Draw only visible tiles in the level (optimized for large levels)
   */
  private drawTiles(
    ctx: CanvasRenderingContext2D, 
    level: LevelStore,
    camera: CameraStore
  ): void {
    // Calculate visible tile range (with 1-tile buffer for partial tiles)
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1)
    const endCol = Math.min(level.width, Math.ceil((camera.x + VIEWPORT_WIDTH) / TILE_SIZE) + 1)
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1)
    const endRow = Math.min(level.height, Math.ceil((camera.y + VIEWPORT_HEIGHT) / TILE_SIZE) + 1)

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = level.collision[row][col]
        
        // World position
        const worldX = col * TILE_SIZE
        const worldY = row * TILE_SIZE
        
        // Screen position (offset by camera)
        const screenX = worldX - camera.x
        const screenY = worldY - camera.y

        // Set color based on tile type
        switch (tile) {
          case CollisionType.EMPTY:
            ctx.fillStyle = COLORS.empty
            break
          case CollisionType.SOLID:
            ctx.fillStyle = COLORS.solid
            break
          case CollisionType.GOAL:
            ctx.fillStyle = COLORS.goal
            break
          default:
            ctx.fillStyle = COLORS.empty
        }

        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)

        // Draw tile border for visual separation
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
      }
    }
  }

  /**
   * Draw the player (with camera offset)
   */
  private drawPlayer(
    ctx: CanvasRenderingContext2D, 
    player: PlayerStore,
    camera: CameraStore
  ): void {
    // Convert world position to screen position
    const screenX = player.x - camera.x
    const screenY = player.y - camera.y

    // Player body
    ctx.fillStyle = COLORS.player
    ctx.fillRect(screenX, screenY, player.width, player.height)

    // Player outline
    ctx.strokeStyle = COLORS.playerOutline
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, player.width, player.height)

    // Direction indicator (small triangle showing facing direction)
    ctx.fillStyle = COLORS.playerOutline
    const centerY = screenY + player.height / 2
    const indicatorSize = 8
    
    ctx.beginPath()
    if (player.isFacingRight) {
      const rightEdge = screenX + player.width
      ctx.moveTo(rightEdge - 4, centerY - indicatorSize)
      ctx.lineTo(rightEdge + 4, centerY)
      ctx.lineTo(rightEdge - 4, centerY + indicatorSize)
    } else {
      const leftEdge = screenX
      ctx.moveTo(leftEdge + 4, centerY - indicatorSize)
      ctx.lineTo(leftEdge - 4, centerY)
      ctx.lineTo(leftEdge + 4, centerY + indicatorSize)
    }
    ctx.closePath()
    ctx.fill()
  }

  /**
   * Draw level complete overlay (screen space)
   */
  private drawLevelComplete(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, width, height)

    // Success message
    ctx.fillStyle = COLORS.goal
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LEVEL COMPLETE!', width / 2, height / 2 - 40)

    // Subtitle
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText('Press R to restart', width / 2, height / 2 + 40)
  }

  /**
   * Draw paused overlay (screen space)
   */
  private drawPaused(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, width, height)

    // Paused text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PAUSED', width / 2, height / 2)
  }

  /**
   * Draw debug information (optional, for development)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private drawDebugInfo(
    ctx: CanvasRenderingContext2D,
    camera: CameraStore,
    player: PlayerStore,
    level: LevelStore
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(10, 10, 200, 100)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    const lines = [
      `Camera: (${camera.x.toFixed(0)}, ${camera.y.toFixed(0)})`,
      `Player: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`,
      `Velocity: (${player.vx.toFixed(0)}, ${player.vy.toFixed(0)})`,
      `Grounded: ${player.isGrounded}`,
      `Level: ${level.width}x${level.height}`,
    ]
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 20 + i * 16)
    })
  }
}

// Singleton instance
export const canvasRenderer = new CanvasRenderer()
