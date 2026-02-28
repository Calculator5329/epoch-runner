import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../../core/constants'
import { ROADMAP_PHASES, MILESTONES, type RoadmapPhase } from '../../../core/data/roadmapData'
import type { CampaignStore } from '../../../stores/CampaignStore'
import type { UIStore } from '../../../stores/UIStore'
import { 
  roundRect, 
  createDarkGradient, 
  drawGridPattern, 
  drawCornerAccents 
} from '../DrawingUtils'

/**
 * RoadmapScreenRenderer - Renders the development roadmap screen
 * 
 * Shows development phases, progress, and milestones.
 * Supports list view and detail view for individual phases.
 */
export class RoadmapScreenRenderer {
  /**
   * Draw the roadmap screen
   */
  draw(
    ctx: CanvasRenderingContext2D, 
    _campaign: CampaignStore,
    uiStore: UIStore
  ): void {
    const centerX = VIEWPORT_WIDTH / 2

    // Gradient background
    ctx.fillStyle = createDarkGradient(ctx)
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Subtle grid pattern
    drawGridPattern(ctx)

    // Corner accents (green for roadmap)
    drawCornerAccents(ctx, 20, 40, '#238636')

    // If a phase is selected, show detail view
    if (uiStore.selectedRoadmapPhase !== null && uiStore.selectedRoadmapPhase < ROADMAP_PHASES.length) {
      this.drawPhaseDetail(ctx, ROADMAP_PHASES[uiStore.selectedRoadmapPhase], centerX)
      return
    }

    // Draw list view
    this.drawListView(ctx, centerX, uiStore)
  }

  /**
   * Draw the list view with all phases
   */
  private drawListView(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    uiStore: UIStore
  ): void {
    let y = 45

    // Title with glow
    ctx.shadowColor = '#238636'
    ctx.shadowBlur = 15
    ctx.fillStyle = '#238636'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('DEVELOPMENT ROADMAP', centerX, y)
    ctx.shadowBlur = 0

    y += 45
    ctx.fillStyle = '#8b949e'
    ctx.font = '14px Arial'
    ctx.fillText('Epoch Runner v0.1.0 - Current Progress', centerX, y)

    // Draw phase cards
    y += 35
    const cardWidth = 480
    const cardHeight = 70
    const cardGap = 10
    const cardX = centerX - cardWidth / 2
    const cardsStartY = y

    // Store bounds for click detection
    uiStore.setRoadmapPhaseBounds({
      cardX,
      startY: cardsStartY,
      cardWidth,
      cardHeight,
      cardGap,
      phaseCount: ROADMAP_PHASES.length,
    })

    ROADMAP_PHASES.forEach((phase, index) => {
      this.drawPhaseCard(ctx, phase, index, cardX, y, cardWidth, cardHeight, uiStore)
      y += cardHeight + cardGap
    })

    // Milestones section
    y += 10
    this.drawMilestones(ctx, centerX, y)

    // Return prompt
    ctx.fillStyle = '#6e7681'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Press ESC or TAB to return', centerX, VIEWPORT_HEIGHT - 35)
  }

  /**
   * Draw a single phase card
   */
  private drawPhaseCard(
    ctx: CanvasRenderingContext2D,
    phase: RoadmapPhase,
    index: number,
    cardX: number,
    y: number,
    cardWidth: number,
    cardHeight: number,
    uiStore: UIStore
  ): void {
    const isHovered = uiStore.hoveredRoadmapPhase === index

    // Card background
    const bgColor = isHovered ? 'rgba(33, 38, 45, 0.95)' : 'rgba(22, 27, 34, 0.9)'
    let borderColor = '#30363d'
    let statusColor = '#6e7681'
    let progressColor = '#484f58'

    if (phase.status === 'complete') {
      borderColor = isHovered ? '#3fb950' : '#238636'
      statusColor = '#238636'
      progressColor = '#238636'
    } else if (phase.status === 'in_progress') {
      borderColor = isHovered ? '#e3b341' : '#d29922'
      statusColor = '#d29922'
      progressColor = '#d29922'
    } else if (isHovered) {
      borderColor = '#484f58'
    }

    ctx.fillStyle = bgColor
    ctx.strokeStyle = borderColor
    ctx.lineWidth = isHovered ? 2 : 1
    roundRect(ctx, cardX, y, cardWidth, cardHeight, 6)
    ctx.fill()
    ctx.stroke()

    // Phase name
    ctx.fillStyle = isHovered ? '#ffffff' : '#c9d1d9'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(phase.name, cardX + 15, y + 20)

    // Status badge
    const statusText = phase.status === 'complete' ? 'COMPLETE' : 
                      phase.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'
    ctx.fillStyle = statusColor
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(statusText, cardX + cardWidth - 15, y + 20)

    // Progress bar
    const barWidth = 200
    const barHeight = 8
    const barX = cardX + 15
    const barY = y + 35

    ctx.fillStyle = '#21262d'
    ctx.fillRect(barX, barY, barWidth, barHeight)
    ctx.fillStyle = progressColor
    ctx.fillRect(barX, barY, barWidth * phase.progress, barHeight)
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)

    // Percentage
    ctx.fillStyle = '#8b949e'
    ctx.font = '11px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(phase.progress * 100)}%`, barX + barWidth + 10, barY + 8)

