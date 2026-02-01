import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useEditorStore, useAssetStore } from '../../stores/RootStore'
import { TileTypeId, TILE_TYPES, getTileType } from '../../core/types/shapes'
import type { EditorTool } from '../../stores/EditorStore'

/**
 * Tile categories for organization
 */
interface TileCategory {
  name: string
  tiles: TileTypeId[]
}

/**
 * Organized tile categories
 */
const TILE_CATEGORIES: TileCategory[] = [
  {
    name: 'Solid',
    tiles: [
      TileTypeId.SOLID_FULL,
      TileTypeId.SOLID_HALF_LEFT,
      TileTypeId.SOLID_HALF_RIGHT,
      TileTypeId.SOLID_HALF_TOP,
      TileTypeId.SOLID_HALF_BOTTOM,
      TileTypeId.SOLID_QUARTER_TL,
      TileTypeId.SOLID_QUARTER_TR,
      TileTypeId.SOLID_QUARTER_BL,
      TileTypeId.SOLID_QUARTER_BR,
      TileTypeId.SOLID_SLOPE_UP_RIGHT,
      TileTypeId.SOLID_SLOPE_UP_LEFT,
    ],
  },
  {
    name: 'Materials',
    tiles: [
      TileTypeId.SOLID_BRICK,
      TileTypeId.SOLID_STONE,
      TileTypeId.SOLID_METAL,
      TileTypeId.SOLID_WOOD,
      TileTypeId.SOLID_ICE,
      TileTypeId.SOLID_GRASS,
      TileTypeId.SOLID_SAND,
      TileTypeId.SOLID_DIRT,
      TileTypeId.SOLID_CRYSTAL,
      TileTypeId.SOLID_LAVA_ROCK,
    ],
  },
  {
    name: 'Platform',
    tiles: [
      TileTypeId.PLATFORM_FULL,
      TileTypeId.PLATFORM_HALF_LEFT,
      TileTypeId.PLATFORM_HALF_RIGHT,
    ],
  },
  {
    name: 'Hazard',
    tiles: [
      TileTypeId.HAZARD_FULL,
      TileTypeId.HAZARD_SPIKE_UP,
      TileTypeId.HAZARD_SPIKE_DOWN,
      TileTypeId.HAZARD_SPIKE_LEFT,
      TileTypeId.HAZARD_SPIKE_RIGHT,
    ],
  },
  {
    name: 'Pickup',
    tiles: [
      TileTypeId.COIN,
      TileTypeId.POWERUP_TRIPLE_JUMP,
      TileTypeId.POWERUP_SPEED,
      TileTypeId.POWERUP_SUPER_JUMP,
      TileTypeId.POWERUP_INVINCIBILITY,
    ],
  },
  {
    name: 'Trigger',
    tiles: [
      TileTypeId.GOAL,
      TileTypeId.CHECKPOINT,
    ],
  },
]

/**
 * Tool definitions
 */
interface ToolDef {
  id: EditorTool
  name: string
  shortcut: string
}

const TOOLS: ToolDef[] = [
  { id: 'paint', name: 'Paint', shortcut: 'P' },
  { id: 'erase', name: 'Erase', shortcut: 'X' },
  { id: 'fill', name: 'Fill', shortcut: 'F' },
  { id: 'eyedropper', name: 'Pick', shortcut: 'I' },
  { id: 'spawn', name: 'Spawn', shortcut: 'S' },
  { id: 'entity', name: 'Entity', shortcut: 'N' },
]

/**
 * TilePalette - Tile and tool selection panel
 * 
 * Shows available tiles organized by category and tool buttons.
 */
