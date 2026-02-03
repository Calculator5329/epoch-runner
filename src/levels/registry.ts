/**
 * Level Registration - Registers built-in levels with the dynamic registry
 * 
 * This module imports all built-in levels and registers them with the 
 * levelRegistry. Call initBuiltInLevels() at app startup.
 */

import { levelRegistry } from '../core/registry'
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

/**
 * All built-in levels in an array
 */
export const BUILT_IN_LEVELS: LevelDefinition[] = [
  level_test,
  level_0_basic,
  level_1_shapes,
  level_2_hazards,
  level_3_coins,
  level_4_powerup,
  level_5_gauntlet,
  level_6_et_custom_1,
  level_7_enemies,
  level_8_powerups,
  level_9_et_custom_2,
]

/**
 * Initialize the level registry with built-in levels
 * Should be called once at app startup
 */
export function initBuiltInLevels(): void {
  levelRegistry.registerAll(BUILT_IN_LEVELS, 'built-in')
}

/**
 * Re-export individual levels for direct imports
 */
export {
  level_test,
  level_0_basic,
  level_1_shapes,
  level_2_hazards,
  level_3_coins,
  level_4_powerup,
  level_5_gauntlet,
  level_6_et_custom_1,
  level_7_enemies,
  level_8_powerups,
  level_9_et_custom_2,
}
