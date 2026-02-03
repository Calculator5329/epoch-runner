/**
 * EntityRegistry - Dynamic entity definition registration system
 * 
 * Replaces the static ENTITY_DEFINITIONS with a dynamic registry that supports:
 * - Runtime registration for custom packs
 * - Priority-based overriding
 * - Entity categories for editor grouping
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

import type { EntityDefinition } from '../types/entities'

/**
 * Registration source for tracking where an entity came from
 */
export type EntitySource = 'built-in' | 'pack' | 'firebase' | 'editor'

/**
 * Priority levels for registration (higher = overrides lower)
 */
export const ENTITY_PRIORITY = {
  BUILT_IN: 0,
  FIREBASE: 10,
  PACK: 20,
  EDITOR: 30,
} as const

/**
 * Entity category for editor grouping
 */
export type EntityCategory = 'enemy' | 'collectible' | 'trigger' | 'hazard' | 'decoration'

/**
 * Registered entity entry with metadata
 */
export interface RegisteredEntity {
  definition: EntityDefinition
  source: EntitySource
  priority: number
  category: EntityCategory
  packId?: string
}

/**
 * EntityRegistry class - manages entity definition registration and lookup
 */
class EntityRegistryClass {
  private entities: Map<string, RegisteredEntity> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Register an entity definition with the given source and priority
   */
  register(
    definition: EntityDefinition,
    category: EntityCategory,
    source: EntitySource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ENTITY_PRIORITY[source.toUpperCase().replaceAll('-', '_') as keyof typeof ENTITY_PRIORITY] ?? 0
    
    const existing = this.entities.get(definition.id)
    
    // Only override if new registration has higher or equal priority
    if (!existing || effectivePriority >= existing.priority) {
      this.entities.set(definition.id, {
        definition,
        source,
        priority: effectivePriority,
        category,
        packId,
      })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple entity definitions at once
   */
  registerAll(
    definitions: Array<{ definition: EntityDefinition; category: EntityCategory }>,
    source: EntitySource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    definitions.forEach(({ definition, category }) => 
      this.register(definition, category, source, priority, packId)
    )
  }

  /**
   * Unregister an entity by ID
   */
  unregister(entityId: string): boolean {
    const deleted = this.entities.delete(entityId)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  /**
   * Unregister all entities from a specific pack
   */
  unregisterPack(packId: string): void {
    const toDelete: string[] = []
    this.entities.forEach((entry, id) => {
      if (entry.packId === packId) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.entities.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Unregister all entities from a specific source
   */
  unregisterSource(source: EntitySource): void {
    const toDelete: string[] = []
    this.entities.forEach((entry, id) => {
      if (entry.source === source) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.entities.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Get an entity definition by ID
   */
  get(entityId: string): EntityDefinition | undefined {
    return this.entities.get(entityId)?.definition
  }

  /**
   * Get registered entity entry with metadata
   */
  getEntry(entityId: string): RegisteredEntity | undefined {
    return this.entities.get(entityId)
  }

  /**
   * Check if an entity is registered
   */
  has(entityId: string): boolean {
    return this.entities.has(entityId)
  }

  /**
   * Get all entity IDs
   */
  getIds(): string[] {
    return Array.from(this.entities.keys())
  }

  /**
   * Get all entity definitions
   */
  getAll(): EntityDefinition[] {
    return Array.from(this.entities.values()).map(entry => entry.definition)
  }

  /**
   * Get all registered entries with metadata
   */
  getAllEntries(): RegisteredEntity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Get entities filtered by category
   */
  getByCategory(category: EntityCategory): EntityDefinition[] {
    return Array.from(this.entities.values())
      .filter(entry => entry.category === category)
      .map(entry => entry.definition)
  }

  /**
   * Get entities filtered by source
   */
  getBySource(source: EntitySource): EntityDefinition[] {
    return Array.from(this.entities.values())
      .filter(entry => entry.source === source)
      .map(entry => entry.definition)
  }

  /**
   * Get entities filtered by pack ID
   */
  getByPack(packId: string): EntityDefinition[] {
    return Array.from(this.entities.values())
      .filter(entry => entry.packId === packId)
      .map(entry => entry.definition)
  }

  /**
   * Get entries grouped by category
   */
  getGroupedByCategory(): Record<EntityCategory, EntityDefinition[]> {
    const groups: Record<EntityCategory, EntityDefinition[]> = {
      enemy: [],
      collectible: [],
      trigger: [],
      hazard: [],
      decoration: [],
    }
    
    this.entities.forEach(entry => {
      groups[entry.category].push(entry.definition)
    })
    
    return groups
  }

  /**
   * Get the count of registered entities
   */
  get size(): number {
    return this.entities.size
  }

  /**
   * Clear all registered entities
   */
  clear(): void {
    this.entities.clear()
    this.notifyListeners()
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Export singleton instance
export const entityRegistry = new EntityRegistryClass()

// Export class for testing
export { EntityRegistryClass }
