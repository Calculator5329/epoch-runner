/**
 * Level Registry - Central export for all game levels
 * 
 * Import levels here and add them to the registry.
 * The LevelLoaderService uses this to find levels by ID.
 * 
 * Level Progression:
 * - Level 0: Basic platforming (tutorial)
 * - Level 1: Introduces shapes (half blocks, slopes)
 * - Level 2: Introduces hazards (spikes, checkpoints)
 * - Level 3: Introduces coins (currency, one-way platforms)
 * - Level 4: Introduces power-ups (double jump)
 * - Level 5: The Gauntlet (all features combined)
 */

import type { LevelDefinition } from './types'

// Level imports
import { level_test } from './level_test'
import { level_0_basic } from './level_0_basic'
import { level_1_shapes } from './level_1_shapes'
import { level_2_hazards } from './level_2_hazards'
import { level_3_coins } from './level_3_coins'
import { level_4_powerup } from './level_4_powerup'
import { level_5_gauntlet } from './level_5_gauntlet'

// Re-export types and helpers for convenience
export * from './types'
export * from './helpers'

// Export individual levels
export { level_test }
export { level_0_basic }
export { level_1_shapes }
export { level_2_hazards }
export { level_3_coins }
export { level_4_powerup }
export { level_5_gauntlet }

/**
 * Registry of all available levels
 * Maps level ID to level definition
 */
export const levelRegistry: Record<string, LevelDefinition> = {
  // Legacy test level
  [level_test.id]: level_test,
  
  // Main progression
  [level_0_basic.id]: level_0_basic,
  [level_1_shapes.id]: level_1_shapes,
  [level_2_hazards.id]: level_2_hazards,
  [level_3_coins.id]: level_3_coins,
  [level_4_powerup.id]: level_4_powerup,
  [level_5_gauntlet.id]: level_5_gauntlet,
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
