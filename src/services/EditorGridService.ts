import type { GridPosition } from '../levels/types'

/**
 * EditorGridService - Grid algorithms for the level editor
 * 
 * Stateless service containing grid manipulation algorithms.
 */
export class EditorGridService {
  /**
   * Flood fill algorithm using BFS
   * Returns a new grid with the fill applied (does not mutate input)
   */
  floodFill(
    grid: number[][],
    startCol: number,
    startRow: number,
    newType: number
  ): number[][] {
    const height = grid.length
    const width = grid[0]?.length ?? 0
    
    // Validate starting position
    if (startRow < 0 || startRow >= height || startCol < 0 || startCol >= width) {
      return grid
    }
    
    const oldType = grid[startRow][startCol]
    
    // No change needed if types match
    if (oldType === newType) {
      return grid
    }
    
    // Deep copy the grid
    const result = grid.map(row => [...row])
    
    // BFS flood fill
    const queue: GridPosition[] = [{ col: startCol, row: startRow }]
    const visited = new Set<string>()
    
    while (queue.length > 0) {
      const { col, row } = queue.shift()!
      const key = `${col},${row}`
      
      if (visited.has(key)) continue
      if (row < 0 || row >= height || col < 0 || col >= width) continue
      if (result[row][col] !== oldType) continue
      
      visited.add(key)
      result[row][col] = newType
      
      // Add neighbors (4-way connectivity)
      queue.push({ col: col + 1, row })
      queue.push({ col: col - 1, row })
      queue.push({ col, row: row + 1 })
      queue.push({ col, row: row - 1 })
    }
    
    return result
  }

  /**
   * Check if a position is within grid bounds
   */
  isValidPosition(
    col: number,
    row: number,
    gridWidth: number,
    gridHeight: number
  ): boolean {
    return col >= 0 && col < gridWidth && row >= 0 && row < gridHeight
  }

  /**
   * Resize a grid, preserving existing content where possible
   * Returns a new grid (does not mutate input)
   */
  resizeGrid(
    grid: number[][],
    newWidth: number,
    newHeight: number,
    emptyValue: number = 0
  ): number[][] {
    const oldHeight = grid.length
    const oldWidth = grid[0]?.length ?? 0
    
    // Create new empty grid
    const newGrid = Array.from({ length: newHeight }, () =>
      Array.from({ length: newWidth }, () => emptyValue)
    )
    
    // Copy existing tiles
    for (let row = 0; row < Math.min(oldHeight, newHeight); row++) {
      for (let col = 0; col < Math.min(oldWidth, newWidth); col++) {
        newGrid[row][col] = grid[row][col]
      }
    }
    
    return newGrid
  }
}

// Export singleton instance
export const editorGridService = new EditorGridService()
