import { makeAutoObservable } from 'mobx'
import { TILE_SIZE } from '../core/constants'
import type { 
  Entity, 
  EntityDefinition, 
  EntitySpawn,
  EntityDirection 
} from '../core/types/entities'
import { 
  getEntityDefinition, 
  generateEntityId,
  resetEntityIdCounter 
} from '../core/types/entities'

/**
 * EntityStore - Manages all active entities in the game world
 * 
 * Handles entity spawning, despawning, queries, and level loading.
 * Entities are dynamic game objects like enemies, beyond static tiles.
 */
export class EntityStore {
  /** Map of active entities by ID */
  entities: Map<string, Entity> = new Map()
  
  /** Original spawn data for level reset */
  private originalSpawns: EntitySpawn[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Entity Creation & Destruction
  // ============================================

  /**
   * Spawn a new entity from a definition
   */
  spawn(
    definition: EntityDefinition,
    x: number,
    y: number,
    direction: EntityDirection = 'right'
  ): Entity {
    const entity: Entity = {
      id: generateEntityId(),
      type: definition.type,
      definitionId: definition.id,
      x,
      y,
      vx: 0,
      vy: 0,
      width: definition.width,
      height: definition.height,
      isActive: true,
      direction,
      health: definition.health,
      isGrounded: false,
      data: {},
    }
    
    this.entities.set(entity.id, entity)
    return entity
  }

  /**
   * Spawn entity from spawn data (level loading)
   */
  spawnFromData(spawn: EntitySpawn): Entity | null {
    const definition = getEntityDefinition(spawn.definitionId)
    if (!definition) {
      console.warn(`Unknown entity definition: ${spawn.definitionId}`)
      return null
    }
    
    // Convert grid position to world pixels
    const x = spawn.position.col * TILE_SIZE
    const y = spawn.position.row * TILE_SIZE
    
    const direction = spawn.properties?.startDirection ?? 'right'
    const entity = this.spawn(definition, x, y, direction)
    
    // Apply custom properties
    if (spawn.properties?.patrolRange !== undefined) {
      entity.data.patrolRange = spawn.properties.patrolRange
    }
    if (spawn.properties?.respawns !== undefined) {
      entity.data.respawns = spawn.properties.respawns
    }
    
    return entity
  }

  /**
   * Remove an entity from the world
   */
  despawn(id: string): void {
    this.entities.delete(id)
  }

  /**
   * Deactivate an entity (keeps it but stops updates)
   */
  deactivate(id: string): void {
    const entity = this.entities.get(id)
    if (entity) {
      entity.isActive = false
    }
  }

  // ============================================
  // Queries
  // ============================================

  /**
   * Get entity by ID
   */
  get(id: string): Entity | undefined {
    return this.entities.get(id)
  }

  /**
   * Get all active entities
   */
  getActive(): Entity[] {
    return [...this.entities.values()].filter(e => e.isActive)
  }

  /**
   * Get all entities of a specific type
   */
  getByType(type: string): Entity[] {
    return [...this.entities.values()].filter(e => e.type === type)
  }

  /**
   * Get all active enemies
   */
  getActiveEnemies(): Entity[] {
    return this.getActive().filter(e => e.type.startsWith('enemy_'))
  }

  /**
   * Count of active entities
   */
  get activeCount(): number {
    return this.getActive().length
  }

  // ============================================
  // Level Management
  // ============================================

  /**
   * Load entities from level spawn data
   */
  loadFromLevel(spawns: EntitySpawn[]): void {
    // Store original spawns for reset
    this.originalSpawns = spawns.map(s => ({ ...s }))
    
    // Clear existing entities
    this.clear()
    
    // Spawn all entities
    for (const spawn of spawns) {
      this.spawnFromData(spawn)
    }
  }

  /**
   * Reset entities to original level state
   * Called when player dies or restarts level
   */
  reset(): void {
    this.clear()
    resetEntityIdCounter()
    
    // Respawn from original data
    for (const spawn of this.originalSpawns) {
      this.spawnFromData(spawn)
    }
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear()
  }

  /**
   * Full reset including original spawns
   * Called when loading a new level
   */
  fullReset(): void {
    this.clear()
    this.originalSpawns = []
    resetEntityIdCounter()
  }
}
