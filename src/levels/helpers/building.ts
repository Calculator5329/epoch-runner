import type { TilePlacement, LevelDefinition, GridPosition } from '../types'
import type { EntitySpawn, EntityDirection } from '../../core/types/entities'
import { createEmptyGrid, applyPlacements } from './grid'
import { platform, wall, hollowRect } from './solids'

// ============================================
// Level Building Helpers
// ============================================

/**
 * Create a level from tile placements
 */
export function createLevel(
  id: string,
  name: string,
  width: number,
  height: number,
  playerSpawn: GridPosition,
  placements: TilePlacement[],
  options?: {
    description?: string
    author?: string
    startingLives?: number
    parTime?: number
    themeId?: string
    entities?: EntitySpawn[]
  }
): LevelDefinition {
  const grid = createEmptyGrid(width, height)
  const collision = applyPlacements(grid, placements)
  
  return {
    id,
    name,
    width,
    height,
    playerSpawn,
    collision,
    ...options,
  }
}

/**
 * Merge multiple tile placement arrays
 */
export function tiles(...placementArrays: TilePlacement[][]): TilePlacement[] {
  return placementArrays.flat()
}

/**
 * Create a ground floor across the entire level width
 */
export function ground(width: number, row: number): TilePlacement[] {
  return platform(0, row, width)
}

/**
 * Create left and right walls for the entire level height
 */
export function walls(height: number, width: number): TilePlacement[] {
  return [
    ...wall(0, 0, height),
    ...wall(width - 1, 0, height),
  ]
}

/**
 * Create a ceiling across the entire level width
 */
export function ceiling(width: number): TilePlacement[] {
  return platform(0, 0, width)
}

/**
 * Create a full border around the level
 */
export function border(width: number, height: number): TilePlacement[] {
  return hollowRect(0, 0, width, height)
}

// ============================================
// Entity Helpers
// ============================================

/**
 * Create a patrol enemy spawn
 */
export function patrolEnemy(
  col: number,
  row: number,
  direction: EntityDirection = 'right'
): EntitySpawn {
  return {
    definitionId: 'enemy_patrol',
    position: { col, row },
    properties: { startDirection: direction },
  }
}

/**
 * Create a static enemy spawn
 */
export function staticEnemy(col: number, row: number): EntitySpawn {
  return {
    definitionId: 'enemy_static',
    position: { col, row },
  }
}

/**
 * Create multiple patrol enemies in a row
 */
export function patrolEnemyRow(
  startCol: number,
  row: number,
  count: number,
  spacing: number = 5,
  direction: EntityDirection = 'right'
): EntitySpawn[] {
  const enemies: EntitySpawn[] = []
  for (let i = 0; i < count; i++) {
    enemies.push(patrolEnemy(startCol + i * spacing, row, direction))
  }
  return enemies
}

/**
 * Merge multiple entity spawn arrays
 */
export function entities(...spawnArrays: (EntitySpawn | EntitySpawn[])[]): EntitySpawn[] {
  return spawnArrays.flat()
}
