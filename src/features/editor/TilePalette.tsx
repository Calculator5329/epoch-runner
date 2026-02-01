import { observer } from 'mobx-react-lite'
import { useEditorStore } from '../../stores/RootStore'
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
]

/**
 * TilePalette - Tile and tool selection panel
 * 
 * Shows available tiles organized by category and tool buttons.
 */
export const TilePalette = observer(function TilePalette() {
  const editorStore = useEditorStore()

  return (
    <div className="tile-palette">
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
                    backgroundColor: tileType.color,
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
          <div
            className="selected-tile-preview"
            style={{
              backgroundColor: getTileType(editorStore.selectedTileType).color,
            }}
          />
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
