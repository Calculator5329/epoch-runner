/**
 * Level Module - Barrel Export
 * 
 * Central export for level system including:
 * - Types and helpers
 * - Campaign configuration
 * - Level registration
 * - Registry access
 * 
 * For dynamic registration, use levelRegistry from core/registry
 */

// Re-export types and helpers
export * from './types'
export * from './helpers'

// Export validation module (with prefix to avoid conflicts)
export {
  validateLevel as runValidation,
  quickValidate,
  fullValidate,
  formatValidationResult,
  validationService,
  ALL_RULES,
  getRule,
  getRulesByCategory,
  type ValidationResult,
  type ValidationConfig,
  type ValidationIssue,
  type ValidationRuleDefinition,
  type ValidationSeverity,
  type ValidationRuleCategory,
} from './validation'

// Re-export registry functions
export {
  initBuiltInLevels,
  BUILT_IN_LEVELS,
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
} from './registry'

// Re-export campaign functions and constants
export {
  DEFAULT_LEVEL_ID,
  CAMPAIGN_LEVELS,
  getLevelIndex,
  getNextLevelId,
  isLastLevel,
  hasDoubleJumpUnlocked,
  getCampaignLength,
  getCampaignLevelId,
  isInCampaign,
  getLevel,
  getLevelIds,
  getAllLevels,
} from './campaign'

// Re-export the registry itself for direct access
export { levelRegistry } from '../core/registry'
