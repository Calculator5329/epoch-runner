import { useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useRootStore, useEditorStore } from '../../stores/RootStore'
import { editorRenderer } from '../../services/renderers'
import { TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import { TileTypeId } from '../../core/types'
import { levelToJSON } from '../../levels/types'
import { TilePalette } from './TilePalette'
import type { LevelJSON } from '../../levels/types'

/**
 * EditorCanvas - Main level editor component
 * 
 * Provides canvas for editing levels with mouse painting,
 * keyboard shortcuts, and tool selection.
 */
export const EditorCanvas = observer(function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rootStore = useRootStore()
  const editorStore = useEditorStore()
  
  // Track mouse button state
  const isMouseDownRef = useRef(false)
  const lastPaintedTileRef = useRef<{ col: number; row: number } | null>(null)

  // Animation frame for continuous rendering
  const rafIdRef = useRef<number | null>(null)

  /**
   * Convert screen coordinates to grid coordinates
   */
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const col = Math.floor((screenX + editorStore.cameraX) / TILE_SIZE)
    const row = Math.floor((screenY + editorStore.cameraY) / TILE_SIZE)
    return { col, row }
  }, [editorStore.cameraX, editorStore.cameraY])

  /**
   * Apply the current tool at the given grid position
   */
  const applyTool = useCallback((col: number, row: number, isDrag: boolean) => {
    if (!editorStore.isValidPosition(col, row)) return

    switch (editorStore.tool) {
      case 'paint':
        if (isDrag) {
          editorStore.setTileDrag(col, row, editorStore.selectedTileType)
        } else {
          editorStore.setTile(col, row, editorStore.selectedTileType)
        }
        break
      case 'erase':
        if (isDrag) {
          editorStore.setTileDrag(col, row, TileTypeId.EMPTY)
        } else {
          editorStore.setTile(col, row, TileTypeId.EMPTY)
        }
        break
      case 'fill':
        if (!isDrag) {
          editorStore.fill(col, row, editorStore.selectedTileType)
        }
        break
      case 'eyedropper':
        if (!isDrag) {
          const tileId = editorStore.getTileAt(col, row)
          if (tileId !== TileTypeId.EMPTY) {
            editorStore.setSelectedTileType(tileId as TileTypeId)
          }
          // Switch back to paint after picking
          editorStore.setTool('paint')
        }
        break
      case 'spawn':
        if (!isDrag) {
          editorStore.setPlayerSpawn(col, row)
        }
        break
    }
  }, [editorStore])

  /**
   * Handle mouse down on canvas
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY

    // Ignore clicks on info bar
    if (screenY < 40) return

    isMouseDownRef.current = true
    const { col, row } = screenToGrid(screenX, screenY)
    
    // Start drag for paint/erase
    if (editorStore.tool === 'paint' || editorStore.tool === 'erase') {
      editorStore.startDrag()
    }
    
    applyTool(col, row, false)
    lastPaintedTileRef.current = { col, row }
  }, [screenToGrid, applyTool, editorStore])

  /**
   * Handle mouse move on canvas
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY

    const { col, row } = screenToGrid(screenX, screenY)

    // Update hovered tile
    if (editorStore.isValidPosition(col, row) && screenY >= 40) {
      editorStore.setHoveredTile(col, row)
    } else {
      editorStore.setHoveredTile(null, null)
    }

    // Handle dragging
    if (isMouseDownRef.current && (editorStore.tool === 'paint' || editorStore.tool === 'erase')) {
      const last = lastPaintedTileRef.current
      if (!last || last.col !== col || last.row !== row) {
        applyTool(col, row, true)
        lastPaintedTileRef.current = { col, row }
      }
    }
  }, [screenToGrid, applyTool, editorStore])

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(() => {
    if (isMouseDownRef.current && editorStore.isDragging) {
      editorStore.endDrag()
    }
    isMouseDownRef.current = false
    lastPaintedTileRef.current = null
  }, [editorStore])

  /**
   * Handle mouse leave
   */
  const handleMouseLeave = useCallback(() => {
    editorStore.setHoveredTile(null, null)
    handleMouseUp()
  }, [editorStore, handleMouseUp])

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exit editor mode
      if (e.code === 'KeyE' || e.code === 'Escape') {
        editorStore.setMode('game')
        return
      }

      // Tool shortcuts
      if (e.code === 'KeyP') {
        e.preventDefault()
        editorStore.setTool('paint')
      }
      if (e.code === 'KeyX') {
        e.preventDefault()
        editorStore.setTool('erase')
      }
      if (e.code === 'KeyF') {
        e.preventDefault()
        editorStore.setTool('fill')
      }
      if (e.code === 'KeyI') {
        e.preventDefault()
        editorStore.setTool('eyedropper')
      }
      if (e.code === 'KeyS' && !e.ctrlKey) {
        e.preventDefault()
        editorStore.setTool('spawn')
      }

      // Undo/Redo
      if (e.ctrlKey && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        editorStore.undo()
      }
      if (e.ctrlKey && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
        e.preventDefault()
        editorStore.redo()
      }

      // Export level (Ctrl+S)
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault()
        exportLevel()
      }

      // Import level (Ctrl+O)
      if (e.ctrlKey && e.code === 'KeyO') {
        e.preventDefault()
        fileInputRef.current?.click()
      }

      // New level (Ctrl+N)
      if (e.ctrlKey && e.code === 'KeyN') {
        e.preventDefault()
        const width = parseInt(prompt('Level width (tiles):', '30') || '30')
        const height = parseInt(prompt('Level height (tiles):', '15') || '15')
        if (width > 0 && height > 0) {
          editorStore.initNewLevel(width, height)
        }
      }

      // Test level (T key)
      if (e.code === 'KeyT') {
        e.preventDefault()
        testLevel()
      }

      // Number keys for quick tile selection
      const num = parseInt(e.key)
      if (!isNaN(num) && num >= 1 && num <= 9) {
        const quickTiles: TileTypeId[] = [
          TileTypeId.SOLID_FULL,      // 1
          TileTypeId.PLATFORM_FULL,   // 2
          TileTypeId.HAZARD_SPIKE_UP, // 3
          TileTypeId.COIN,            // 4
          TileTypeId.GOAL,            // 5
          TileTypeId.CHECKPOINT,      // 6
          TileTypeId.SOLID_HALF_TOP,  // 7
          TileTypeId.SOLID_HALF_BOTTOM, // 8
          TileTypeId.HAZARD_FULL,     // 9
        ]
        if (quickTiles[num - 1]) {
          editorStore.setSelectedTileType(quickTiles[num - 1])
        }
      }

      // Camera panning with arrow keys
      const panSpeed = 64
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        editorStore.panCamera(-panSpeed, 0)
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        editorStore.panCamera(panSpeed, 0)
      }
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        editorStore.panCamera(0, -panSpeed)
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        editorStore.panCamera(0, panSpeed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editorStore])

  /**
   * Export level as JSON
   */
  const exportLevel = useCallback(() => {
    const level = editorStore.toLevelDefinition()
    const json = levelToJSON(level)
    
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${level.id}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }, [editorStore])

  /**
   * Test the current level in game mode
   */
  const testLevel = useCallback(() => {
    const level = editorStore.toLevelDefinition()
    rootStore.loadLevelDefinition(level)
    editorStore.setMode('game')
  }, [editorStore, rootStore])

  /**
   * Handle file import
   */
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as LevelJSON
        editorStore.loadLevel({
          id: json.id,
          name: json.name,
          width: json.width,
          height: json.height,
          playerSpawn: json.playerSpawn,
          collision: json.collision,
          description: json.description,
          author: json.author,
          startingLives: json.startingLives,
          parTime: json.parTime,
          themeId: json.themeId,
        })
      } catch (error) {
        console.error('Failed to parse JSON:', error)
        alert('Failed to parse level file')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    e.target.value = ''
  }, [editorStore])

  /**
   * Render loop
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    editorRenderer.draw(ctx, editorStore)

    rafIdRef.current = requestAnimationFrame(render)
  }, [editorStore])

  /**
   * Initialize canvas and start render loop
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = VIEWPORT_WIDTH
    canvas.height = VIEWPORT_HEIGHT

    rafIdRef.current = requestAnimationFrame(render)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [render])

  // Handle global mouseup
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  return (
    <div className="editor-container">
      <div className="editor-main">
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <TilePalette />
      <div className="editor-controls">
        <p>
          <strong>Tools:</strong> P=Paint, X=Erase, F=Fill, I=Eyedropper, S=Spawn
        </p>
        <p>
          <strong>Edit:</strong> Ctrl+Z=Undo, Ctrl+Y=Redo | <strong>File:</strong> Ctrl+S=Save, Ctrl+O=Open, Ctrl+N=New
        </p>
        <p>
          <strong>Navigate:</strong> Arrow keys | <strong>Test:</strong> T | <strong>Exit:</strong> E or Esc
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  )
})
