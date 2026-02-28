import { COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import type { GameStore } from '../../../stores/GameStore'
import { drawOverlay } from '../DrawingUtils'

/**
 * OverlayRenderer - Renders pause and game over overlays
 * 
 * Simple overlays that appear during gameplay.
 */
export class OverlayRenderer {
  /**
   * Draw the paused overlay
   */
  drawPaused(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    drawOverlay(ctx, 0.5)

    // Paused text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PAUSED', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2)
  }

  /**
   * Draw the game over overlay
   */
  drawGameOver(ctx: CanvasRenderingContext2D, _game: GameStore): void {
    // Semi-transparent overlay
    drawOverlay(ctx, 0.8)

    // Game over message
    ctx.fillStyle = COLORS.hazard
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GAME OVER', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 40)

    // Subtitle
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText('Press R to restart', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 40)
  }

  /**
   * Draw overlays based on game state
   * Returns true if an overlay was drawn
   */
  draw(ctx: CanvasRenderingContext2D, gameStore: GameStore): boolean {
    if (gameStore.isGameOver) {
      this.drawGameOver(ctx, gameStore)
      return true
    }

    if (gameStore.isPaused && !gameStore.levelComplete && !gameStore.isGameOver && !gameStore.isAdminMenuOpen) {
      this.drawPaused(ctx)
      return true
    }

    return false
  }
}
