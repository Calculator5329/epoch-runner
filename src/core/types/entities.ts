/**
 * Entity System Types
 * 
 * Entities are dynamic game objects beyond tiles: enemies, collectibles, triggers.
 * This file defines the core interfaces and type definitions.
 */

import type { GridPosition } from '../../levels/types'

/**
 * Entity type categories for behavior grouping
 */
export type EntityType =
  | 'enemy_patrol'      // Walks back and forth on platforms
  | 'enemy_static'      // Stationary hazard enemy
  | 'enemy_flying'      // Aerial enemy that patrols horizontally
  | 'enemy_jumping'     // Jumps periodically (future)

/**
 * Direction an entity is facing/moving
 */
export type EntityDirection = 'left' | 'right'

/**
 * Runtime entity instance - an active entity in the game world
 */
export interface Entity {
  /** Unique runtime ID */
  id: string
  
  /** Entity type for behavior dispatch */
  type: EntityType
  
  /** Reference to static definition */
  definitionId: string
  
  /** Position in world pixels (top-left corner) */
  x: number
  y: number
  
  /** Velocity in pixels per second */
  vx: number
  vy: number
  
  /** Dimensions in pixels */
  width: number
  height: number
  
  /** Whether entity is active and should update/render */
  isActive: boolean
  
  /** Current facing direction */
  direction: EntityDirection
  
  /** Health points (for destructible entities) */
  health: number
  
  /** Whether entity is grounded (for gravity) */
  isGrounded: boolean
  
  /** Additional behavior-specific data */
  data: Record<string, unknown>
}

/**
 * Static entity definition - template for creating entities
 */
export interface EntityDefinition {
  /** Unique identifier for this definition */
  id: string
  
  /** Entity type category */
  type: EntityType
  
  /** Display name for editor/debug */
  displayName: string
  
  /** Default dimensions in pixels */
  width: number
  height: number
  
  /** Movement speed in pixels per second */
  speed: number
  
  /** Damage dealt to player on contact */
  damage: number
  
  /** Starting health points */
  health: number
  
  /** Color for procedural rendering (MVP) */
  color: string
  
  /** Sprite ID for custom rendering (future) */
  spriteId?: string
}

/**
 * Entity spawn point in a level definition
 */
export interface EntitySpawn {
  /** Reference to entity definition ID */
  definitionId: string
  
  /** Spawn position in grid coordinates */
  position: GridPosition
  
  /** Optional property overrides */
  properties?: {
    /** Initial facing direction */
    startDirection?: EntityDirection
    /** Whether entity respawns after death */
    respawns?: boolean
    /** Custom patrol range in tiles (0 = infinite) */
    patrolRange?: number
  }
}

// ============================================
// Predefined Entity Definitions
// ============================================

/**
 * Basic patrol enemy - walks back and forth on platforms
 */
export const ENEMY_PATROL: EntityDefinition = {
  id: 'enemy_patrol',
  type: 'enemy_patrol',
  displayName: 'Patrol Enemy',
  width: 48,
  height: 48,
  speed: 80,
  damage: 1,
  health: 1,
  color: '#e53e3e', // Red
}

/**
 * Static enemy - doesn't move, just damages on contact
 */
export const ENEMY_STATIC: EntityDefinition = {
  id: 'enemy_static',
  type: 'enemy_static',
  displayName: 'Static Enemy',
  width: 48,
  height: 48,
  speed: 0,
  damage: 1,
  health: 1,
  color: '#9b2c2c', // Dark red
}

/**
 * Flying enemy - patrols horizontally in mid-air, no gravity
 */
export const ENEMY_FLYING: EntityDefinition = {
  id: 'enemy_flying',
  type: 'enemy_flying',
  displayName: 'Flying Enemy',
  width: 48,
  height: 40,
  speed: 100,
  damage: 1,
  health: 1,
  color: '#805ad5', // Purple
}

/**
 * Registry of all entity definitions
 */
export const ENTITY_DEFINITIONS: Record<string, EntityDefinition> = {
  [ENEMY_PATROL.id]: ENEMY_PATROL,
  [ENEMY_STATIC.id]: ENEMY_STATIC,
  [ENEMY_FLYING.id]: ENEMY_FLYING,
}

/**
 * Get entity definition by ID
 */
export function getEntityDefinition(id: string): EntityDefinition | undefined {
  return ENTITY_DEFINITIONS[id]
}

/**
 * Generate a unique entity ID
 */
let entityIdCounter = 0
export function generateEntityId(): string {
  return `entity_${Date.now()}_${entityIdCounter++}`
}

/**
 * Reset entity ID counter (for testing)
 */
export function resetEntityIdCounter(): void {
  entityIdCounter = 0
}
