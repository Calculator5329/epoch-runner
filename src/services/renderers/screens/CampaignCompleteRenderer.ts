import { COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import type { CampaignStore } from '../../../stores/CampaignStore'

/**
 * CampaignCompleteRenderer - Renders the campaign complete screen
 * 
 * Shows final stats, per-level breakdown, and options to replay.
 */
export class CampaignCompleteRenderer {
  /**
   * Draw the campaign complete screen with full stats
   */
  draw(
    ctx: CanvasRenderingContext2D, 
    campaign: CampaignStore
  ): void {
    // Full dark background
    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Celebratory border
    ctx.strokeStyle = COLORS.goal
    ctx.lineWidth = 4
    ctx.strokeRect(15, 15, VIEWPORT_WIDTH - 30, VIEWPORT_HEIGHT - 30)

    const centerX = VIEWPORT_WIDTH / 2
    let y = 50

    // Title
    ctx.fillStyle = COLORS.goal
    ctx.font = 'bold 44px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('CAMPAIGN COMPLETE!', centerX, y)

    y += 55
    ctx.fillStyle = '#a0aec0'
    ctx.font = '18px Arial'
    ctx.fillText('You have conquered all epochs!', centerX, y)

    // Divider
    y += 35
    ctx.strokeStyle = COLORS.goal
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(100, y)
    ctx.lineTo(VIEWPORT_WIDTH - 100, y)
    ctx.stroke()

    // Session stats
    y += 25
    ctx.fillStyle = '#63b3ed'
    ctx.font = 'bold 22px Arial'
    ctx.fillText('[ SESSION STATISTICS ]', centerX, y)

    y += 40
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    
    const stats = campaign.sessionStats
    ctx.fillText(`Total Time: ${campaign.formattedPlayTime}`, centerX, y)
    y += 30
    ctx.fillText(`Total Deaths: ${stats.totalDeaths}`, centerX, y)
    y += 30
    ctx.fillStyle = COLORS.coin
    ctx.fillText(`Total Coins Collected: ${stats.totalCoinsCollected}`, centerX, y)

    // Per-level breakdown
    y += 45
    ctx.fillStyle = '#63b3ed'
    ctx.font = 'bold 18px Arial'
    ctx.fillText('[ LEVEL BREAKDOWN ]', centerX, y)

    y += 30
    this.drawLevelTable(ctx, campaign, y)

    // Admin level select
    if (campaign.isAdminMode) {
      const adminY = VIEWPORT_HEIGHT - 140
      ctx.fillStyle = '#f56565'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('[ ADMIN: Press 1-6 to jump to any level, or ` for level select ]', centerX, adminY)
    }

    // Options
    const optionsY = VIEWPORT_HEIGHT - 90
    ctx.fillStyle = '#4299e1'
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Press SPACE to Play Again', centerX, optionsY)
    
    ctx.fillStyle = '#a0aec0'
    ctx.font = '16px Arial'
    ctx.fillText('Press ESC to return to title screen', centerX, optionsY + 35)
  }

  /**
   * Draw the per-level stats table
   */
  private drawLevelTable(
    ctx: CanvasRenderingContext2D,
    campaign: CampaignStore,
    startY: number
  ): void {
    ctx.font = '15px Arial'
    ctx.textAlign = 'left'
    const tableX = 200
    
    // Header
    ctx.fillStyle = '#a0aec0'
    ctx.fillText('Level', tableX, startY)
    ctx.fillText('Deaths', tableX + 250, startY)
    ctx.fillText('Coins', tableX + 350, startY)
    
    // Header line
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tableX - 10, startY + 15)
    ctx.lineTo(tableX + 420, startY + 15)
    ctx.stroke()
    
    let y = startY + 35
    
    // Level rows
    campaign.allLevelStats.forEach((levelStat) => {
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(levelStat.levelName, tableX, y)
      ctx.fillText(String(levelStat.deaths), tableX + 270, y)
      ctx.fillStyle = COLORS.coin
      ctx.fillText(String(levelStat.coinsCollected), tableX + 370, y)
      y += 25
    })
  }
}
