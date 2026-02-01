import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import { getTileType, TileTypeId, TILE_COLORS } from '../../core/types/shapes'
import type { CollisionShape, NormalizedPoint } from '../../core/types/shapes'
import type { EditorStore } from '../../stores/EditorStore'

/**
 * Editor colors
 */
const EDITOR_COLORS = {
  background: '#1a1a2e',
  gridLine: 'rgba(255, 255, 255, 0.1)',
  gridLineStrong: 'rgba(255, 255, 255, 0.25)',
  hover: 'rgba(255, 255, 255, 0.3)',
  cursorPreview: 'rgba(255, 255, 255, 0.5)',
  spawnMarker: '#00ff88',
  spawnMarkerBorder: '#00cc66',
} as const

/**
 * EditorRenderer - Renders level editor view
 * 
 * Handles rendering of grid, tiles, cursor preview, and spawn marker.
 * All world objects are offset by editor camera position.
 */
export class EditorRenderer {
  /**
   * Draw the editor view
   */
  draw(
    ctx: CanvasRenderingContext2D,
    editorStore: EditorStore
  ): void {
    // Clear canvas with editor background
    ctx.fillStyle = EDITOR_COLORS.background
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Draw tiles
    this.drawTiles(ctx, editorStore)

    // Draw grid lines
    this.drawGridLines(ctx, editorStore)

    // Draw player spawn marker
    this.drawSpawnMarker(ctx, editorStore)

    // Draw hover highlight and cursor preview
    if (editorStore.hoveredTile) {
      this.drawHoverHighlight(ctx, editorStore)
      this.drawCursorPreview(ctx, editorStore)
    }

    // Draw toolbar/info bar
    this.drawInfoBar(ctx, editorStore)
  }

  /**
   * Draw all tiles in the level
   */
  private drawTiles(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    // Calculate visible tile range
    const startCol = Math.max(0, Math.floor(editor.cameraX / TILE_SIZE) - 1)
    const endCol = Math.min(editor.gridWidth, Math.ceil((editor.cameraX + VIEWPORT_WIDTH) / TILE_SIZE) + 1)
    const startRow = Math.max(0, Math.floor(editor.cameraY / TILE_SIZE) - 1)
    const endRow = Math.min(editor.gridHeight, Math.ceil((editor.cameraY + VIEWPORT_HEIGHT) / TILE_SIZE) + 1)

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileId = editor.collision[row]?.[col] ?? TileTypeId.EMPTY
        const tileType = getTileType(tileId)
        
        // World position
        const worldX = col * TILE_SIZE
        const worldY = row * TILE_SIZE
        
        // Screen position
        const screenX = Math.round(worldX - editor.cameraX)
        const screenY = Math.round(worldY - editor.cameraY)

        // Draw empty tile background
        ctx.fillStyle = TILE_COLORS.empty
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
   * Draw grid lines
   */
  private drawGridLines(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    ctx.strokeStyle = EDITOR_COLORS.gridLine
    ctx.lineWidth = 1

    // Calculate visible range
    const startCol = Math.floor(editor.cameraX / TILE_SIZE)
    const endCol = Math.ceil((editor.cameraX + VIEWPORT_WIDTH) / TILE_SIZE)
    const startRow = Math.floor(editor.cameraY / TILE_SIZE)
    const endRow = Math.ceil((editor.cameraY + VIEWPORT_HEIGHT) / TILE_SIZE)

    // Vertical lines
    for (let col = startCol; col <= endCol; col++) {
      const screenX = Math.round(col * TILE_SIZE - editor.cameraX) + 0.5
      
      // Stronger line every 5 tiles
      ctx.strokeStyle = col % 5 === 0 ? EDITOR_COLORS.gridLineStrong : EDITOR_COLORS.gridLine
      
      ctx.beginPath()
      ctx.moveTo(screenX, 0)
      ctx.lineTo(screenX, VIEWPORT_HEIGHT)
      ctx.stroke()
    }

    // Horizontal lines
    for (let row = startRow; row <= endRow; row++) {
      const screenY = Math.round(row * TILE_SIZE - editor.cameraY) + 0.5
      
      // Stronger line every 5 tiles
      ctx.strokeStyle = row % 5 === 0 ? EDITOR_COLORS.gridLineStrong : EDITOR_COLORS.gridLine
      
      ctx.beginPath()
      ctx.moveTo(0, screenY)
      ctx.lineTo(VIEWPORT_WIDTH, screenY)
      ctx.stroke()
    }

    // Draw level bounds
    ctx.strokeStyle = '#ff4444'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    const boundsX = Math.round(-editor.cameraX)
    const boundsY = Math.round(-editor.cameraY)
    const boundsW = editor.gridWidth * TILE_SIZE
    const boundsH = editor.gridHeight * TILE_SIZE
    
    ctx.strokeRect(boundsX, boundsY, boundsW, boundsH)
    ctx.setLineDash([])
  }

  /**
   * Draw player spawn marker
   */
  private drawSpawnMarker(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    const { col, row } = editor.playerSpawn
    const screenX = Math.round(col * TILE_SIZE - editor.cameraX)
    const screenY = Math.round(row * TILE_SIZE - editor.cameraY)

    // Draw spawn marker background
    ctx.fillStyle = EDITOR_COLORS.spawnMarker
    ctx.globalAlpha = 0.5
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
    ctx.globalAlpha = 1

    // Draw spawn marker border
    ctx.strokeStyle = EDITOR_COLORS.spawnMarkerBorder
    ctx.lineWidth = 3
    ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4)

    // Draw "P" text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('P', screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2)
  }

