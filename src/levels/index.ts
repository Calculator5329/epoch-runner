/**
 * Level Registry - Central export for all game levels
 * 
 * Import levels here and add them to the registry.
 * The LevelLoaderService uses this to find levels by ID.
 * 
 * Age 0 = Test/Development levels (no real graphics yet)
 * Age 1+ = Real game levels with proper assets
 */

import type { LevelDefinition } from './types'

// Age 0: Test Levels
import { level_test } from './level_test'
import { level_0_basic } from './level_0_basic'
import { level_0_shapes } from './level_0_shapes'
import { level_0_hazards } from './level_0_hazards'
import { level_0_coins } from './level_0_coins'
import { level_0_powerup } from './level_0_powerup'

// Re-export types and helpers for convenience
export * from './types'
export * from './helpers'

// Export individual levels
export { level_test }
export { level_0_basic }
export { level_0_shapes }
export { level_0_hazards }
export { level_0_coins }
export { level_0_powerup }

/**
 * Registry of all available levels
 * Maps level ID to level definition
 */
export const levelRegistry: Record<string, LevelDefinition> = {
  // Legacy test level
  [level_test.id]: level_test,
  
  // Age 0: Test levels
  [level_0_basic.id]: level_0_basic,
  [level_0_shapes.id]: level_0_shapes,
  [level_0_hazards.id]: level_0_hazards,
  [level_0_coins.id]: level_0_coins,
  [level_0_powerup.id]: level_0_powerup,
}

/**
 * Get a level by ID from the registry
 */
export function getLevel(id: string): LevelDefinition | undefined {
  return levelRegistry[id]
}

/**
 * Get all level IDs
 */
export function getLevelIds(): string[] {
  return Object.keys(levelRegistry)
}

/**
 * Get all levels as an array
 */
export function getAllLevels(): LevelDefinition[] {
  return Object.values(levelRegistry)
}

/**
 * Default level to load on game start
 */
export const DEFAULT_LEVEL_ID = 'level_0_basic'
