import type { GridPosition } from '../levels/types'
import type { EditorEntitySpawn } from '../stores/EditorStore'

/**
 * History snapshot for undo/redo
 */
export interface HistorySnapshot {
  collision: number[][]
  playerSpawn: GridPosition
  entitySpawns: EditorEntitySpawn[]
}

/**
 * Maximum history entries to keep
 */
const MAX_HISTORY = 50

/**
 * EditorHistoryService - Manages undo/redo stack for the level editor
 * 
 * Stateless service that manages history snapshots.
 * Does not use MobX - state is managed externally by EditorStore.
 */
export class EditorHistoryService {
  /**
   * Create a deep copy snapshot of the current state
   */
  createSnapshot(
    collision: number[][],
    playerSpawn: GridPosition,
    entitySpawns: EditorEntitySpawn[]
  ): HistorySnapshot {
    return {
      collision: collision.map(row => [...row]),
      playerSpawn: { ...playerSpawn },
      entitySpawns: entitySpawns.map(e => ({
        ...e,
        position: { ...e.position },
        properties: e.properties ? structuredClone(e.properties) : undefined,
      })),
    }
  }

  /**
   * Push a snapshot to the undo stack
   * Returns the updated stacks
   */
  pushSnapshot(
    undoStack: HistorySnapshot[],
    snapshot: HistorySnapshot
  ): { undoStack: HistorySnapshot[]; redoStack: HistorySnapshot[] } {
    const newUndoStack = [...undoStack, snapshot]
    
    // Limit history size
    if (newUndoStack.length > MAX_HISTORY) {
      newUndoStack.shift()
    }
    
    // Clear redo stack on new action
    return {
      undoStack: newUndoStack,
      redoStack: [],
    }
  }

  /**
   * Perform undo operation
   * Returns the previous state and updated stacks, or null if nothing to undo
   */
  undo(
    undoStack: HistorySnapshot[],
    redoStack: HistorySnapshot[],
    currentState: HistorySnapshot
  ): { 
    state: HistorySnapshot
    undoStack: HistorySnapshot[]
    redoStack: HistorySnapshot[] 
  } | null {
    if (undoStack.length === 0) return null
    
    const newUndoStack = [...undoStack]
    const previousState = newUndoStack.pop()!
    
    // Save current state to redo stack
    const newRedoStack = [...redoStack, currentState]
    
    return {
      state: previousState,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    }
  }

  /**
   * Perform redo operation
   * Returns the next state and updated stacks, or null if nothing to redo
   */
  redo(
    undoStack: HistorySnapshot[],
    redoStack: HistorySnapshot[],
    currentState: HistorySnapshot
  ): {
    state: HistorySnapshot
    undoStack: HistorySnapshot[]
    redoStack: HistorySnapshot[]
  } | null {
    if (redoStack.length === 0) return null
    
    const newRedoStack = [...redoStack]
    const nextState = newRedoStack.pop()!
    
    // Save current state to undo stack
    const newUndoStack = [...undoStack, currentState]
    
    return {
      state: nextState,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(undoStack: HistorySnapshot[]): boolean {
    return undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  canRedo(redoStack: HistorySnapshot[]): boolean {
    return redoStack.length > 0
  }
}

// Export singleton instance
export const editorHistoryService = new EditorHistoryService()
