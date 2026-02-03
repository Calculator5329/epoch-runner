import { makeAutoObservable } from 'mobx'
import { TileTypeId } from '../core/types'
import type { GridPosition, LevelDefinition } from '../levels/types'
import type { EntitySpawn, EntityDirection } from '../core/types/entities'
import { createEmptyGrid } from '../levels/helpers'
import { editorHistoryService, type HistorySnapshot } from '../services/EditorHistoryService'
import { editorGridService } from '../services/EditorGridService'

/**
 * Tool types available in the editor
 */
export type EditorTool = 'paint' | 'erase' | 'fill' | 'eyedropper' | 'spawn' | 'entity'

/**
 * Editor entity spawn - extends EntitySpawn with editor-specific ID
 */
export interface EditorEntitySpawn extends EntitySpawn {
  /** Unique ID for editor selection */
  editorId: string
}

/**
 * Application mode - game or editor
 */
export type AppMode = 'game' | 'editor'

/**
 * Default level dimensions
 */
const DEFAULT_WIDTH = 30
const DEFAULT_HEIGHT = 15

/**
 * EditorStore - Manages level editor state
 * 
 * Handles tile painting, tool selection, undo/redo, and level management.
 */
export class EditorStore {
  // Application mode
  mode: AppMode = 'game'
  
  // Flag indicating we're testing an editor level (not normal campaign)
  isTestingLevel: boolean = false
  
  // Selected tile type for painting
  selectedTileType: TileTypeId = TileTypeId.SOLID_FULL
  
  // Current tool
  tool: EditorTool = 'paint'
  
  // Level dimensions
  gridWidth: number = DEFAULT_WIDTH
  gridHeight: number = DEFAULT_HEIGHT
  
  // Working collision grid
  collision: number[][] = []
  
  // Player spawn position
  playerSpawn: GridPosition = { col: 2, row: 13 }
  
  // Level metadata
  levelId: string = 'custom_level'
  levelName: string = 'Custom Level'
  
  // Undo/redo stacks
  undoStack: HistorySnapshot[] = []
  redoStack: HistorySnapshot[] = []
  
  // Mouse state for editor
  hoveredTile: GridPosition | null = null
  isDragging: boolean = false
  
  // Camera offset for panning
  cameraX: number = 0
  cameraY: number = 0
  
  // Entity layer
  entitySpawns: EditorEntitySpawn[] = []
  
  // Selected entity type for placing (definition ID)
  selectedEntityType: string | null = null
  
  // Selected entity instance in editor (for editing/moving)
  selectedEntityId: string | null = null
  
  // Counter for generating unique editor entity IDs
  private entityIdCounter: number = 0

  constructor() {
    makeAutoObservable(this)
    this.initNewLevel(DEFAULT_WIDTH, DEFAULT_HEIGHT)
  }

  // ============================================
  // Mode Management
  // ============================================

  /**
   * Toggle between game and editor modes
   */
  toggleMode(): void {
    this.mode = this.mode === 'game' ? 'editor' : 'game'
  }

  /**
   * Set application mode directly
   */
  setMode(mode: AppMode): void {
    this.mode = mode
    // Clear testing flag when returning to editor
    if (mode === 'editor') {
      this.isTestingLevel = false
    }
  }

  // ============================================
  // Tool Management
  // ============================================

  /**
   * Set the active tool
   */
  setTool(tool: EditorTool): void {
    this.tool = tool
  }

  /**
   * Set the selected tile type
   */
  setSelectedTileType(tileType: TileTypeId): void {
    this.selectedTileType = tileType
  }

  // ============================================
  // Grid Operations
  // ============================================

  /**
   * Initialize a new empty level
   */
  initNewLevel(width: number, height: number): void {
    this.gridWidth = width
    this.gridHeight = height
    this.collision = createEmptyGrid(width, height)
    this.playerSpawn = { col: 2, row: height - 2 }
    this.levelId = 'custom_level'
    this.levelName = 'Custom Level'
    this.undoStack = []
    this.redoStack = []
    this.cameraX = 0
    this.cameraY = 0
    this.isTestingLevel = false
    this.entitySpawns = []
    this.selectedEntityId = null
    this.entityIdCounter = 0
  }

  /**
   * Load a level definition into the editor
   */
  loadLevel(level: LevelDefinition): void {
    this.gridWidth = level.width
    this.gridHeight = level.height
    // Deep copy the collision grid
    this.collision = level.collision.map(row => [...row])
    this.playerSpawn = { ...level.playerSpawn }
    this.levelId = level.id
    this.levelName = level.name
    this.undoStack = []
    this.redoStack = []
    this.cameraX = 0
    this.cameraY = 0
    // Load entities with editor IDs
    this.entityIdCounter = 0
    this.entitySpawns = (level.entities || []).map(e => ({
      ...e,
      position: { ...e.position },
      properties: e.properties ? { ...e.properties } : undefined,
      editorId: this.generateEditorEntityId(),
    }))
    this.selectedEntityId = null
  }

