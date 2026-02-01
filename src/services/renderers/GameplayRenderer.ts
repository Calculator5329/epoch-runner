import { TILE_SIZE, COLORS, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, TRIPLE_JUMP_DURATION } from '../../core/constants'
import { getTileType, TileTypeId } from '../../core/types/shapes'
import type { CollisionShape, NormalizedPoint } from '../../core/types/shapes'
import type { PlayerStore } from '../../stores/PlayerStore'
import type { LevelStore } from '../../stores/LevelStore'
import type { GameStore } from '../../stores/GameStore'
import type { CameraStore } from '../../stores/CameraStore'
import type { AssetStore } from '../../stores/AssetStore'

/**
 * GameplayRenderer - Renders core gameplay elements
 * 
 * Handles rendering of tiles, player, and HUD during active gameplay.
 * All world objects are offset by camera position.
 */
export class GameplayRenderer {
  /**
   * Draw all gameplay elements (called during 'playing' screen state)
   */
  draw(
    ctx: CanvasRenderingContext2D,
    levelStore: LevelStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    cameraStore: CameraStore,
    assetStore?: AssetStore
  ): void {
    // Clear canvas with background color
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Draw background image if available
    if (assetStore?.background) {
      this.drawBackground(ctx, cameraStore, assetStore.background)
    }

    // Draw tiles (with camera offset, only visible tiles)
    this.drawTiles(ctx, levelStore, cameraStore, assetStore)

    // Draw player (with camera offset)
    this.drawPlayer(ctx, playerStore, cameraStore, assetStore)

    // Draw HUD (screen space)
    this.drawHUD(ctx, gameStore, playerStore, assetStore)
  }

  /**
   * Draw parallax background image
   */
  private drawBackground(
    ctx: CanvasRenderingContext2D,
    camera: CameraStore,
    background: HTMLImageElement
  ): void {
    // Simple parallax - background moves at 50% camera speed
    const parallaxFactor = 0.5
    const offsetX = -camera.x * parallaxFactor
    const offsetY = -camera.y * parallaxFactor

    // Tile the background if smaller than viewport
    const imgWidth = background.width
    const imgHeight = background.height

    // Calculate starting position for tiling
    const startX = Math.floor(offsetX / imgWidth) * imgWidth + (offsetX % imgWidth)
    const startY = Math.floor(offsetY / imgHeight) * imgHeight + (offsetY % imgHeight)

    // Draw tiled background
    for (let y = startY; y < VIEWPORT_HEIGHT; y += imgHeight) {
      for (let x = startX; x < VIEWPORT_WIDTH; x += imgWidth) {
        ctx.drawImage(background, x, y)
      }
    }
  }

