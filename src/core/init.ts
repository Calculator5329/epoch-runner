/**
 * Core Initialization Module
 * 
 * Initializes all registries with built-in content.
 * Should be called once at app startup before any game systems are used.
 */

import { initBuiltInLevels } from '../levels/registry'
import { initBuiltInEntities } from './types/entities'
import { initBuiltInTiles } from './types/shapes'

let initialized = false

/**
 * Initialize all core registries with built-in content
 * Safe to call multiple times (will only execute once)
 */
export function initCore(): void {
  if (initialized) {
    console.warn('[initCore] Already initialized, skipping')
    return
  }
  
  console.log('[initCore] Initializing core registries...')
  
  // Initialize tile registry first (other systems may depend on it)
  initBuiltInTiles()
  
  // Initialize entity registry
  initBuiltInEntities()
  
  // Initialize level registry
  initBuiltInLevels()
  
  initialized = true
  console.log('[initCore] Core registries initialized')
}

/**
 * Check if core has been initialized
 */
export function isCoreInitialized(): boolean {
  return initialized
}

/**
 * Reset initialization state (for testing)
 */
export function resetCoreInit(): void {
  initialized = false
}
