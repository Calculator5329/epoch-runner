import { TILE_SIZE, COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../core/constants'
import { getTileType, TileTypeId } from '../core/types/shapes'
import type { CollisionShape, NormalizedPoint } from '../core/types/shapes'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'
import type { CameraStore } from '../stores/CameraStore'
import type { CampaignStore, ScreenState } from '../stores/CampaignStore'
import { getAllLevels, CAMPAIGN_LEVELS } from '../levels'

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
    cameraStore: CameraStore,
    campaignStore?: CampaignStore
  ): void {
    if (!this.ctx) return

    const ctx = this.ctx

    // Handle screen states from campaign
    const screenState: ScreenState = campaignStore?.screenState || 'playing'

    // Draw intro screen (full screen overlay)
    if (screenState === 'intro') {
      this.drawIntroScreen(ctx, campaignStore!)
      return
    }

    // Draw roadmap screen (full screen overlay)
    if (screenState === 'roadmap') {
      this.drawRoadmapScreen(ctx, campaignStore!)
      return
    }

    // Draw campaign complete screen (full screen overlay)
    if (screenState === 'campaign_complete') {
      this.drawCampaignComplete(ctx, campaignStore!)
      return
    }

    // Clear canvas with background color
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Draw tiles (with camera offset, only visible tiles)
    this.drawTiles(ctx, levelStore, cameraStore)

    // Draw player (with camera offset)
    this.drawPlayer(ctx, playerStore, cameraStore)

    // Draw HUD (screen space)
    this.drawHUD(ctx, gameStore, playerStore)

    // ============================================
    // Debug Overlays (Admin Mode)
    // ============================================
    
    // Grid overlay (tile coordinates)
    if (gameStore.showGridOverlay) {
      this.drawGridOverlay(ctx, levelStore, cameraStore)
    }
    
    // Collision shape outlines
    if (gameStore.showCollisionShapes) {
      this.drawCollisionShapes(ctx, levelStore, cameraStore)
    }
    
    // Debug info panel
    if (gameStore.showDebugInfo) {
      this.drawDebugInfo(ctx, playerStore, gameStore, cameraStore, levelStore)
    }

    // Draw level complete overlay (campaign-aware)
    if (screenState === 'level_complete' || gameStore.levelComplete) {
      this.drawLevelCompleteScreen(ctx, gameStore, campaignStore)
      return
    }

    // Draw UI overlays (in screen space, no camera offset)
    if (gameStore.isGameOver) {
      this.drawGameOver(ctx, gameStore)
    }

    if (gameStore.isPaused && !gameStore.levelComplete && !gameStore.isGameOver && !gameStore.isAdminMenuOpen) {
      this.drawPaused(ctx)
    }

    // Admin menu overlay (on top of everything)
    if (gameStore.isAdminMenuOpen) {
      this.drawAdminMenu(ctx, levelStore.currentLevelId)
    }
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
        const tileId = level.collision[row][col]
        const tileType = getTileType(tileId)
        
        // World position
        const worldX = col * TILE_SIZE
        const worldY = row * TILE_SIZE
        
        // Screen position (offset by camera) - round to avoid sub-pixel rendering artifacts
        const screenX = Math.round(worldX - camera.x)
        const screenY = Math.round(worldY - camera.y)

        // Draw background for all tiles
        ctx.fillStyle = COLORS.empty
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)

        // Draw tile shape if not empty
        if (tileId !== TileTypeId.EMPTY) {
          this.drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
        }
      }
    }
  }

  /**
   * Draw a tile's collision shape
   */
  private drawTileShape(
    ctx: CanvasRenderingContext2D,
    shape: CollisionShape,
    color: string,
    screenX: number,
    screenY: number
  ): void {
    ctx.fillStyle = color

    if (shape.type === 'none') {
      return
    }

    if (shape.type === 'rect' && shape.rect) {
      const x = screenX + shape.rect.x * TILE_SIZE
      const y = screenY + shape.rect.y * TILE_SIZE
      const w = shape.rect.w * TILE_SIZE
      const h = shape.rect.h * TILE_SIZE
      ctx.fillRect(x, y, w, h)
    }

    if (shape.type === 'polygon' && shape.vertices) {
      this.drawPolygon(ctx, shape.vertices, screenX, screenY)
    }
  }

  /**
   * Draw a polygon shape
   */
  private drawPolygon(
    ctx: CanvasRenderingContext2D,
    vertices: NormalizedPoint[],
    screenX: number,
    screenY: number
  ): void {
    if (vertices.length < 3) return

    ctx.beginPath()
    const first = vertices[0]
    ctx.moveTo(screenX + first.x * TILE_SIZE, screenY + first.y * TILE_SIZE)

    for (let i = 1; i < vertices.length; i++) {
      const v = vertices[i]
      ctx.lineTo(screenX + v.x * TILE_SIZE, screenY + v.y * TILE_SIZE)
    }

    ctx.closePath()
    ctx.fill()
  }

  /**
   * Draw the player (with camera offset)
   */
  private drawPlayer(
    ctx: CanvasRenderingContext2D, 
    player: PlayerStore,
    camera: CameraStore
  ): void {
    // Convert world position to screen position - round to avoid sub-pixel artifacts
    const screenX = Math.round(player.x - camera.x)
    const screenY = Math.round(player.y - camera.y)

    // Player body
    ctx.fillStyle = player.isDead ? '#666' : COLORS.player
    ctx.fillRect(screenX, screenY, player.width, player.height)

    // Player outline
    ctx.strokeStyle = player.isDead ? '#444' : COLORS.playerOutline
    ctx.lineWidth = 2
    ctx.strokeRect(screenX, screenY, player.width, player.height)

    // Direction indicator (small triangle showing facing direction)
    if (!player.isDead) {
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

    // Double jump indicator
    if (player.hasDoubleJump) {
      ctx.fillStyle = COLORS.powerup
      ctx.beginPath()
      ctx.arc(screenX + player.width / 2, screenY - 10, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Timer bar
      const timerWidth = 30
      const timerHeight = 4
      const timerX = screenX + player.width / 2 - timerWidth / 2
      const timerY = screenY - 20
      const fillRatio = player.doubleJumpTimer / 10  // Assuming 10 second duration
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = COLORS.powerup
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
    }
  }

  /**
   * Draw HUD (lives, coins, etc.)
   */
  private drawHUD(
    ctx: CanvasRenderingContext2D,
    game: GameStore,
    player: PlayerStore
  ): void {
    const padding = 20
    
    // Lives (top-left)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    // Draw heart icons
    for (let i = 0; i < game.maxLives; i++) {
      const heartX = padding + i * 35
      const heartY = padding
      
      ctx.fillStyle = i < game.lives ? '#e53e3e' : '#4a5568'
      ctx.beginPath()
      // Simple heart shape
      ctx.moveTo(heartX + 12, heartY + 6)
      ctx.bezierCurveTo(heartX + 12, heartY + 2, heartX + 6, heartY, heartX + 6, heartY + 6)
      ctx.bezierCurveTo(heartX + 6, heartY + 12, heartX + 12, heartY + 18, heartX + 12, heartY + 22)
      ctx.bezierCurveTo(heartX + 12, heartY + 18, heartX + 18, heartY + 12, heartX + 18, heartY + 6)
      ctx.bezierCurveTo(heartX + 18, heartY, heartX + 12, heartY + 2, heartX + 12, heartY + 6)
      ctx.fill()
    }

    // Coins (top-right)
    ctx.fillStyle = COLORS.coin
    ctx.beginPath()
    ctx.arc(VIEWPORT_WIDTH - padding - 80, padding + 12, 12, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#d69e2e'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'right'
    ctx.fillText(`${game.coinsThisAttempt}`, VIEWPORT_WIDTH - padding - 100, padding)

    // Replay multiplier if applicable
    if (game.replayMultiplier < 1) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#888'
      ctx.fillText(`(${Math.round(game.replayMultiplier * 100)}% rate)`, VIEWPORT_WIDTH - padding, padding + 48)
    }
  }

  /**
   * Draw level complete overlay (screen space) - legacy, use drawLevelCompleteScreen
   */
  private drawLevelComplete(
    ctx: CanvasRenderingContext2D,
    game: GameStore
  ): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

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

  // ============================================
  // Campaign Screen Overlays
  // ============================================

  /**
   * Draw the intro/welcome screen with documentation
   */
  private drawIntroScreen(ctx: CanvasRenderingContext2D, campaign: CampaignStore): void {
    const centerX = VIEWPORT_WIDTH / 2

    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT)
    bgGradient.addColorStop(0, '#0d1117')
    bgGradient.addColorStop(0.5, '#161b22')
    bgGradient.addColorStop(1, '#0d1117')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Subtle grid pattern overlay
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)'
    ctx.lineWidth = 1
    for (let x = 0; x < VIEWPORT_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, VIEWPORT_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y < VIEWPORT_HEIGHT; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(VIEWPORT_WIDTH, y)
      ctx.stroke()
    }

    // Corner accents
    const cornerSize = 40
    ctx.strokeStyle = '#58a6ff'
    ctx.lineWidth = 3
    // Top-left
    ctx.beginPath()
    ctx.moveTo(20, 20 + cornerSize)
    ctx.lineTo(20, 20)
    ctx.lineTo(20 + cornerSize, 20)
    ctx.stroke()
    // Top-right
    ctx.beginPath()
    ctx.moveTo(VIEWPORT_WIDTH - 20 - cornerSize, 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, 20 + cornerSize)
    ctx.stroke()
    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(20, VIEWPORT_HEIGHT - 20 - cornerSize)
    ctx.lineTo(20, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(20 + cornerSize, VIEWPORT_HEIGHT - 20)
    ctx.stroke()
    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(VIEWPORT_WIDTH - 20 - cornerSize, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, VIEWPORT_HEIGHT - 20 - cornerSize)
    ctx.stroke()

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
    const gradient = ctx.createLinearGradient(centerX - lineWidth/2, 0, centerX + lineWidth/2, 0)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(0.2, '#58a6ff')
    gradient.addColorStop(0.5, '#79c0ff')
    gradient.addColorStop(0.8, '#58a6ff')
    gradient.addColorStop(1, 'transparent')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX - lineWidth/2, y)
    ctx.lineTo(centerX + lineWidth/2, y)
    ctx.stroke()

    // Features in a cleaner layout
    y += 40
    ctx.fillStyle = '#c9d1d9'
    ctx.font = '14px Arial'
    const features = '6 Levels  •  Hazards  •  Coins  •  Checkpoints  •  Power-ups'
    ctx.fillText(features, centerX, y)

    // Controls section with better styling
    y += 45
    
    // Control box background - taller for better padding
    const boxWidth = 520
    const boxHeight = 95
    const boxX = centerX - boxWidth/2
    ctx.fillStyle = 'rgba(22, 27, 34, 0.8)'
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.8)'
    ctx.lineWidth = 1
    this.roundRect(ctx, boxX, y, boxWidth, boxHeight, 8)
    ctx.fill()
    ctx.stroke()

    // Controls header - more top padding
    const controlsStartY = y + 22
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 12px Arial'
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

    y += boxHeight

    // Admin mode indicator (if enabled)
    if (campaign.isAdminMode) {
      y += 25
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)'
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'
      const adminBoxWidth = 380
      const adminBoxHeight = 50
      this.roundRect(ctx, centerX - adminBoxWidth/2, y, adminBoxWidth, adminBoxHeight, 6)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#f59e0b'
      ctx.font = 'bold 11px Arial'
      ctx.fillText('DEV BUILD', centerX, y + 18)
      
      ctx.fillStyle = '#b45309'
      ctx.font = '11px Arial'
      ctx.fillText('` Level Select  •  Ctrl+S Save  •  Ctrl+O Load', centerX, y + 35)

      y += adminBoxHeight

      // Hacker terminal progress box
      y += 20
      const termWidth = 580
      const termHeight = 168
      const termX = centerX - termWidth / 2

      // Terminal background with scanline effect
      ctx.fillStyle = '#0d1117'
      ctx.strokeStyle = '#238636'
      ctx.lineWidth = 1
      this.roundRect(ctx, termX, y, termWidth, termHeight, 4)
      ctx.fill()
      ctx.stroke()

      // Terminal header bar
      ctx.fillStyle = '#161b22'
      this.roundRect(ctx, termX, y, termWidth, 22, 4)
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
      // Progress bar background
      const barX = termX + 115
      const barY = termY 
      const barWidth = 120
      const barHeight = 8
      const progress = 0.45
      ctx.fillStyle = '#21262d'
      ctx.fillRect(barX, barY, barWidth, barHeight)
      // Progress bar fill
      ctx.fillStyle = '#238636'
      ctx.fillRect(barX, barY, barWidth * progress, barHeight)
      // Border
      ctx.strokeStyle = '#30363d'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, barWidth, barHeight)
      // Percentage text
      ctx.fillStyle = '#8b949e'
      ctx.fillText('45%', barX + barWidth + 10, termY)
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
      ctx.fillStyle = this.isTerminalHovered ? '#79c0ff' : '#58a6ff'
      ctx.fillText('click anywhere to view full roadmap', termX + 26, termY)

      // Store terminal bounds for click detection
      this.terminalBounds = { x: termX, y: y, width: termWidth, height: termHeight }

      // Draw hover highlight if hovered
      if (this.isTerminalHovered) {
        ctx.strokeStyle = '#58a6ff'
        ctx.lineWidth = 2
        this.roundRect(ctx, termX, y, termWidth, termHeight, 4)
        ctx.stroke()
      }

      ctx.textAlign = 'center'
    }

    // Start prompt with pulsing glow
    const promptY = VIEWPORT_HEIGHT - 75
    const pulse = Math.sin(Date.now() / 400) * 0.4 + 0.6
    
    ctx.shadowColor = '#58a6ff'
    ctx.shadowBlur = 15 * pulse
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('Press SPACE or ENTER to Begin', centerX, promptY)
    ctx.shadowBlur = 0

    // Subtle version info
    ctx.fillStyle = '#484f58'
    ctx.font = '11px Arial'
    ctx.fillText('v0.1.0 - Early Development', centerX, VIEWPORT_HEIGHT - 30)
  }

  /**
   * Draw the full roadmap screen with phase details
   */
  private drawRoadmapScreen(ctx: CanvasRenderingContext2D, campaign: CampaignStore): void {
    const centerX = VIEWPORT_WIDTH / 2

    // Gradient background (same as intro)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, VIEWPORT_HEIGHT)
    bgGradient.addColorStop(0, '#0d1117')
    bgGradient.addColorStop(0.5, '#161b22')
    bgGradient.addColorStop(1, '#0d1117')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.3)'
    ctx.lineWidth = 1
    for (let x = 0; x < VIEWPORT_WIDTH; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, VIEWPORT_HEIGHT)
      ctx.stroke()
    }
    for (let gridY = 0; gridY < VIEWPORT_HEIGHT; gridY += 40) {
      ctx.beginPath()
      ctx.moveTo(0, gridY)
      ctx.lineTo(VIEWPORT_WIDTH, gridY)
      ctx.stroke()
    }

    // Corner accents
    const cornerSize = 40
    ctx.strokeStyle = '#238636'
    ctx.lineWidth = 3
    // Top-left
    ctx.beginPath()
    ctx.moveTo(20, 20 + cornerSize)
    ctx.lineTo(20, 20)
    ctx.lineTo(20 + cornerSize, 20)
    ctx.stroke()
    // Top-right
    ctx.beginPath()
    ctx.moveTo(VIEWPORT_WIDTH - 20 - cornerSize, 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, 20 + cornerSize)
    ctx.stroke()
    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(20, VIEWPORT_HEIGHT - 20 - cornerSize)
    ctx.lineTo(20, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(20 + cornerSize, VIEWPORT_HEIGHT - 20)
    ctx.stroke()
    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(VIEWPORT_WIDTH - 20 - cornerSize, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, VIEWPORT_HEIGHT - 20)
    ctx.lineTo(VIEWPORT_WIDTH - 20, VIEWPORT_HEIGHT - 20 - cornerSize)
    ctx.stroke()

    // Roadmap phases data with detailed info
    const phases = [
      {
        name: 'MVP: Core Gameplay',
        status: 'complete',
        progress: 1.0,
        items: ['Physics Engine', 'Collision System', 'Player Controls', 'Level Loading', 'Win/Lose States'],
        description: 'The foundational game engine that powers all gameplay. Includes gravity, movement, and basic level mechanics.',
        completed: [
          'Grid-based physics with 64px tiles',
          'AABB collision detection with shapes',
          'Keyboard input (WASD/Arrows)',
          'JSON level loading system',
          'Goal detection and level complete state',
          'Game over and restart flow',
        ],
        upcoming: [],
      },
      {
        name: 'Gameplay Systems',
        status: 'complete',
        progress: 1.0,
        items: ['Hazards & Lives', 'Checkpoints', 'Coin Economy', 'Power-ups', 'One-Way Platforms'],
        description: 'Core gameplay mechanics that make the game fun and challenging.',
        completed: [
          'Spike hazards (4 directions)',
          'Lives system with respawning',
          'Mid-level checkpoints',
          'Coin collection with wallet',
          'Double-jump power-up (10s duration)',
          'One-way platforms (pass through from below)',
          'Replay coin multiplier system',
        ],
        upcoming: [],
      },
      {
        name: 'Campaign & Progression',
        status: 'in_progress',
        progress: 0.7,
        items: ['Campaign Flow', 'Level Progression', 'Session Stats', 'Overworld UI', 'Cloud Saves'],
        description: 'The meta-game structure that ties levels together into a cohesive experience.',
        completed: [
          'Intro screen with game info',
          'Level complete screen with stats',
          'Campaign complete with breakdown',
          'Ordered level progression (6 levels)',
          'Session statistics tracking',
          'Admin mode for development',
        ],
        upcoming: [
          'Visual overworld/level select UI',
          'Level unlock system',
          'Persistent progress (localStorage)',
          'Cloud saves with Firebase',
        ],
      },
      {
        name: 'Level Builder',
        status: 'pending',
        progress: 0.15,
        items: ['JSON Schema', 'Visual Editor UI', 'Tile Palette', 'Entity Placement', 'Firebase Storage'],
        description: 'A visual editor for creating and sharing custom levels.',
        completed: [
          'JSON export/import (Ctrl+S/O)',
          'Code-based level helpers',
        ],
        upcoming: [
          'Full JSON schema definition',
          'React-based visual editor',
          'Click-to-paint tile placement',
          'Entity palette (enemies, items)',
          'Layer management (collision, decor)',
          'Firebase level storage & sharing',
        ],
      },
      {
        name: 'Asset Pipeline',
        status: 'pending',
        progress: 0.0,
        items: ['Spritesheet System', 'Theme Swapping', 'Animation System', 'Audio Integration'],
        description: 'Visual and audio polish to bring the game to life.',
        completed: [],
        upcoming: [
          'Spritesheet loading & rendering',
          'Theme system (swap visual styles)',
          'Player animation states',
          'Enemy animations',
          'Sound effects integration',
          'Background music system',
        ],
      },
    ]

    // If a phase is selected, show detail view
    if (this.selectedRoadmapPhase !== null && this.selectedRoadmapPhase < phases.length) {
      this.drawPhaseDetail(ctx, phases[this.selectedRoadmapPhase], centerX)
      return
    }

    // ============================================
    // List View - Title and Phase Cards
    // ============================================

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

    // Draw phase cards (list view)
    y += 35
    const cardWidth = 480
    const cardHeight = 70
    const cardGap = 10
    const cardX = centerX - cardWidth / 2
    const cardsStartY = y

    // Store bounds for click detection
    this.roadmapPhaseBounds = {
      cardX,
      startY: cardsStartY,
      cardWidth,
      cardHeight,
      cardGap,
      phaseCount: phases.length,
    }

    phases.forEach((phase, index) => {
      const isHovered = this.hoveredRoadmapPhase === index

      // Card background
      let bgColor = isHovered ? 'rgba(33, 38, 45, 0.95)' : 'rgba(22, 27, 34, 0.9)'
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
      this.roundRect(ctx, cardX, y, cardWidth, cardHeight, 6)
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

      y += cardHeight + cardGap
    })

    // Milestones section
    y += 10
    ctx.fillStyle = '#58a6ff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('MILESTONES', centerX, y)

    y += 25
    const milestones = [
      { name: 'M1: First Frame', done: true },
      { name: 'M2: Movement', done: true },
      { name: 'M3: Level Load', done: true },
      { name: 'M4: Builder Alpha', done: false },
      { name: 'M5: Firebase Live', done: false },
      { name: 'M6: Campaign Flow', done: true },
    ]

    const msWidth = 130
    const startX = centerX - (milestones.length * msWidth) / 2

    milestones.forEach((ms, i) => {
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

    // Connecting line between milestones
    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(startX + msWidth / 2, y)
    ctx.lineTo(startX + (milestones.length - 1) * msWidth + msWidth / 2, y)
    ctx.stroke()

    // Redraw circles on top of line
    milestones.forEach((ms, i) => {
      const msX = startX + i * msWidth + msWidth / 2
      ctx.beginPath()
      ctx.arc(msX, y, 8, 0, Math.PI * 2)
      ctx.fillStyle = ms.done ? '#238636' : '#21262d'
      ctx.fill()
      ctx.strokeStyle = ms.done ? '#238636' : '#30363d'
      ctx.lineWidth = 2
      ctx.stroke()
      if (ms.done) {
        ctx.fillStyle = '#0d1117'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('✓', msX, y + 4)
      }
    })

    // Return prompt
    ctx.fillStyle = '#6e7681'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Press ESC or TAB to return', centerX, VIEWPORT_HEIGHT - 35)
  }

  /**
   * Draw detailed view for a specific roadmap phase
   */
  private drawPhaseDetail(
    ctx: CanvasRenderingContext2D,
    phase: {
      name: string
      status: string
      progress: number
      description: string
      completed: string[]
      upcoming: string[]
    },
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
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 4)
    ctx.fill()
    
    if (phase.progress > 0) {
      ctx.fillStyle = statusColor
      this.roundRect(ctx, barX, barY, barWidth * phase.progress, barHeight, 4)
      ctx.fill()
    }

    ctx.strokeStyle = '#30363d'
    ctx.lineWidth = 1
    this.roundRect(ctx, barX, barY, barWidth, barHeight, 4)
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

  /**
   * Draw a rounded rectangle path
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * Draw level complete screen with stats and continue option
   */
  private drawLevelCompleteScreen(
    ctx: CanvasRenderingContext2D, 
    game: GameStore,
    campaign?: CampaignStore
  ): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

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
   * Draw campaign complete screen with full stats and level select
   */
  private drawCampaignComplete(ctx: CanvasRenderingContext2D, campaign: CampaignStore): void {
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
    ctx.font = '15px Arial'
    ctx.textAlign = 'left'
    const tableX = 200
    
    // Header
    ctx.fillStyle = '#a0aec0'
    ctx.fillText('Level', tableX, y)
    ctx.fillText('Deaths', tableX + 250, y)
    ctx.fillText('Coins', tableX + 350, y)
    
    y += 5
    ctx.strokeStyle = '#4a5568'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(tableX - 10, y + 10)
    ctx.lineTo(tableX + 420, y + 10)
    ctx.stroke()
    
    y += 20
    
    // Level rows
    campaign.allLevelStats.forEach((levelStat) => {
      ctx.fillStyle = '#e2e8f0'
      ctx.fillText(levelStat.levelName, tableX, y)
      ctx.fillText(String(levelStat.deaths), tableX + 270, y)
      ctx.fillStyle = COLORS.coin
      ctx.fillText(String(levelStat.coinsCollected), tableX + 370, y)
      y += 25
    })

    ctx.textAlign = 'center'

    // Admin level select
    if (campaign.isAdminMode) {
      y = VIEWPORT_HEIGHT - 140
      ctx.fillStyle = '#f56565'
      ctx.font = 'bold 16px Arial'
      ctx.fillText('[ ADMIN: Press 1-6 to jump to any level, or ` for level select ]', centerX, y)
    }

    // Options
    y = VIEWPORT_HEIGHT - 90
    ctx.fillStyle = '#4299e1'
    ctx.font = 'bold 22px Arial'
    ctx.fillText('Press SPACE to Play Again', centerX, y)
    
    y += 35
    ctx.fillStyle = '#a0aec0'
    ctx.font = '16px Arial'
    ctx.fillText('Press ESC to return to title screen', centerX, y)
  }

  /**
   * Draw game over overlay
   */
  private drawGameOver(
    ctx: CanvasRenderingContext2D,
    game: GameStore
  ): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

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
   * Draw paused overlay (screen space)
   */
  private drawPaused(ctx: CanvasRenderingContext2D): void {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Paused text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PAUSED', VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2)
  }

  /**
   * Draw admin level selector overlay
   */
  drawAdminMenu(ctx: CanvasRenderingContext2D, currentLevelId: string | null): void {
    const levels = getAllLevels()
    
    // Menu dimensions
    const menuWidth = 500
    const menuHeight = 60 + levels.length * 40 + 60  // title + items + footer
    const menuX = (VIEWPORT_WIDTH - menuWidth) / 2
    const menuY = (VIEWPORT_HEIGHT - menuHeight) / 2
    const itemHeight = 40
    const startY = menuY + 60  // After title
    
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)
    
    // Menu background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.95)'
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight)
    
    // Menu border
    ctx.strokeStyle = '#4299e1'
    ctx.lineWidth = 2
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight)
    
    // Title
    ctx.fillStyle = '#4299e1'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ADMIN: LEVEL SELECT', VIEWPORT_WIDTH / 2, menuY + 35)
    
    // Level list
    ctx.font = '18px Arial'
    ctx.textAlign = 'left'
    
    levels.forEach((level, index) => {
      const itemY = startY + index * itemHeight
      const isCurrentLevel = level.id === currentLevelId
      const isHovered = this.hoveredLevelIndex === index
      
      // Highlight hovered level
      if (isHovered && !isCurrentLevel) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5)
      }
      
      // Highlight current level
      if (isCurrentLevel) {
        ctx.fillStyle = 'rgba(66, 153, 225, 0.3)'
        ctx.fillRect(menuX + 10, itemY, menuWidth - 20, itemHeight - 5)
      }
      
      // Text color based on state
      const textColor = isCurrentLevel ? '#4299e1' : (isHovered ? '#63b3ed' : '#ffffff')
      ctx.fillStyle = textColor
      
      // Level indicator
      const indicator = isCurrentLevel ? '>' : (isHovered ? '>' : ' ')
      ctx.fillText(`[${indicator}]`, menuX + 20, itemY + itemHeight / 2)
      
      // Level ID
      ctx.fillStyle = isHovered ? '#aaa' : '#888'
      ctx.fillText(level.id, menuX + 60, itemY + itemHeight / 2)
      
      // Level name
      ctx.fillStyle = textColor
      ctx.fillText(`- ${level.name}`, menuX + 220, itemY + itemHeight / 2)
    })
    
    // Footer instructions
    const footerY = startY + levels.length * itemHeight + 20
    ctx.fillStyle = '#666'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Click to load  |  ` or ESC to close', VIEWPORT_WIDTH / 2, footerY)
    
    // Store menu bounds for click detection
    this.adminMenuBounds = {
      x: menuX,
      y: startY,
      width: menuWidth,
      itemHeight,
      levelCount: levels.length,
    }
  }
  
  // Store bounds for click detection
  adminMenuBounds: {
    x: number
    y: number
    width: number
    itemHeight: number
    levelCount: number
  } | null = null
  
  // Track hovered level index for visual feedback
  hoveredLevelIndex: number | null = null

  // ============================================
  // Intro Screen Terminal State
  // ============================================

  // Terminal bounds for click detection
  terminalBounds: { x: number; y: number; width: number; height: number } | null = null

  // Track if terminal is hovered
  isTerminalHovered = false

  /**
   * Update terminal hover state
   */
  updateTerminalHover(mouseX: number, mouseY: number): void {
    if (!this.terminalBounds) {
      this.isTerminalHovered = false
      return
    }

    const { x, y, width, height } = this.terminalBounds
    this.isTerminalHovered = mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height
  }

  /**
   * Check if click is on terminal
   */
  isTerminalClicked(clickX: number, clickY: number): boolean {
    if (!this.terminalBounds) return false

    const { x, y, width, height } = this.terminalBounds
    return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height
  }

  /**
   * Clear terminal state
   */
  clearTerminalState(): void {
    this.isTerminalHovered = false
    this.terminalBounds = null
  }
  
  /**
   * Update hover position for admin menu
   */
  updateHoverPosition(mouseX: number, mouseY: number): void {
    if (!this.adminMenuBounds) {
      this.hoveredLevelIndex = null
      return
    }
    
    const { x, y, width, itemHeight, levelCount } = this.adminMenuBounds
    
    // Check if mouse is within menu item bounds
    if (mouseX < x || mouseX > x + width) {
      this.hoveredLevelIndex = null
      return
    }
    if (mouseY < y || mouseY > y + levelCount * itemHeight) {
      this.hoveredLevelIndex = null
      return
    }
    
    // Calculate which level is hovered
    const index = Math.floor((mouseY - y) / itemHeight)
    if (index >= 0 && index < levelCount) {
      this.hoveredLevelIndex = index
    } else {
      this.hoveredLevelIndex = null
    }
  }
  
  /**
   * Clear hover state when menu closes
   */
  clearHover(): void {
    this.hoveredLevelIndex = null
  }

  // ============================================
  // Roadmap Phase Selection State
  // ============================================

  // Currently selected phase for detail view (null = list view)
  selectedRoadmapPhase: number | null = null

  // Hovered phase index for visual feedback
  hoveredRoadmapPhase: number | null = null

  // Store phase card bounds for click detection
  roadmapPhaseBounds: {
    cardX: number
    startY: number
    cardWidth: number
    cardHeight: number
    cardGap: number
    phaseCount: number
  } | null = null

  /**
   * Update hover position for roadmap phases
   */
  updateRoadmapHover(mouseX: number, mouseY: number): void {
    if (!this.roadmapPhaseBounds) {
      this.hoveredRoadmapPhase = null
      return
    }

    const { cardX, startY, cardWidth, cardHeight, cardGap, phaseCount } = this.roadmapPhaseBounds

    // Check if mouse is within card bounds horizontally
    if (mouseX < cardX || mouseX > cardX + cardWidth) {
      this.hoveredRoadmapPhase = null
      return
    }

    // Calculate which phase is hovered
    const relativeY = mouseY - startY
    if (relativeY < 0) {
      this.hoveredRoadmapPhase = null
      return
    }

    const totalCardHeight = cardHeight + cardGap
    const index = Math.floor(relativeY / totalCardHeight)
    const withinCard = (relativeY % totalCardHeight) < cardHeight

    if (index >= 0 && index < phaseCount && withinCard) {
      this.hoveredRoadmapPhase = index
    } else {
      this.hoveredRoadmapPhase = null
    }
  }

  /**
   * Handle click on roadmap - returns true if a phase was clicked
   */
  handleRoadmapClick(clickX: number, clickY: number): boolean {
    // If already viewing a phase detail, check for back button
    if (this.selectedRoadmapPhase !== null) {
      // Back button area (approximate - top left area)
      if (clickX < 150 && clickY < 100) {
        this.selectedRoadmapPhase = null
        return true
      }
      return false
    }

    // Check if clicking on a phase card
    if (!this.roadmapPhaseBounds) return false

    const { cardX, startY, cardWidth, cardHeight, cardGap, phaseCount } = this.roadmapPhaseBounds

    if (clickX < cardX || clickX > cardX + cardWidth) return false

    const relativeY = clickY - startY
    if (relativeY < 0) return false

    const totalCardHeight = cardHeight + cardGap
    const index = Math.floor(relativeY / totalCardHeight)
    const withinCard = (relativeY % totalCardHeight) < cardHeight

    if (index >= 0 && index < phaseCount && withinCard) {
      this.selectedRoadmapPhase = index
      return true
    }

    return false
  }

  /**
   * Clear roadmap selection state
   */
  clearRoadmapSelection(): void {
    this.selectedRoadmapPhase = null
    this.hoveredRoadmapPhase = null
    this.roadmapPhaseBounds = null
  }
  
  /**
   * Get level ID from click position in admin menu
   */
  getLevelAtPosition(clickX: number, clickY: number): string | null {
    if (!this.adminMenuBounds) return null
    
    const { x, y, width, itemHeight, levelCount } = this.adminMenuBounds
    
    // Check if click is within menu bounds
    if (clickX < x || clickX > x + width) return null
    if (clickY < y || clickY > y + levelCount * itemHeight) return null
    
    // Calculate which level was clicked
    const index = Math.floor((clickY - y) / itemHeight)
    if (index < 0 || index >= levelCount) return null
    
    const levels = getAllLevels()
    return levels[index]?.id || null
  }

  // ============================================
  // Debug Overlay Methods
  // ============================================

  /**
   * Draw grid overlay showing tile coordinates
   */
  private drawGridOverlay(
    ctx: CanvasRenderingContext2D,
    level: LevelStore,
    camera: CameraStore
  ): void {
    const cameraX = Math.floor(camera.x)
    const cameraY = Math.floor(camera.y)
    
    // Calculate visible tile range
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE))
    const endCol = Math.min(level.width, Math.ceil((cameraX + VIEWPORT_WIDTH) / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE))
    const endRow = Math.min(level.height, Math.ceil((cameraY + VIEWPORT_HEIGHT) / TILE_SIZE))
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const screenX = col * TILE_SIZE - cameraX
        const screenY = row * TILE_SIZE - cameraY
        
        // Draw grid lines
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
        
        // Draw coordinates at center of tile
        ctx.fillText(`${col},${row}`, screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2)
      }
    }
  }

  /**
   * Draw collision shape outlines for all visible tiles
   */
  private drawCollisionShapes(
    ctx: CanvasRenderingContext2D,
    level: LevelStore,
    camera: CameraStore
  ): void {
    const cameraX = Math.floor(camera.x)
    const cameraY = Math.floor(camera.y)
    
    // Calculate visible tile range
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE))
    const endCol = Math.min(level.width, Math.ceil((cameraX + VIEWPORT_WIDTH) / TILE_SIZE))
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE))
    const endRow = Math.min(level.height, Math.ceil((cameraY + VIEWPORT_HEIGHT) / TILE_SIZE))
    
    ctx.lineWidth = 2
    
    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileId = level.getTileAt(col, row)
        if (tileId === TileTypeId.EMPTY) continue
        
        const tileType = getTileType(tileId)
        const screenX = col * TILE_SIZE - cameraX
        const screenY = row * TILE_SIZE - cameraY
        
        // Color based on tile category
        if (tileType.category === 'hazard') {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
        } else if (tileType.category === 'pickup') {
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'
        } else if (tileType.category === 'trigger') {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'
        } else if (tileType.category === 'platform') {
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        }
        
        // Draw collision shape
        const collision = tileType.collision
        if (collision.type === 'rect' && collision.rect) {
          const r = collision.rect
          ctx.strokeRect(
            screenX + r.x * TILE_SIZE,
            screenY + r.y * TILE_SIZE,
            r.w * TILE_SIZE,
            r.h * TILE_SIZE
          )
        } else if (collision.type === 'polygon' && collision.vertices) {
          ctx.beginPath()
          const verts = collision.vertices
          ctx.moveTo(
            screenX + verts[0].x * TILE_SIZE,
            screenY + verts[0].y * TILE_SIZE
          )
          for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(
              screenX + verts[i].x * TILE_SIZE,
              screenY + verts[i].y * TILE_SIZE
            )
          }
          ctx.closePath()
          ctx.stroke()
        }
      }
    }
  }

  /**
   * Draw debug information panel
   */
  private drawDebugInfo(
    ctx: CanvasRenderingContext2D,
    player: PlayerStore,
    game: GameStore,
    camera: CameraStore,
    level: LevelStore
  ): void {
    const panelX = 10
    const panelY = 60
    const panelWidth = 220
    const lineHeight = 16
    
    // Build debug lines
    const lines = [
      `Player: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`,
      `Velocity: (${player.vx.toFixed(0)}, ${player.vy.toFixed(0)})`,
      `Grid: (${Math.floor(player.x / TILE_SIZE)}, ${Math.floor(player.y / TILE_SIZE)})`,
      `Grounded: ${player.isGrounded}`,
      `Jumps: ${player.jumpsRemaining}`,
      `Camera: (${camera.x.toFixed(0)}, ${camera.y.toFixed(0)})`,
      `Level: ${level.width}x${level.height}`,
      `─────────────────────`,
      `God Mode: ${game.isGodMode ? 'ON' : 'OFF'}`,
      `Noclip: ${game.isNoclip ? 'ON' : 'OFF'}`,
    ]
    
    const panelHeight = lines.length * lineHeight + 20
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)
    
    // Draw text
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    lines.forEach((line, i) => {
      // Highlight active modes in green
      if (line.includes(': ON')) {
        ctx.fillStyle = '#00ff00'
      } else {
        ctx.fillStyle = '#ffffff'
      }
      ctx.fillText(line, panelX + 10, panelY + 10 + i * lineHeight)
    })
  }
}

// Singleton instance
export const canvasRenderer = new CanvasRenderer()
