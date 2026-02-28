import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import { OVERALL_PROGRESS, VERSION } from '../../../core/data/roadmapData'
import type { CampaignStore } from '../../../stores/CampaignStore'
import type { UIStore } from '../../../stores/UIStore'
import { 
  roundRect, 
  createDarkGradient, 
  drawGridPattern, 
  drawCornerAccents,
  createFadeGradient 
} from '../DrawingUtils'

/**
 * IntroScreenRenderer - Renders the welcome/intro screen
 * 
 * Displays game title, controls, and development status.
 * Includes interactive terminal that links to roadmap.
 */
export class IntroScreenRenderer {
  /**
   * Draw the intro/welcome screen
   */
  draw(
    ctx: CanvasRenderingContext2D, 
    campaign: CampaignStore,
    uiStore: UIStore
  ): void {
    const centerX = VIEWPORT_WIDTH / 2

    // Gradient background
    ctx.fillStyle = createDarkGradient(ctx)
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Subtle grid pattern
    drawGridPattern(ctx)

    // Corner accents
    drawCornerAccents(ctx, 20, 40, '#58a6ff')

    let y = 60

    // Title with glow effect
    ctx.shadowColor = '#58a6ff'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 52px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('EPOCH RUNNER', centerX, y)
    ctx.shadowBlur = 0

    y += 60
    ctx.fillStyle = '#8b949e'
    ctx.font = 'italic 16px Georgia'
    ctx.fillText('A Time-Traveling Platformer', centerX, y)

    // Decorative line under title
    y += 35
    const lineWidth = 300
    ctx.strokeStyle = createFadeGradient(ctx, centerX, lineWidth)
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX - lineWidth / 2, y)
    ctx.lineTo(centerX + lineWidth / 2, y)
    ctx.stroke()

    // Features in a cleaner layout
    y += 40
    ctx.fillStyle = '#c9d1d9'
    ctx.font = '14px Arial'
    const features = '6 Levels  •  Hazards  •  Coins  •  Checkpoints  •  Power-ups'
    ctx.fillText(features, centerX, y)

    // Controls section
    y += 45
    this.drawControlsBox(ctx, centerX, y)
    y += 95  // Controls box height

    // Admin mode indicator (if enabled)
    if (campaign.isAdminMode) {
      y += 25
      this.drawAdminModeIndicator(ctx, centerX, y)
      y += 50  // Admin box height

      // Hacker terminal progress box
      y += 20
      this.drawTerminalBox(ctx, centerX, y, uiStore)
      y += 168  // Terminal height
    }

    // Start prompt with pulsing glow
    this.drawStartPrompt(ctx, centerX)