  /**
   * Draw only visible tiles in the level (optimized for large levels)
   */
  drawTiles(
    ctx: CanvasRenderingContext2D, 
    level: LevelStore,
    camera: CameraStore,
    assetStore?: AssetStore
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

        // Draw background for all tiles (only if no custom background)
        if (!assetStore?.background) {
          ctx.fillStyle = COLORS.empty
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
        }

        // Draw tile if not empty
        if (tileId !== TileTypeId.EMPTY) {
          // Check for custom sprite first
          const sprite = assetStore?.getTileSprite(tileId)
          if (sprite) {
            this.drawTileSprite(ctx, sprite, screenX, screenY)
          } else {
            // Fall back to procedural rendering
            this.drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
          }
        }
      }
    }
  }

  /**
   * Draw a tile using a custom sprite image
   */
  private drawTileSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement,
    screenX: number,
    screenY: number
  ): void {
    // Draw sprite scaled to TILE_SIZE
    ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE)
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
  drawPlayer(
    ctx: CanvasRenderingContext2D, 
    player: PlayerStore,
    camera: CameraStore,
    assetStore?: AssetStore
  ): void {
    // Convert world position to screen position - round to avoid sub-pixel artifacts
    const screenX = Math.round(player.x - camera.x)
    const screenY = Math.round(player.y - camera.y)

    // Check for custom player sprites
    const playerSprites = assetStore?.playerSprites
    const hasCustomSprites = playerSprites && (playerSprites.idle || playerSprites.run || playerSprites.jump)

    if (hasCustomSprites && !player.isDead) {
      // Determine which sprite to use based on player state
      let sprite: HTMLImageElement | undefined

      if (!player.isGrounded && player.vy !== 0) {
        // In air - use jump sprite if available
        sprite = playerSprites.jump || playerSprites.idle
      } else if (player.vx !== 0) {
        // Moving - use run sprite if available
        sprite = playerSprites.run || playerSprites.idle
      } else {
        // Idle
        sprite = playerSprites.idle
      }

      if (sprite) {
        this.drawPlayerSprite(ctx, sprite, player, screenX, screenY)
      } else {
        // Fall back to procedural
        this.drawPlayerProcedural(ctx, player, screenX, screenY)
      }
    } else {
      // No custom sprites or player is dead - use procedural rendering
      this.drawPlayerProcedural(ctx, player, screenX, screenY)
    }

    // Triple jump indicator (always draw on top of sprite)
    if (player.hasTripleJump) {
      ctx.fillStyle = COLORS.powerup
      ctx.beginPath()
      ctx.arc(screenX + player.width / 2, screenY - 10, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Timer bar
      const timerWidth = 30
      const timerHeight = 4
      const timerX = screenX + player.width / 2 - timerWidth / 2
      const timerY = screenY - 20
      const fillRatio = player.tripleJumpTimer / TRIPLE_JUMP_DURATION
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = COLORS.powerup
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
    }
  }

  /**
   * Draw player using custom sprite
   */
  private drawPlayerSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement,
    player: PlayerStore,
    screenX: number,
    screenY: number
  ): void {
    ctx.save()

    // Flip sprite horizontally if facing left
    if (!player.isFacingRight) {
      ctx.translate(screenX + player.width, screenY)
      ctx.scale(-1, 1)
      ctx.drawImage(sprite, 0, 0, player.width, player.height)
    } else {
      ctx.drawImage(sprite, screenX, screenY, player.width, player.height)
    }

    ctx.restore()
  }

  /**
   * Draw player using procedural rendering (rectangles)
   */
  private drawPlayerProcedural(
    ctx: CanvasRenderingContext2D,
    player: PlayerStore,
    screenX: number,
    screenY: number
  ): void {
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
  }

  /**
   * Draw HUD (lives, coins, etc.)
   */
  drawHUD(
    ctx: CanvasRenderingContext2D,
    game: GameStore,
    _player: PlayerStore,
    assetStore?: AssetStore
  ): void {
    const padding = 20
    
    // Lives (top-left)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    
    // Draw heart icons
    const heartSprite = assetStore?.uiSprites.get('heart')
    const heartEmptySprite = assetStore?.uiSprites.get('heart_empty')

    for (let i = 0; i < game.maxLives; i++) {
      const heartX = padding + i * 35
      const heartY = padding
      const isAlive = i < game.lives
      
      // Use custom heart sprites if available
      if (isAlive && heartSprite) {
        ctx.drawImage(heartSprite, heartX, heartY, 24, 24)
      } else if (!isAlive && heartEmptySprite) {
        ctx.drawImage(heartEmptySprite, heartX, heartY, 24, 24)
      } else {
        // Fall back to procedural heart
        ctx.fillStyle = isAlive ? '#e53e3e' : '#4a5568'
        ctx.beginPath()
        ctx.moveTo(heartX + 12, heartY + 6)
        ctx.bezierCurveTo(heartX + 12, heartY + 2, heartX + 6, heartY, heartX + 6, heartY + 6)
        ctx.bezierCurveTo(heartX + 6, heartY + 12, heartX + 12, heartY + 18, heartX + 12, heartY + 22)
        ctx.bezierCurveTo(heartX + 12, heartY + 18, heartX + 18, heartY + 12, heartX + 18, heartY + 6)
        ctx.bezierCurveTo(heartX + 18, heartY, heartX + 12, heartY + 2, heartX + 12, heartY + 6)
        ctx.fill()
      }
    }

    // Coins (top-right) - Show wallet total + current level coins
    // When level is complete, coins are already added to totalCoins, so don't double-count
    const displayCoins = game.levelComplete 
      ? game.totalCoins 
      : game.totalCoins + game.coinsThisAttempt
    
    // Use custom coin sprite if available
    const coinSprite = assetStore?.uiSprites.get('coin')
    if (coinSprite) {
      ctx.drawImage(coinSprite, VIEWPORT_WIDTH - padding - 12, padding, 24, 24)
    } else {
      // Procedural coin
      ctx.fillStyle = COLORS.coin
      ctx.beginPath()
      ctx.arc(VIEWPORT_WIDTH - padding, padding + 12, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#d69e2e'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'right'
    ctx.fillText(`${displayCoins}`, VIEWPORT_WIDTH - padding - 20, padding)
    
    // Show current level coins if any collected (only during active play)
    if (game.coinsThisAttempt > 0 && !game.levelComplete) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#48bb78'
      ctx.fillText(`+${game.coinsThisAttempt} this level`, VIEWPORT_WIDTH - padding, padding + 32)
    }

    // Replay multiplier if applicable
    if (game.replayMultiplier < 1) {
      ctx.font = '12px Arial'
      ctx.fillStyle = '#888'
      ctx.fillText(`(${Math.round(game.replayMultiplier * 100)}% rate)`, VIEWPORT_WIDTH - padding, padding + 48)
    }
  }
}