    // Key items (abbreviated) or click hint when hovered
    if (isHovered) {
      ctx.fillStyle = '#58a6ff'
      ctx.font = '11px Arial'
      ctx.fillText('Click for details →', cardX + 15, y + 55)
    } else {
      ctx.fillStyle = '#6e7681'
      ctx.font = '11px Arial'
      const itemsText = phase.items.slice(0, 3).join(' • ') + (phase.items.length > 3 ? ' ...' : '')
      ctx.fillText(itemsText, cardX + 15, y + 55)
    }
  }

  /**
   * Draw milestones section
   */
  private drawMilestones(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    y: number
  ): void {
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('MILESTONES', centerX, y)

    y += 25
    const msWidth = 130
    const startX = centerX - (MILESTONES.length * msWidth) / 2

    // Connecting line between milestones
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(startX + msWidth / 2, y)
    ctx.lineTo(startX + (MILESTONES.length - 1) * msWidth + msWidth / 2, y)
    ctx.stroke()

    // Draw milestone circles and labels
    MILESTONES.forEach((ms, i) => {
      const msX = startX + i * msWidth + msWidth / 2
      
      // Circle
      ctx.beginPath()
      ctx.arc(msX, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = ms.done ? '#238636' : '#21262d'
      ctx.fill()
      ctx.strokeStyle = ms.done ? '#238636' : '#30363d'
      ctx.lineWidth = 2
      ctx.stroke()

      // Checkmark or empty
      if (ms.done) {
        ctx.fillStyle = '#0d1117'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('✓', msX, y + 4)
      }

      // Label
      ctx.fillStyle = ms.done ? '#7ee787' : '#6e7681'
      ctx.font = '10px Arial'
      ctx.fillText(ms.name, msX, y + 22)
    })
  }

  /**
   * Draw detailed view for a specific roadmap phase
   */
  private drawPhaseDetail(
    ctx: CanvasRenderingContext2D,
    phase: RoadmapPhase,
    centerX: number
  ): void {
    // Back button area
    ctx.fillStyle = '#58a6ff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('← Back to Roadmap', 40, 50)

    // Phase title with status color
    let statusColor = '#6e7681'
    if (phase.status === 'complete') statusColor = '#238636'
    else if (phase.status === 'in_progress') statusColor = '#d29922'

    ctx.shadowColor = statusColor
    ctx.shadowBlur = 15
    ctx.fillStyle = statusColor
    ctx.font = 'bold 32px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(phase.name, centerX, 90)
    ctx.shadowBlur = 0

    // Status badge
    const statusText = phase.status === 'complete' ? 'COMPLETE' : 
                      phase.status === 'in_progress' ? 'IN PROGRESS' : 'PENDING'
    ctx.fillStyle = statusColor
    ctx.font = 'bold 14px Arial'
    ctx.fillText(statusText, centerX, 125)

    // Progress bar
    const barWidth = 400
    const barHeight = 12
    const barX = centerX - barWidth / 2
    const barY = 145

    ctx.fillStyle = '#21262d'
    roundRect(ctx, barX, barY, barWidth, barHeight, 4)
    ctx.fill()
    
    if (phase.progress > 0) {
      ctx.fillStyle = statusColor
      roundRect(ctx, barX, barY, barWidth * phase.progress, barHeight, 4)
      ctx.fill()
    }

    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1
    roundRect(ctx, barX, barY, barWidth, barHeight, 4)
    ctx.stroke()

    ctx.fillStyle = '#c9d1d9'
    ctx.font = 'bold 14px Arial'
    ctx.fillText(`${Math.round(phase.progress * 100)}%`, centerX, barY + barHeight + 20)

    // Description
    ctx.fillStyle = '#8b949e'
    ctx.font = '14px Arial'
    ctx.fillText(phase.description, centerX, 200)

    // Two columns: Completed and Upcoming
    const colWidth = 350
    const leftColX = centerX - colWidth - 30
    const rightColX = centerX + 30
    let leftY = 245
    let rightY = 245

    // Completed section
    ctx.fillStyle = '#238636'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Completed', leftColX, leftY)
    leftY += 25

    if (phase.completed.length === 0) {
      ctx.fillStyle = '#484f58'
      ctx.font = '13px Arial'
      ctx.fillText('No items completed yet', leftColX, leftY)
      leftY += 22
    } else {
      phase.completed.forEach(item => {
        ctx.fillStyle = '#238636'
        ctx.font = '13px Arial'
        ctx.fillText('✓', leftColX, leftY)
        ctx.fillStyle = '#c9d1d9'
        ctx.fillText(item, leftColX + 20, leftY)
        leftY += 22
      })
    }

    // Upcoming section
    ctx.fillStyle = '#d29922'
    ctx.font = 'bold 16px Arial'
    ctx.fillText('Upcoming', rightColX, rightY)
    rightY += 25

    if (phase.upcoming.length === 0) {
      ctx.fillStyle = '#484f58'
      ctx.font = '13px Arial'
      ctx.fillText('All items completed!', rightColX, rightY)
      rightY += 22
    } else {
      phase.upcoming.forEach(item => {
        ctx.fillStyle = '#d29922'
        ctx.font = '13px Arial'
        ctx.fillText('○', rightColX, rightY)
        ctx.fillStyle = '#8b949e'
        ctx.fillText(item, rightColX + 20, rightY)
        rightY += 22
      })
    }

    // Return prompt
    ctx.fillStyle = '#6e7681'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Click "Back" or press ESC to return', centerX, VIEWPORT_HEIGHT - 35)
  }
}