    // Version info
    ctx.fillStyle = '#484f58'
    ctx.font = '11px Arial'
    ctx.fillText(`${VERSION} - Early Development`, centerX, VIEWPORT_HEIGHT - 30)
  }

  /**
   * Draw the controls box
   */
  private drawControlsBox(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number
  ): void {
    const boxWidth = 520
    const boxHeight = 95
    const boxX = centerX - boxWidth / 2

    // Box background
    ctx.fillStyle = 'rgba(22, 27, 34, 0.8)'
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.8)'
    ctx.lineWidth = 1
    roundRect(ctx, boxX, y, boxWidth, boxHeight, 8)
    ctx.fill()
    ctx.stroke()

    // Controls header
    const controlsStartY = y + 22
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('CONTROLS', centerX, controlsStartY)

    // Control keys - evenly spaced columns
    const colSpacing = 120
    const cols = [
      { label: 'MOVE', value: 'Arrows / WASD' },
      { label: 'JUMP', value: 'Space / Up' },
      { label: 'RESTART', value: 'R' },
      { label: 'PAUSE', value: 'Esc' },
    ]
    const startX = centerX - (cols.length - 1) * colSpacing / 2

    const labelY = controlsStartY + 30
    const valueY = controlsStartY + 48

    cols.forEach((col, i) => {
      const x = startX + i * colSpacing
      ctx.fillStyle = '#c9d1d9'
      ctx.font = 'bold 12px Arial'
      ctx.fillText(col.label, x, labelY)
      ctx.fillStyle = '#6e7681'
      ctx.font = '11px Arial'
      ctx.fillText(col.value, x, valueY)
    })
  }

  /**
   * Draw admin mode indicator
   */
  private drawAdminModeIndicator(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number
  ): void {
    const boxWidth = 380
    const boxHeight = 50

    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)'
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'
    roundRect(ctx, centerX - boxWidth / 2, y, boxWidth, boxHeight, 6)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#f59e0b'
    ctx.font = 'bold 11px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('DEV BUILD', centerX, y + 18)
    
    ctx.fillStyle = '#b45309'
    ctx.font = '11px Arial'
    ctx.fillText('` Level Select  •  Ctrl+S Save  •  Ctrl+O Load', centerX, y + 35)
  }

  /**
   * Draw the hacker terminal progress box
   */
  private drawTerminalBox(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number,
    uiStore: UIStore
  ): void {
    const termWidth = 580
    const termHeight = 168
    const termX = centerX - termWidth / 2

    // Terminal background with scanline effect
    ctx.fillStyle = '#0d1117'
    ctx.strokeStyle = '#238636'
    ctx.lineWidth = 1
    roundRect(ctx, termX, y, termWidth, termHeight, 4)
    ctx.fill()
    ctx.stroke()

    // Terminal header bar
    ctx.fillStyle = '#161b22'
    roundRect(ctx, termX, y, termWidth, 22, 4)
    ctx.fill()
    // Cover bottom corners of header
    ctx.fillRect(termX, y + 18, termWidth, 4)

    // Terminal dots
    ctx.fillStyle = '#f85149'
    ctx.beginPath()
    ctx.arc(termX + 14, y + 11, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#d29922'
    ctx.beginPath()
    ctx.arc(termX + 32, y + 11, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#238636'
    ctx.beginPath()
    ctx.arc(termX + 50, y + 11, 5, 0, Math.PI * 2)
    ctx.fill()

    // Terminal title
    ctx.fillStyle = '#6e7681'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('system_status.log', centerX, y + 8)

    // Terminal content
    ctx.textAlign = 'left'
    ctx.font = '11px monospace'
    let termY = y + 40

    // Progress data
    ctx.fillStyle = '#238636'
    ctx.fillText('>', termX + 12, termY)
    ctx.fillStyle = '#58a6ff'
    ctx.fillText('ROADMAP_STATUS:', termX + 26, termY)
    ctx.fillStyle = '#c9d1d9'
    ctx.fillText('Phase 1 - Core Gameplay', termX + 145, termY)
    termY += 18

    ctx.fillStyle = '#238636'
    ctx.fillText('$', termX + 12, termY)
    ctx.fillStyle = '#238636'
    ctx.fillText('completed:', termX + 26, termY)
    ctx.fillStyle = '#7ee787'
    ctx.fillText('physics, collision, levels, hazards, coins, powerups', termX + 110, termY)
    termY += 18

    ctx.fillStyle = '#238636'
    ctx.fillText('$', termX + 12, termY)
    ctx.fillStyle = '#d29922'
    ctx.fillText('in_progress:', termX + 26, termY)
    ctx.fillStyle = '#e3b341'
    ctx.fillText('campaign_flow, admin_tools', termX + 120, termY)
    termY += 18

    ctx.fillStyle = '#238636'
    ctx.fillText('$', termX + 12, termY)
    ctx.fillStyle = '#6e7681'
    ctx.fillText('pending:', termX + 26, termY)
    ctx.fillStyle = '#484f58'
    ctx.fillText('level_editor, sprites, themes, cloud_saves', termX + 95, termY)
    termY += 18

    ctx.fillStyle = '#238636'
    ctx.fillText('>', termX + 12, termY)
    ctx.fillStyle = '#58a6ff'
    ctx.fillText('PROGRESS:', termX + 26, termY)

    // Progress bar
    const barX = termX + 115
    const barY = termY
    const barWidth = 120
    const barHeight = 8
    ctx.fillStyle = '#21262d'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = '#238636'
    ctx.fillRect(barX, barY, barWidth * OVERALL_PROGRESS, barHeight)
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = '#8b949e'
    ctx.fillText(`${Math.round(OVERALL_PROGRESS * 100)}%`, barX + barWidth + 10, termY)
    termY += 18

    ctx.fillStyle = '#238636'
    ctx.fillText('$', termX + 12, termY)
    ctx.fillStyle = '#6e7681'
    ctx.fillText('next_milestone:', termX + 26, termY)
    ctx.fillStyle = '#8b949e'
    ctx.fillText('Visual Level Builder', termX + 135, termY)
    termY += 22

    // Click hint at bottom of terminal
    ctx.fillStyle = '#238636'
    ctx.fillText('>', termX + 12, termY)
    ctx.fillStyle = uiStore.isTerminalHovered ? '#79c0ff' : '#58a6ff'
    ctx.fillText('click anywhere to view full roadmap', termX + 26, termY)

    // Store terminal bounds for click detection
    uiStore.setTerminalBounds({ x: termX, y: y, width: termWidth, height: termHeight })

    // Draw hover highlight if hovered
    if (uiStore.isTerminalHovered) {
      ctx.strokeStyle = '#58a6ff'
      ctx.lineWidth = 2
      roundRect(ctx, termX, y, termWidth, termHeight, 4)
      ctx.stroke()
    }

    ctx.textAlign = 'center'
  }

  /**
   * Draw the pulsing start prompt
   */
  private drawStartPrompt(
    ctx: CanvasRenderingContext2D,
    centerX: number
  ): void {
    const promptY = VIEWPORT_HEIGHT - 75
    const pulse = Math.sin(Date.now() / 400) * 0.4 + 0.6
    
    ctx.shadowColor = '#58a6ff'
    ctx.shadowBlur = 15 * pulse
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Press SPACE or ENTER to Begin', centerX, promptY)
    ctx.shadowBlur = 0
  }
}
