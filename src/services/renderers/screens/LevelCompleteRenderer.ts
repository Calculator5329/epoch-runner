import { COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import { CAMPAIGN_LEVELS } from '../../../levels'
import type { GameStore } from '../../../stores/GameStore'
import type { CampaignStore } from '../../../stores/CampaignStore'
import { drawOverlay } from '../DrawingUtils'

/**
 * LevelCompleteRenderer - Renders the level complete screen
 * 
 * Shows completion message, stats, and continue options.
 */
export class LevelCompleteRenderer {
  /**
   * Draw the level complete screen with stats and continue option
   */
  draw(
    ctx: CanvasRenderingContext2D, 
    game: GameStore,
    campaign?: CampaignStore
  ): void {
    // Semi-transparent overlay
    drawOverlay(ctx, 0.85)

    const centerX = VIEWPORT_WIDTH / 2
    let y = 100

    // Success message
    ctx.fillStyle = COLORS.goal
    ctx.font = 'bold 56px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('LEVEL COMPLETE!', centerX, y)

    // Level stats
    y += 80
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    
    const deaths = campaign?.currentLevelDeaths ?? 0
    const coins = game.coinsThisAttempt
    
    ctx.fillText(`Deaths: ${deaths}`, centerX, y)
    y += 35

    // Coins earned
    ctx.fillStyle = COLORS.coin
    ctx.font = 'bold 28px Arial'
    ctx.fillText(`+${coins} coins`, centerX, y)

    // Progress indicator
    y += 60
    if (campaign) {
      const currentLevel = campaign.currentLevelIndex + 1
      const totalLevels = CAMPAIGN_LEVELS.length
      
      ctx.fillStyle = '#a0aec0'
      ctx.font = '20px Arial'
      ctx.fillText(`Level ${currentLevel} of ${totalLevels}`, centerX, y)

      // Progress bar
      y += 30
      const barWidth = 300
      const barHeight = 12
      const barX = centerX - barWidth / 2
      const progress = currentLevel / totalLevels

      ctx.fillStyle = '#2d3748'
      ctx.fillRect(barX, y, barWidth, barHeight)
      ctx.fillStyle = COLORS.goal
      ctx.fillRect(barX, y, barWidth * progress, barHeight)
      ctx.strokeStyle = '#4a5568'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, y, barWidth, barHeight)
    }

    // Continue prompt
    y = VIEWPORT_HEIGHT - 120
    const hasNextLevel = campaign?.hasNextLevel(CAMPAIGN_LEVELS.length) ?? false
    
    if (hasNextLevel) {
      ctx.fillStyle = '#4299e1'
      ctx.font = 'bold 24px Arial'
      ctx.fillText('Press SPACE or ENTER to Continue', centerX, y)
      
      y += 35
      ctx.fillStyle = '#a0aec0'
      ctx.font = '18px Arial'
      ctx.fillText('Press R to Replay Level', centerX, y)
    } else {
      ctx.fillStyle = COLORS.goal
      ctx.font = 'bold 24px Arial'
      ctx.fillText('CAMPAIGN COMPLETE!', centerX, y)
      
      y += 35
      ctx.fillStyle = '#4299e1'
      ctx.font = '20px Arial'
      ctx.fillText('Press SPACE or ENTER to see your stats', centerX, y)
    }
  }

  /**
   * Draw legacy level complete overlay (simplified version)
   * Kept for backwards compatibility
   */
  drawLegacy(
    ctx: CanvasRenderingContext2D,
    game: GameStore
  ): void {
    // Semi-transparent overlay
    drawOverlay(ctx, 0.7)

    // Success message
    ctx.fillStyle = COLORS.goal
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LEVEL COMPLETE!', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 - 60)

    // Coins earned
    ctx.fillStyle = COLORS.coin
    ctx.font = 'bold 32px Arial'
    ctx.fillText(`+${game.coinsThisAttempt} coins`, VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2)

    // Subtitle
    ctx.fillStyle = '#ffffff'
    ctx.font = '24px Arial'
    ctx.fillText('Press R to restart', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2 + 60)
  }
}
