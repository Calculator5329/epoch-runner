/**
 * Level Registry - Central export for all game levels
 * 
 * Import levels here and add them to the registry.
 * The LevelLoaderService uses this to find levels by ID.
 */

import type { LevelDefinition } from './types'
import { level_test } from './level_test'

// Re-export types and helpers for convenience
export * from './types'
export * from './helpers'

// Export individual levels
export { level_test }

/**
 * Registry of all available levels
 * Maps level ID to level definition
 */
export const levelRegistry: Record<string, LevelDefinition> = {
  [level_test.id]: level_test,
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
export const DEFAULT_LEVEL_ID = 'level_test'
