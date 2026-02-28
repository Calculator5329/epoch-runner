/**
 * Level Registry - Central export for all game levels
 * 
 * Import levels here and add them to the registry.
 * The LevelLoaderService uses this to find levels by ID.
 * 
 * Level Progression:
 * - Level 0: Basic platforming (tutorial) - single jump
 * - Level 1: Introduces shapes (half blocks, slopes) - single jump
 * - Level 2: Introduces hazards (spikes, checkpoints) - single jump
 * - Level 3: Introduces coins (currency, one-way platforms) - single jump
 * - Level 4: Introduces power-ups (triple jump) - single jump
 * - Level 5: The Gauntlet (all features combined) - double jump
 * - Level 6: ET Custom 1 (custom user level) - double jump
 * - Level 7: Introduces enemies (patrol enemies, stomp mechanic) - double jump
 * - Level 8: Power Surge (speed boost, super jump, invincibility) - double jump
 * - Level 9: ET Custom 2 (custom user level, vertical platforming) - double jump
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
import { level_6_et_custom_1 } from './level_6_et_custom_1'
import { level_7_enemies } from './level_7_enemies'
import { level_8_powerups } from './level_8_powerups'
import { level_9_et_custom_2 } from './level_9_et_custom_2'

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
export { level_6_et_custom_1 }
export { level_7_enemies }
export { level_8_powerups }
export { level_9_et_custom_2 }

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
  [level_6_et_custom_1.id]: level_6_et_custom_1,
  [level_7_enemies.id]: level_7_enemies,
  [level_8_powerups.id]: level_8_powerups,
  [level_9_et_custom_2.id]: level_9_et_custom_2,
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

/**
 * Ordered array of campaign levels (progression order)
 * This determines the order players progress through levels
 */
export const CAMPAIGN_LEVELS: string[] = [
  'level_0_basic',
  'level_1_shapes',
  'level_2_hazards',
  'level_3_coins',
  'level_4_powerup',
  'level_5_gauntlet',
  'level_6_et_custom_1',
  'level_7_enemies',
  'level_8_powerups',
  'level_9_et_custom_2',
]

/**
 * Get level index in campaign progression
 */
export function getLevelIndex(levelId: string): number {
  return CAMPAIGN_LEVELS.indexOf(levelId)
}

/**
 * Get next level ID in campaign
 */
export function getNextLevelId(currentLevelId: string): string | null {
  const currentIndex = getLevelIndex(currentLevelId)
  if (currentIndex === -1 || currentIndex >= CAMPAIGN_LEVELS.length - 1) {
    return null
  }
  return CAMPAIGN_LEVELS[currentIndex + 1]
}

/**
 * Check if level is last in campaign
 */
export function isLastLevel(levelId: string): boolean {
  const index = getLevelIndex(levelId)
  return index === CAMPAIGN_LEVELS.length - 1
}

/**
 * Check if a level has double jump unlocked by default
 * Level 5+ have double jump, levels 0-4 have single jump
 */
export function hasDoubleJumpUnlocked(levelId: string): boolean {
  const index = getLevelIndex(levelId)
  // Level 5 (index 5) and above have double jump
  // Also return true for non-campaign levels (custom levels get double jump)
  return index === -1 || index >= 5
}
