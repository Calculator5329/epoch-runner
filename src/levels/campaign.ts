/**
 * Campaign Configuration - Defines campaign level progression
 * 
 * This module defines the order of levels in the main campaign.
 * Separated from the registry to allow for multiple campaigns
 * or custom campaign definitions in the future.
 */

import { levelRegistry } from '../core/registry'
import { DEFAULT_CAMPAIGN, isCampaignLastLevel } from '../core/data/campaignConfig'

/**
 * Default level to load on game start
 */
export const DEFAULT_LEVEL_ID = 'level_0_basic'

/**
 * Ordered array of campaign levels (progression order)
 * This determines the order players progress through levels
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
 * @deprecated Use CampaignStore.isLastLevel for campaign-aware check
 */
export function isLastLevel(levelId: string): boolean {
  return isCampaignLastLevel(DEFAULT_CAMPAIGN, levelId)
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

/**
 * Get total number of campaign levels
 */
export function getCampaignLength(): number {
  return CAMPAIGN_LEVELS.length
}

/**
 * Get campaign level at index
 */
export function getCampaignLevelId(index: number): string | undefined {
  return CAMPAIGN_LEVELS[index]
}

/**
 * Check if a level is part of the main campaign
 */
export function isInCampaign(levelId: string): boolean {
  return CAMPAIGN_LEVELS.includes(levelId)
}

// Convenience wrapper functions that use the registry
// These provide the same API as the old static registry

/**
 * Get a level by ID from the registry
 */
export function getLevel(id: string) {
  return levelRegistry.get(id)
}

/**
 * Get all level IDs
 */
export function getLevelIds(): string[] {
  return levelRegistry.getIds()
}

/**
 * Get all levels as an array
 */
export function getAllLevels() {
  return levelRegistry.getAll()
}