  /**
   * Get current level as a LevelDefinition
   */
  toLevelDefinition(): LevelDefinition {
    // Convert EditorEntitySpawn to EntitySpawn (strip editorId)
    const entities: EntitySpawn[] = this.entitySpawns.map(e => ({
      definitionId: e.definitionId,
      position: { ...e.position },
      properties: e.properties ? { ...e.properties } : undefined,
    }))
    
    return {
      id: this.levelId,
      name: this.levelName,
      width: this.gridWidth,
      height: this.gridHeight,
      playerSpawn: { ...this.playerSpawn },
      collision: this.collision.map(row => [...row]),
      entities: entities.length > 0 ? entities : undefined,
    }
  }

  /**
   * Push current state to undo stack
   */
  private pushHistory(): void {
    const snapshot = editorHistoryService.createSnapshot(
      this.collision,
      this.playerSpawn,
      this.entitySpawns
    )
    
    const result = editorHistoryService.pushSnapshot(this.undoStack, snapshot)
    this.undoStack = result.undoStack
    this.redoStack = result.redoStack
  }

  /**
   * Set a single tile (with undo support)
   */
  setTile(col: number, row: number, tileType: number): void {
    if (!this.isValidPosition(col, row)) return
    if (this.collision[row][col] === tileType) return
    
    this.pushHistory()
    this.collision[row][col] = tileType
  }

  /**
   * Set a tile during drag (batched - no history push)
   */
  setTileDrag(col: number, row: number, tileType: number): void {
    if (!this.isValidPosition(col, row)) return
    this.collision[row][col] = tileType
  }

  /**
   * Start a drag operation (push history once)
   */
  startDrag(): void {
    this.isDragging = true
    this.pushHistory()
  }

  /**
   * End drag operation
   */
  endDrag(): void {
    this.isDragging = false
  }

  /**
   * Set player spawn position
   */
  setPlayerSpawn(col: number, row: number): void {
    if (!this.isValidPosition(col, row)) return
    this.pushHistory()
    this.playerSpawn = { col, row }
  }

  /**
   * Flood fill from a starting point
   */
  fill(startCol: number, startRow: number, newType: number): void {
    if (!this.isValidPosition(startCol, startRow)) return
    
    const oldType = this.collision[startRow][startCol]
    if (oldType === newType) return
    
    this.pushHistory()
    
    // Use service for flood fill algorithm
    this.collision = editorGridService.floodFill(
      this.collision,
      startCol,
      startRow,
      newType
    )
  }

  /**
   * Get tile at position (for eyedropper)
   */
  getTileAt(col: number, row: number): number {
    if (!this.isValidPosition(col, row)) return TileTypeId.EMPTY
    return this.collision[row][col]
  }

  /**
   * Check if position is within grid bounds
   */
  isValidPosition(col: number, row: number): boolean {
    return editorGridService.isValidPosition(col, row, this.gridWidth, this.gridHeight)
  }

  // ============================================
  // Undo/Redo
  // ============================================

  /**
   * Undo last action
   */
  undo(): void {
    const currentState = editorHistoryService.createSnapshot(
      this.collision,
      this.playerSpawn,
      this.entitySpawns
    )
    
    const result = editorHistoryService.undo(this.undoStack, this.redoStack, currentState)
    if (!result) return
    
    this.collision = result.state.collision
    this.playerSpawn = result.state.playerSpawn
    this.entitySpawns = result.state.entitySpawns
    this.undoStack = result.undoStack
    this.redoStack = result.redoStack
    this.selectedEntityId = null
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    const currentState = editorHistoryService.createSnapshot(
      this.collision,
      this.playerSpawn,
      this.entitySpawns
    )
    
    const result = editorHistoryService.redo(this.undoStack, this.redoStack, currentState)
    if (!result) return
    
    this.collision = result.state.collision
    this.playerSpawn = result.state.playerSpawn
    this.entitySpawns = result.state.entitySpawns
    this.undoStack = result.undoStack
    this.redoStack = result.redoStack
    this.selectedEntityId = null
  }

  /**
   * Check if undo is available
   */
  get canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  get canRedo(): boolean {
    return this.redoStack.length > 0
  }

  // ============================================
  // Mouse State
  // ============================================

