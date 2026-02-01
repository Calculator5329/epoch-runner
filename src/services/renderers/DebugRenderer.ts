import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import { getTileType, TileTypeId } from '../../core/types/shapes'
import type { PlayerStore } from '../../stores/PlayerStore'
import type { LevelStore } from '../../stores/LevelStore'
import type { GameStore } from '../../stores/GameStore'
import type { CameraStore } from '../../stores/CameraStore'

/**
 * DebugRenderer - Renders debug overlays for development
 * 
 * Handles grid overlay, collision shape outlines, and debug info panel.
 * Only renders when respective debug flags are enabled in GameStore.
 */
export class DebugRenderer {
  /**
   * Draw all enabled debug overlays
   */
  draw(
    ctx: CanvasRenderingContext2D,
    levelStore: LevelStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    cameraStore: CameraStore
  ): void {
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
  }

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
        } else {
          // Solid and decoration categories
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
