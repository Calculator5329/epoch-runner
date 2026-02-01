import { makeAutoObservable } from 'mobx'
import { TileTypeId } from '../core/types'
import type { GridPosition, LevelDefinition } from '../levels/types'
import { createEmptyGrid } from '../levels/helpers'

/**
 * Tool types available in the editor
 */
export type EditorTool = 'paint' | 'erase' | 'fill' | 'eyedropper' | 'spawn'

/**
 * Application mode - game or editor
 */
export type AppMode = 'game' | 'editor'

/**
 * History entry for undo/redo
 */
interface HistoryEntry {
  collision: number[][]
  playerSpawn: GridPosition
}

/**
 * Maximum history entries to keep
 */
const MAX_HISTORY = 50

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
  undoStack: HistoryEntry[] = []
  redoStack: HistoryEntry[] = []
  
  // Mouse state for editor
  hoveredTile: GridPosition | null = null
  isDragging: boolean = false
  
  // Camera offset for panning
  cameraX: number = 0
  cameraY: number = 0

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
  }

  /**
   * Get current level as a LevelDefinition
   */
  toLevelDefinition(): LevelDefinition {
    return {
      id: this.levelId,
      name: this.levelName,
      width: this.gridWidth,
      height: this.gridHeight,
      playerSpawn: { ...this.playerSpawn },
      collision: this.collision.map(row => [...row]),
    }
  }

  /**
   * Push current state to undo stack
   */
  private pushHistory(): void {
    const entry: HistoryEntry = {
      collision: this.collision.map(row => [...row]),
      playerSpawn: { ...this.playerSpawn },
    }
    
    this.undoStack.push(entry)
    
    // Limit history size
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift()
    }
    
    // Clear redo stack on new action
    this.redoStack = []
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
    
    // BFS flood fill
    const queue: GridPosition[] = [{ col: startCol, row: startRow }]
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const { col, row } = queue.shift()!
      const key = `${col},${row}`
      
      if (visited.has(key)) continue
      if (!this.isValidPosition(col, row)) continue
      if (this.collision[row][col] !== oldType) continue
      
      visited.add(key)
      this.collision[row][col] = newType
      
      // Add neighbors
      queue.push({ col: col + 1, row })
      queue.push({ col: col - 1, row })
      queue.push({ col, row: row + 1 })
      queue.push({ col, row: row - 1 })
    }
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
    return col >= 0 && col < this.gridWidth && row >= 0 && row < this.gridHeight
  }

  // ============================================
  // Undo/Redo
  // ============================================

  /**
   * Undo last action
   */
  undo(): void {
    if (this.undoStack.length === 0) return
    
    // Save current state to redo stack
    const current: HistoryEntry = {
      collision: this.collision.map(row => [...row]),
      playerSpawn: { ...this.playerSpawn },
    }
    this.redoStack.push(current)
    
    // Restore previous state
    const previous = this.undoStack.pop()!
    this.collision = previous.collision
    this.playerSpawn = previous.playerSpawn
  }

  /**
   * Redo last undone action
   */
  redo(): void {
    if (this.redoStack.length === 0) return
    
    // Save current state to undo stack
    const current: HistoryEntry = {
      collision: this.collision.map(row => [...row]),
      playerSpawn: { ...this.playerSpawn },
    }
    this.undoStack.push(current)
    
    // Restore next state
    const next = this.redoStack.pop()!
    this.collision = next.collision
    this.playerSpawn = next.playerSpawn
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
    
    const newCollision = createEmptyGrid(newWidth, newHeight)
    
    // Copy existing tiles
    for (let row = 0; row < Math.min(this.gridHeight, newHeight); row++) {
      for (let col = 0; col < Math.min(this.gridWidth, newWidth); col++) {
        newCollision[row][col] = this.collision[row][col]
      }
    }
    
    this.collision = newCollision
    this.gridWidth = newWidth
    this.gridHeight = newHeight
    
    // Clamp player spawn to new bounds
    if (this.playerSpawn.col >= newWidth) {
      this.playerSpawn.col = newWidth - 1
    }
    if (this.playerSpawn.row >= newHeight) {
      this.playerSpawn.row = newHeight - 1
    }
  }
}