  /**
   * Update hovered tile position
   */
  setHoveredTile(col: number | null, row: number | null): void {
    if (col === null || row === null) {
      this.hoveredTile = null
    } else {
      this.hoveredTile = { col, row }
    }
  }

  // ============================================
  // Camera/Viewport
  // ============================================

  /**
   * Set camera position
   */
  setCamera(x: number, y: number): void {
    this.cameraX = x
    this.cameraY = y
  }

  /**
   * Pan camera by delta
   */
  panCamera(dx: number, dy: number): void {
    this.cameraX += dx
    this.cameraY += dy
  }

  // ============================================
  // Level Metadata
  // ============================================

  /**
   * Set level ID
   */
  setLevelId(id: string): void {
    this.levelId = id
  }

  /**
   * Set level name
   */
  setLevelName(name: string): void {
    this.levelName = name
  }

  /**
   * Resize level (preserves existing tiles where possible)
   */
  resizeLevel(newWidth: number, newHeight: number): void {
    if (newWidth < 1 || newHeight < 1) return
    
    this.pushHistory()
    
    // Use service for grid resizing
    this.collision = editorGridService.resizeGrid(
      this.collision,
      newWidth,
      newHeight,
      TileTypeId.EMPTY
    )
    
    this.gridWidth = newWidth
    this.gridHeight = newHeight
    
    // Clamp player spawn to new bounds
    if (this.playerSpawn.col >= newWidth) {
      this.playerSpawn.col = newWidth - 1
    }
    if (this.playerSpawn.row >= newHeight) {
      this.playerSpawn.row = newHeight - 1
    }
    
    // Remove entities outside new bounds
    this.entitySpawns = this.entitySpawns.filter(
      e => e.position.col < newWidth && e.position.row < newHeight
    )
  }

  // ============================================
  // Entity Management
  // ============================================

  /**
   * Generate unique editor entity ID
   */
  private generateEditorEntityId(): string {
    return `editor_entity_${this.entityIdCounter++}`
  }

  /**
   * Set selected entity type for placement
   */
  setSelectedEntityType(definitionId: string | null): void {
    this.selectedEntityType = definitionId
    if (definitionId) {
      this.tool = 'entity'
    }
  }

  /**
   * Select an entity instance in the editor
   */
  selectEntity(editorId: string | null): void {
    this.selectedEntityId = editorId
  }

  /**
   * Add a new entity at grid position
   */
  addEntity(col: number, row: number, definitionId: string, direction: EntityDirection = 'right'): void {
    if (!this.isValidPosition(col, row)) return
    
    this.pushHistory()
    
    const newEntity: EditorEntitySpawn = {
      definitionId,
      position: { col, row },
      properties: { startDirection: direction },
      editorId: this.generateEditorEntityId(),
    }
    
    this.entitySpawns.push(newEntity)
    this.selectedEntityId = newEntity.editorId
  }

  /**
   * Remove an entity by editor ID
   */
  removeEntity(editorId: string): void {
    const index = this.entitySpawns.findIndex(e => e.editorId === editorId)
    if (index === -1) return
    
    this.pushHistory()
    this.entitySpawns.splice(index, 1)
    
    if (this.selectedEntityId === editorId) {
      this.selectedEntityId = null
    }
  }

  /**
   * Remove currently selected entity
   */
  removeSelectedEntity(): void {
    if (this.selectedEntityId) {
      this.removeEntity(this.selectedEntityId)
    }
  }

  /**
   * Move an entity to new grid position
   */
  moveEntity(editorId: string, col: number, row: number): void {
    if (!this.isValidPosition(col, row)) return
    
    const entity = this.entitySpawns.find(e => e.editorId === editorId)
    if (!entity) return
    
    // Skip if position unchanged
    if (entity.position.col === col && entity.position.row === row) return
    
    this.pushHistory()
    entity.position = { col, row }
  }

  /**
   * Get entity at grid position (for clicking)
   */
  getEntityAt(col: number, row: number): EditorEntitySpawn | null {
    // Return first entity found at position (entities are single-tile for now)
    return this.entitySpawns.find(e => 
      e.position.col === col && e.position.row === row
    ) || null
  }

  /**
   * Update entity properties
   */
  updateEntityProperties(editorId: string, properties: Partial<EntitySpawn['properties']>): void {
    const entity = this.entitySpawns.find(e => e.editorId === editorId)
    if (!entity) return
    
    this.pushHistory()
    entity.properties = { ...entity.properties, ...properties }
  }

  /**
   * Get selected entity
   */
  get selectedEntity(): EditorEntitySpawn | null {
    if (!this.selectedEntityId) return null
    return this.entitySpawns.find(e => e.editorId === this.selectedEntityId) || null
  }
}