export const TilePalette = observer(function TilePalette() {
  const editorStore = useEditorStore()
  const assetStore = useAssetStore()
  
  // Local state for level size inputs
  const [inputWidth, setInputWidth] = useState(editorStore.gridWidth.toString())
  const [inputHeight, setInputHeight] = useState(editorStore.gridHeight.toString())

  /**
   * Handle resize button click
   */
  const handleResize = () => {
    const newWidth = parseInt(inputWidth, 10)
    const newHeight = parseInt(inputHeight, 10)
    
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 1 || newHeight < 1) {
      alert('Please enter valid dimensions (minimum 1x1)')
      return
    }
    
    if (newWidth > 500 || newHeight > 500) {
      if (!confirm(`Large level (${newWidth}x${newHeight}) may affect performance. Continue?`)) {
        return
      }
    }
    
    editorStore.resizeLevel(newWidth, newHeight)
  }

  /**
   * Handle new level button click
   */
  const handleNewLevel = () => {
    const newWidth = parseInt(inputWidth, 10)
    const newHeight = parseInt(inputHeight, 10)
    
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth < 1 || newHeight < 1) {
      alert('Please enter valid dimensions (minimum 1x1)')
      return
    }
    
    if (confirm('Create new level? Current changes will be lost.')) {
      editorStore.initNewLevel(newWidth, newHeight)
    }
  }

  /**
   * Sync input fields with store when level changes externally
   */
  const syncInputsWithStore = () => {
    setInputWidth(editorStore.gridWidth.toString())
    setInputHeight(editorStore.gridHeight.toString())
  }

  return (
    <div className="tile-palette">
      {/* Level Size Settings */}
      <div className="palette-section">
        <h3>Level Size</h3>
        <div className="level-size-info">
          Current: {editorStore.gridWidth} x {editorStore.gridHeight} tiles
        </div>
        <div className="level-size-inputs">
          <div className="size-input-group">
            <label htmlFor="level-width">W:</label>
            <input
              id="level-width"
              type="number"
              min="1"
              max="1000"
              value={inputWidth}
              onChange={(e) => setInputWidth(e.target.value)}
              onBlur={() => {
                // Reset to current value if invalid
                const val = parseInt(inputWidth, 10)
                if (isNaN(val) || val < 1) {
                  setInputWidth(editorStore.gridWidth.toString())
                }
              }}
              className="size-input"
            />
          </div>
          <span className="size-separator">x</span>
          <div className="size-input-group">
            <label htmlFor="level-height">H:</label>
            <input
              id="level-height"
              type="number"
              min="1"
              max="1000"
              value={inputHeight}
              onChange={(e) => setInputHeight(e.target.value)}
              onBlur={() => {
                // Reset to current value if invalid
                const val = parseInt(inputHeight, 10)
                if (isNaN(val) || val < 1) {
                  setInputHeight(editorStore.gridHeight.toString())
                }
              }}
              className="size-input"
            />
          </div>
        </div>
        <div className="level-size-buttons">
          <button
            className="action-button"
            onClick={handleResize}
            title="Resize current level (preserves existing tiles)"
          >
            Resize
          </button>
          <button
            className="action-button"
            onClick={handleNewLevel}
            title="Create new empty level"
          >
            New
          </button>
          <button
            className="action-button secondary"
            onClick={syncInputsWithStore}
            title="Reset inputs to current level size"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Tool Selection */}
      <div className="palette-section">
        <h3>Tools</h3>
        <div className="tool-buttons">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`tool-button ${editorStore.tool === tool.id ? 'active' : ''}`}
              onClick={() => editorStore.setTool(tool.id)}
              title={`${tool.name} (${tool.shortcut})`}
            >
              {tool.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tile Categories */}
      {TILE_CATEGORIES.map((category) => (
        <div key={category.name} className="palette-section">
          <h3>{category.name}</h3>
          <div className="tile-grid">
            {category.tiles.map((tileId) => {
              const tileType = getTileType(tileId)
              const isSelected = editorStore.selectedTileType === tileId
              const customSprite = assetStore.getTileSprite(tileId)
              
              return (
                <button
                  key={tileId}
                  className={`tile-button ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    editorStore.setSelectedTileType(tileId)
                    if (editorStore.tool !== 'paint') {
                      editorStore.setTool('paint')
                    }
                  }}
                  title={tileType.name}
                  style={{
                    backgroundColor: customSprite ? 'transparent' : tileType.color,
                    backgroundImage: customSprite ? `url(${customSprite.src})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <span className="tile-preview" />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Empty tile (special case) */}
      <div className="palette-section">
        <h3>Special</h3>
        <div className="tile-grid">
          <button
            className={`tile-button ${editorStore.selectedTileType === TileTypeId.EMPTY ? 'selected' : ''}`}
            onClick={() => {
              editorStore.setSelectedTileType(TileTypeId.EMPTY)
              editorStore.setTool('erase')
            }}
            title="Empty (Erase)"
            style={{
              backgroundColor: TILE_TYPES[TileTypeId.EMPTY].color,
              border: '2px dashed rgba(255,255,255,0.3)',
            }}
          >
            <span className="tile-preview" />
          </button>
        </div>
      </div>

      {/* Current Selection Info */}
      <div className="palette-section selection-info">
        <h3>Selected</h3>
        <div className="selected-tile-info">
          {(() => {
            const selectedSprite = assetStore.getTileSprite(editorStore.selectedTileType)
            return (
              <div
                className="selected-tile-preview"
                style={{
                  backgroundColor: selectedSprite ? 'transparent' : getTileType(editorStore.selectedTileType).color,
                  backgroundImage: selectedSprite ? `url(${selectedSprite.src})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )
          })()}
          <span className="selected-tile-name">
            {getTileType(editorStore.selectedTileType).name}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="palette-section">
        <h3>Actions</h3>
        <div className="action-buttons">
          <button
            className="action-button"
            onClick={() => editorStore.undo()}
            disabled={!editorStore.canUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            className="action-button"
            onClick={() => editorStore.redo()}
            disabled={!editorStore.canRedo}
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  )
})
