import { TILE_SIZE, COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../core/constants'
import { getTileType, TileTypeId } from '../core/types/shapes'
import type { CollisionShape, NormalizedPoint } from '../core/types/shapes'
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'
import type { CameraStore } from '../stores/CameraStore'
import { getAllLevels } from '../levels'

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

    // Draw HUD (screen space)
    this.drawHUD(ctx, gameStore, playerStore)

    // Draw UI overlays (in screen space, no camera offset)
    if (gameStore.levelComplete) {
      this.drawLevelComplete(ctx, gameStore)
    }

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
    
    // Total coins (smaller, below)
    ctx.font = '14px Arial'
    ctx.fillStyle = '#aaa'
    ctx.fillText(`Total: ${game.totalCoins}`, VIEWPORT_WIDTH - padding, padding + 30)

    // Replay multiplier if applicable
    if (game.replayMultiplier < 1) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#888'
      ctx.fillText(`(${Math.round(game.replayMultiplier * 100)}% rate)`, VIEWPORT_WIDTH - padding, padding + 48)
    }
  }

  /**
   * Draw level complete overlay (screen space)
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
    ctx.fillRect(10, 60, 200, 120)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    const lines = [
      `Camera: (${camera.x.toFixed(0)}, ${camera.y.toFixed(0)})`,
      `Player: (${player.x.toFixed(0)}, ${player.y.toFixed(0)})`,
      `Velocity: (${player.vx.toFixed(0)}, ${player.vy.toFixed(0)})`,
      `Grounded: ${player.isGrounded}`,
      `Jumps: ${player.jumpsRemaining}`,
      `Level: ${level.width}x${level.height}`,
    ]
    
    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 70 + i * 16)
    })
  }
}

// Singleton instance
export const canvasRenderer = new CanvasRenderer()
