import { 
  TILE_SIZE, 
  COLORS, 
  VIEWPORT_WIDTH, 
  VIEWPORT_HEIGHT, 
  TRIPLE_JUMP_DURATION,
  SPEED_BOOST_DURATION,
  SUPER_JUMP_DURATION,
  INVINCIBILITY_DURATION,
} from '../../core/constants'
import { TILE_COLORS } from '../../core/types/shapes'
import { getTileType, TileTypeId } from '../../core/types/shapes'
import type { PlayerStore } from '../../stores/PlayerStore'
import type { LevelStore } from '../../stores/LevelStore'
import type { GameStore } from '../../stores/GameStore'
import type { CameraStore } from '../../stores/CameraStore'
import type { AssetStore } from '../../stores/AssetStore'
import type { EntityStore } from '../../stores/EntityStore'
import type { Entity } from '../../core/types/entities'
import { getEntityDefinition } from '../../core/types/entities'
import { calculateVisibleTileRange, drawTileShape } from './DrawingUtils'

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
    assetStore?: AssetStore,
    entityStore?: EntityStore
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

    // Draw entities (enemies, etc.)
    if (entityStore) {
      this.drawEntities(ctx, entityStore, cameraStore)
    }

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
    const { startCol, endCol, startRow, endRow } = calculateVisibleTileRange(
      camera.x, camera.y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, level.width, level.height
    )

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
            // Fall back to procedural rendering using shared utility
            drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
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

  // ============================================
  // Entity Rendering
  // ============================================

  /**
   * Draw all active entities
   */
  private drawEntities(
    ctx: CanvasRenderingContext2D,
    entityStore: EntityStore,
    camera: CameraStore
  ): void {
    const entities = entityStore.getActive()
    
    for (const entity of entities) {
      this.drawEntity(ctx, entity, camera)
    }
  }

  /**
   * Draw a single entity
   */
  private drawEntity(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    camera: CameraStore
  ): void {
    // Convert world position to screen position
    const screenX = Math.round(entity.x - camera.x)
    const screenY = Math.round(entity.y - camera.y)

    // Skip if off-screen
    if (
      screenX + entity.width < 0 ||
      screenX > VIEWPORT_WIDTH ||
      screenY + entity.height < 0 ||
      screenY > VIEWPORT_HEIGHT
    ) {
      return
    }

    // Get entity definition for color
    const definition = getEntityDefinition(entity.definitionId)
    const color = definition?.color || '#e53e3e'

    // Draw entity as colored rectangle (MVP rendering)
    ctx.fillStyle = color
    ctx.fillRect(screenX, screenY, entity.width, entity.height)

    // Draw eyes to indicate direction
    this.drawEntityFace(ctx, entity, screenX, screenY)
  }

  /**
   * Draw enemy face (eyes) to show direction
   */
  private drawEntityFace(
    ctx: CanvasRenderingContext2D,
    entity: Entity,
    screenX: number,
    screenY: number
  ): void {
    const eyeRadius = 4
    const eyeOffsetY = entity.height * 0.3
    const eyeSpacing = entity.width * 0.25

    // Eye positions based on facing direction
    const centerX = screenX + entity.width / 2
    const eyeY = screenY + eyeOffsetY

    // Shift eyes in the direction of movement
    const directionOffset = entity.direction === 'right' ? 4 : -4
    
    // Draw eye whites
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(centerX - eyeSpacing + directionOffset, eyeY, eyeRadius, 0, Math.PI * 2)
    ctx.arc(centerX + eyeSpacing + directionOffset, eyeY, eyeRadius, 0, Math.PI * 2)
    ctx.fill()

    // Draw pupils (offset in direction of movement)
    const pupilOffset = entity.direction === 'right' ? 1.5 : -1.5
    ctx.fillStyle = '#000000'
    ctx.beginPath()
    ctx.arc(centerX - eyeSpacing + directionOffset + pupilOffset, eyeY, eyeRadius * 0.5, 0, Math.PI * 2)
    ctx.arc(centerX + eyeSpacing + directionOffset + pupilOffset, eyeY, eyeRadius * 0.5, 0, Math.PI * 2)
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
    const hasCustomSprites = playerSprites && (
      playerSprites.idle || playerSprites.run || playerSprites.run1 || playerSprites.jump
    )

    if (hasCustomSprites && !player.isDead) {
      // Determine which sprite to use based on player state
      let sprite: HTMLImageElement | undefined

      if (!player.isGrounded && player.vy !== 0) {
        // In air - use jump sprite if available
        sprite = playerSprites.jump || playerSprites.idle
      } else if (player.vx !== 0) {
        // Moving - use run sprite(s) if available
        // Support animated run: run1/run2 alternate, or fall back to single run sprite
        if (playerSprites.run1 && playerSprites.run2) {
          // Use animation frame to select between run1 and run2
          sprite = player.runAnimationFrame === 0 ? playerSprites.run1 : playerSprites.run2
        } else {
          // Fall back to single run sprite or idle
          sprite = playerSprites.run || playerSprites.idle
        }
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

    // Draw power-up indicators (stacked above player)
    this.drawPowerUpIndicators(ctx, player, screenX, screenY)
  }

  /**
   * Draw power-up indicators above the player
   */
  private drawPowerUpIndicators(
    ctx: CanvasRenderingContext2D,
    player: PlayerStore,
    screenX: number,
    screenY: number
  ): void {
    let indicatorOffset = 0
    const indicatorSpacing = 18
    const timerWidth = 30
    const timerHeight = 4
    const centerX = screenX + player.width / 2

    // Triple jump indicator
    if (player.hasTripleJump) {
      const indicatorY = screenY - 10 - indicatorOffset
      ctx.fillStyle = COLORS.powerup
      ctx.beginPath()
      ctx.arc(centerX, indicatorY, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Timer bar
      const timerX = centerX - timerWidth / 2
      const timerY = indicatorY - 10
      const fillRatio = player.tripleJumpTimer / TRIPLE_JUMP_DURATION
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = COLORS.powerup
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
      
      indicatorOffset += indicatorSpacing
    }

    // Speed boost indicator (orange)
    if (player.hasSpeedBoost) {
      const indicatorY = screenY - 10 - indicatorOffset
      ctx.fillStyle = TILE_COLORS.speedBoost
      ctx.beginPath()
      ctx.arc(centerX, indicatorY, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Speed lines decoration
      ctx.strokeStyle = TILE_COLORS.speedBoost
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX - 10, indicatorY)
      ctx.lineTo(centerX - 14, indicatorY)
      ctx.moveTo(centerX + 10, indicatorY)
      ctx.lineTo(centerX + 14, indicatorY)
      ctx.stroke()
      
      // Timer bar
      const timerX = centerX - timerWidth / 2
      const timerY = indicatorY - 10
      const fillRatio = player.speedBoostTimer / SPEED_BOOST_DURATION
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = TILE_COLORS.speedBoost
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
      
      indicatorOffset += indicatorSpacing
    }

    // Super jump indicator (purple)
    if (player.hasSuperJump) {
      const indicatorY = screenY - 10 - indicatorOffset
      ctx.fillStyle = TILE_COLORS.superJump
      ctx.beginPath()
      ctx.arc(centerX, indicatorY, 6, 0, Math.PI * 2)
      ctx.fill()
      
      // Up arrow decoration
      ctx.strokeStyle = TILE_COLORS.superJump
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, indicatorY - 10)
      ctx.lineTo(centerX, indicatorY - 4)
      ctx.moveTo(centerX - 3, indicatorY - 7)
      ctx.lineTo(centerX, indicatorY - 10)
      ctx.lineTo(centerX + 3, indicatorY - 7)
      ctx.stroke()
      
      // Timer bar
      const timerX = centerX - timerWidth / 2
      const timerY = indicatorY - 16
      const fillRatio = player.superJumpTimer / SUPER_JUMP_DURATION
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = TILE_COLORS.superJump
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
      
      indicatorOffset += indicatorSpacing
    }

    // Invincibility indicator (gold, pulsing)
    if (player.hasInvincibility) {
      const indicatorY = screenY - 10 - indicatorOffset
      const pulseScale = 1 + Math.sin(Date.now() / 100) * 0.2
      
      // Glowing effect
      ctx.fillStyle = TILE_COLORS.invincibility
      ctx.shadowColor = TILE_COLORS.invincibility
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(centerX, indicatorY, 6 * pulseScale, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      // Timer bar
      const timerX = centerX - timerWidth / 2
      const timerY = indicatorY - 10
      const fillRatio = player.invincibilityTimer / INVINCIBILITY_DURATION
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(timerX, timerY, timerWidth, timerHeight)
      ctx.fillStyle = TILE_COLORS.invincibility
      ctx.fillRect(timerX, timerY, timerWidth * fillRatio, timerHeight)
      
      // Also draw gold outline around player when invincible
      ctx.strokeStyle = TILE_COLORS.invincibility
      ctx.lineWidth = 3
      ctx.shadowColor = TILE_COLORS.invincibility
      ctx.shadowBlur = 5
      ctx.strokeRect(screenX - 2, screenY - 2, player.width + 4, player.height + 4)
      ctx.shadowBlur = 0
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
