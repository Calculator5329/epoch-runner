import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import { getTileType, TileTypeId, TILE_COLORS } from '../../core/types/shapes'
import type { EditorStore, EditorEntitySpawn } from '../../stores/EditorStore'
import type { AssetStore } from '../../stores/AssetStore'
import { getEntityDefinition, ENTITY_DEFINITIONS } from '../../core/types/entities'
import { calculateVisibleTileRange, drawTileShape } from './DrawingUtils'

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
  entitySelected: '#f6ad55',
  entityHover: '#fbd38d',
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
    editorStore: EditorStore,
    assetStore?: AssetStore
  ): void {
    // Clear canvas with editor background
    ctx.fillStyle = EDITOR_COLORS.background
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT)

    // Draw custom background if available
    if (assetStore?.background) {
      this.drawBackground(ctx, editorStore, assetStore.background)
    }

    // Draw tiles
    this.drawTiles(ctx, editorStore, assetStore)

    // Draw grid lines
    this.drawGridLines(ctx, editorStore)

    // Draw player spawn marker
    this.drawSpawnMarker(ctx, editorStore)

    // Draw entity spawns
    this.drawEntitySpawns(ctx, editorStore, assetStore)

    // Draw hover highlight and cursor preview
    if (editorStore.hoveredTile) {
      this.drawHoverHighlight(ctx, editorStore)
      this.drawCursorPreview(ctx, editorStore, assetStore)
    }

    // Draw toolbar/info bar
    this.drawInfoBar(ctx, editorStore)
  }

  /**
   * Draw custom background with parallax effect
   */
  private drawBackground(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore,
    background: HTMLImageElement
  ): void {
    const parallaxFactor = 0.5
    const offsetX = -editor.cameraX * parallaxFactor
    const offsetY = -editor.cameraY * parallaxFactor

    // Tile the background if smaller than viewport
    const imgWidth = background.width
    const imgHeight = background.height

    // Calculate starting position with proper wrapping
    const startX = Math.floor(offsetX / imgWidth) * imgWidth
    const startY = Math.floor(offsetY / imgHeight) * imgHeight

    // Draw tiled background
    for (let y = startY; y < VIEWPORT_HEIGHT - offsetY + imgHeight; y += imgHeight) {
      for (let x = startX; x < VIEWPORT_WIDTH - offsetX + imgWidth; x += imgWidth) {
        ctx.drawImage(
          background,
          x + (offsetX % imgWidth),
          y + (offsetY % imgHeight)
        )
      }
    }
  }

  /**
   * Draw all tiles in the level
   */
  private drawTiles(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore,
    assetStore?: AssetStore
  ): void {
    // Calculate visible tile range using shared utility
    const { startCol, endCol, startRow, endRow } = calculateVisibleTileRange(
      editor.cameraX, editor.cameraY, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, editor.gridWidth, editor.gridHeight
    )

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

        // Draw empty tile background (only if no custom background)
        if (!assetStore?.background) {
          ctx.fillStyle = TILE_COLORS.empty
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE)
        }

        // Draw tile shape if not empty
        if (tileId !== TileTypeId.EMPTY) {
          // Check for custom sprite first
          const customSprite = assetStore?.getTileSprite(tileId as TileTypeId)
          if (customSprite) {
            this.drawTileSprite(ctx, customSprite, screenX, screenY)
          } else {
            // Fall back to procedural rendering
            drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
          }
        }
      }
    }
  }

  /**
   * Draw a custom tile sprite
   */
  private drawTileSprite(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLImageElement,
    screenX: number,
    screenY: number
  ): void {
    ctx.drawImage(sprite, screenX, screenY, TILE_SIZE, TILE_SIZE)
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

    // Calculate visible range using shared utility (buffer=0 for grid lines)
    const { startCol, endCol, startRow, endRow } = calculateVisibleTileRange(
      editor.cameraX, editor.cameraY, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 
      editor.gridWidth + 10, editor.gridHeight + 10, 0  // Allow extra for grid lines beyond level bounds
    )

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
   * Draw entity spawns on the level
   */
  private drawEntitySpawns(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore,
    assetStore?: AssetStore
  ): void {
    for (const entitySpawn of editor.entitySpawns) {
      this.drawEntityMarker(ctx, editor, entitySpawn, assetStore)
    }
  }

  /**
   * Draw a single entity marker
   */
  private drawEntityMarker(
    ctx: CanvasRenderingContext2D,
    editor: EditorStore,
    entitySpawn: EditorEntitySpawn,
    assetStore?: AssetStore
  ): void {
    const { col, row } = entitySpawn.position
    const definition = getEntityDefinition(entitySpawn.definitionId)
    if (!definition) return

    const screenX = Math.round(col * TILE_SIZE - editor.cameraX)
    const screenY = Math.round(row * TILE_SIZE - editor.cameraY)
    const isSelected = editor.selectedEntityId === entitySpawn.editorId

    // Check for custom sprite
    const customSprite = assetStore?.getEntitySprite(entitySpawn.definitionId)

    // Draw entity background
    if (customSprite) {
      ctx.drawImage(customSprite, screenX, screenY, TILE_SIZE, TILE_SIZE)
    } else {
      // Procedural rendering - colored rectangle with simple face
      ctx.fillStyle = definition.color
      ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8)
      
      // Draw simple "eyes" to indicate direction
      ctx.fillStyle = '#ffffff'
      const eyeY = screenY + TILE_SIZE / 2 - 4
      const eyeSize = 6
      const direction = entitySpawn.properties?.startDirection || 'right'
      
      if (direction === 'right') {
        ctx.fillRect(screenX + TILE_SIZE - 18, eyeY, eyeSize, eyeSize)
        ctx.fillRect(screenX + TILE_SIZE - 28, eyeY, eyeSize, eyeSize)
      } else {
        ctx.fillRect(screenX + 12, eyeY, eyeSize, eyeSize)
        ctx.fillRect(screenX + 22, eyeY, eyeSize, eyeSize)
      }
    }

    // Draw selection highlight
    if (isSelected) {
      ctx.strokeStyle = EDITOR_COLORS.entitySelected
      ctx.lineWidth = 3
      ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      
      // Draw corner handles
      const handleSize = 6
      ctx.fillStyle = EDITOR_COLORS.entitySelected
      // Top-left
      ctx.fillRect(screenX - 2, screenY - 2, handleSize, handleSize)
      // Top-right
      ctx.fillRect(screenX + TILE_SIZE - 4, screenY - 2, handleSize, handleSize)
      // Bottom-left
      ctx.fillRect(screenX - 2, screenY + TILE_SIZE - 4, handleSize, handleSize)
      // Bottom-right
      ctx.fillRect(screenX + TILE_SIZE - 4, screenY + TILE_SIZE - 4, handleSize, handleSize)
    }

    // Draw entity type label
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(
      definition.type === 'enemy_patrol' ? 'P' : 'S',
      screenX + TILE_SIZE / 2,
      screenY + TILE_SIZE - 2
    )
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
    editor: EditorStore,
    assetStore?: AssetStore
  ): void {
    if (!editor.hoveredTile) return
    if (editor.tool === 'eyedropper') return

    const { col, row } = editor.hoveredTile
    const screenX = Math.round(col * TILE_SIZE - editor.cameraX)
    const screenY = Math.round(row * TILE_SIZE - editor.cameraY)

    // Handle entity tool preview
    if (editor.tool === 'entity') {
      // Check if there's already an entity at this position
      const existingEntity = editor.getEntityAt(col, row)
      if (existingEntity) {
        // Show hover highlight on existing entity
        ctx.strokeStyle = EDITOR_COLORS.entityHover
        ctx.lineWidth = 2
        ctx.strokeRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4)
      } else if (editor.selectedEntityType) {
        // Show preview of entity to be placed
        const definition = getEntityDefinition(editor.selectedEntityType)
        if (definition) {
          ctx.globalAlpha = 0.5
          
          const customSprite = assetStore?.getEntitySprite(definition.id)
          if (customSprite) {
            ctx.drawImage(customSprite, screenX, screenY, TILE_SIZE, TILE_SIZE)
          } else {
            ctx.fillStyle = definition.color
            ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8)
          }
          
          ctx.globalAlpha = 1
        }
      }
      return
    }

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
    ctx.globalAlpha = 0.5
    
    // Check for custom sprite first
    const customSprite = assetStore?.getTileSprite(previewTileId)
    if (customSprite) {
      this.drawTileSprite(ctx, customSprite, screenX, screenY)
    } else {
      // Fall back to procedural rendering
      const tileType = getTileType(previewTileId)
      drawTileShape(ctx, tileType.collision, tileType.color, screenX, screenY)
    }
    
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
      entity: 'Entity',
    }
    ctx.textAlign = 'center'
    ctx.fillText(
      `Tool: ${toolNames[editor.tool] || editor.tool}`,
      VIEWPORT_WIDTH / 2 - 100,
      barHeight / 2
    )

    // Selected tile or entity
    if (editor.tool === 'entity' && editor.selectedEntityType) {
      const entityDef = ENTITY_DEFINITIONS[editor.selectedEntityType]
      ctx.fillText(
        `Entity: ${entityDef?.displayName || editor.selectedEntityType}`,
        VIEWPORT_WIDTH / 2 + 100,
        barHeight / 2
      )
    } else {
      const selectedTile = getTileType(editor.selectedTileType)
      ctx.fillText(
        `Tile: ${selectedTile.name}`,
        VIEWPORT_WIDTH / 2 + 100,
        barHeight / 2
      )
    }

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