  /**
   * Draw hover highlight
   */
  private drawHoverHighlight(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    if (!editor.hoveredTile) return

    const { col, row } = editor.hoveredTile
    const screenX = Math.round(col * TILE_SIZE - editor.cameraX)
    const screenY = Math.round(row * TILE_SIZE - editor.cameraY)

    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2)
  }

  /**
   * Draw cursor preview (shows what tile will be placed)
   */
  private drawCursorPreview(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    if (!editor.hoveredTile) return
    if (editor.tool === 'eyedropper') return

    const { col, row } = editor.hoveredTile
    const screenX = Math.round(col * TILE_SIZE - editor.cameraX)
    const screenY = Math.round(row * TILE_SIZE - editor.cameraY)

    // Determine what tile would be placed
    let previewTileId: TileTypeId
    if (editor.tool === 'erase') {
      previewTileId = TileTypeId.EMPTY
    } else if (editor.tool === 'spawn') {
      // Show spawn marker preview
      ctx.fillStyle = EDITOR_COLORS.spawnMarker
      ctx.globalAlpha = 0.3
      ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
      ctx.globalAlpha = 1
      return
    } else {
      previewTileId = editor.selectedTileType
    }

    // Draw semi-transparent preview
    const tileType = getTileType(previewTileId)
    ctx.globalAlpha = 0.5
    this.drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
    ctx.globalAlpha = 1
  }

  /**
   * Draw info bar at top of screen
   */
  private drawInfoBar(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore
  ): void {
    const barHeight = 40
    
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, barHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    // Level info
    ctx.fillText(
      `${editor.levelName} (${editor.gridWidth}×${editor.gridHeight})`,
      10,
      barHeight / 2
    )

    // Current tool
    const toolNames: Record<string, string> = {
      paint: 'Paint',
      erase: 'Erase',
      fill: 'Fill',
      eyedropper: 'Eyedropper',
      spawn: 'Set Spawn',
    }
    ctx.textAlign = 'center'
    ctx.fillText(
      `Tool: ${toolNames[editor.tool] || editor.tool}`,
      VIEWPORT_WIDTH / 2 - 100,
      barHeight / 2
    )

    // Selected tile
    const selectedTile = getTileType(editor.selectedTileType)
    ctx.fillText(
      `Tile: ${selectedTile.name}`,
      VIEWPORT_WIDTH / 2 + 100,
      barHeight / 2
    )

    // Cursor position
    ctx.textAlign = 'right'
    if (editor.hoveredTile) {
      ctx.fillText(
        `(${editor.hoveredTile.col}, ${editor.hoveredTile.row})`,
        VIEWPORT_WIDTH - 10,
        barHeight / 2
      )
    }

    // Undo/Redo status
    ctx.textAlign = 'right'
    ctx.font = '12px Arial'
    ctx.fillStyle = editor.canUndo ? '#88ff88' : '#666666'
    ctx.fillText('Ctrl+Z Undo', VIEWPORT_WIDTH - 150, barHeight / 2)
    ctx.fillStyle = editor.canRedo ? '#88ff88' : '#666666'
    ctx.fillText('Ctrl+Y Redo', VIEWPORT_WIDTH - 80, barHeight / 2 + 14)
  }
}

// Singleton instance
export const editorRenderer = new EditorRenderer()
