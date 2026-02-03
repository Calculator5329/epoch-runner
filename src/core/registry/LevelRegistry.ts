/**
 * LevelRegistry - Dynamic level registration system
 * 
 * Replaces the static levelRegistry with a dynamic registry that supports:
 * - Runtime registration for custom packs
 * - Priority-based overriding (pack levels can override built-in)
 * - Registration sources (built-in, pack, firebase)
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

import type { LevelDefinition } from '../../levels/types'

/**
 * Registration source for tracking where a level came from
 */
export type LevelSource = 'built-in' | 'pack' | 'firebase' | 'editor'

/**
 * Priority levels for registration (higher = overrides lower)
 */
export const LEVEL_PRIORITY = {
  BUILT_IN: 0,
  FIREBASE: 10,
  PACK: 20,
  EDITOR: 30,
} as const

/**
 * Registered level entry with metadata
 */
export interface RegisteredLevel {
  definition: LevelDefinition
  source: LevelSource
  priority: number
  packId?: string
}

/**
 * LevelRegistry class - manages level registration and lookup
 */
class LevelRegistryClass {
  private levels: Map<string, RegisteredLevel> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Register a level with the given source and priority
   */
  register(
    definition: LevelDefinition,
    source: LevelSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? LEVEL_PRIORITY[source.toUpperCase().replace('-', '_') as keyof typeof LEVEL_PRIORITY] ?? 0
    
    const existing = this.levels.get(definition.id)
    
    // Only override if new registration has higher or equal priority
    if (!existing || effectivePriority >= existing.priority) {
      this.levels.set(definition.id, {
        definition,
        source,
        priority: effectivePriority,
        packId,
      })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple levels at once
   */
  registerAll(
    definitions: LevelDefinition[],
    source: LevelSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    definitions.forEach(def => this.register(def, source, priority, packId))
  }

  /**
   * Unregister a level by ID
   */
  unregister(levelId: string): boolean {
    const deleted = this.levels.delete(levelId)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  /**
   * Unregister all levels from a specific pack
   */
  unregisterPack(packId: string): void {
    const toDelete: string[] = []
    this.levels.forEach((entry, id) => {
      if (entry.packId === packId) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.levels.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Unregister all levels from a specific source
   */
  unregisterSource(source: LevelSource): void {
    const toDelete: string[] = []
    this.levels.forEach((entry, id) => {
      if (entry.source === source) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.levels.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Get a level definition by ID
   */
  get(levelId: string): LevelDefinition | undefined {
    return this.levels.get(levelId)?.definition
  }

  /**
   * Get registered level entry with metadata
   */
  getEntry(levelId: string): RegisteredLevel | undefined {
    return this.levels.get(levelId)
  }

  /**
   * Check if a level is registered
   */
  has(levelId: string): boolean {
    return this.levels.has(levelId)
  }

  /**
   * Get all level IDs
   */
  getIds(): string[] {
    return Array.from(this.levels.keys())
  }

  /**
   * Get all level definitions
   */
  getAll(): LevelDefinition[] {
    return Array.from(this.levels.values()).map(entry => entry.definition)
  }

  /**
   * Get all registered entries with metadata
   */
  getAllEntries(): RegisteredLevel[] {
    return Array.from(this.levels.values())
  }

  /**
   * Get levels filtered by source
   */
  getBySource(source: LevelSource): LevelDefinition[] {
    return Array.from(this.levels.values())
      .filter(entry => entry.source === source)
      .map(entry => entry.definition)
  }

  /**
   * Get levels filtered by pack ID
   */
  getByPack(packId: string): LevelDefinition[] {
    return Array.from(this.levels.values())
      .filter(entry => entry.packId === packId)
      .map(entry => entry.definition)
  }

  /**
   * Get the count of registered levels
   */
  get size(): number {
    return this.levels.size
  }

  /**
   * Clear all registered levels
   */
  clear(): void {
    this.levels.clear()
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
export const levelRegistry = new LevelRegistryClass()

// Export class for testing
export { LevelRegistryClass }
