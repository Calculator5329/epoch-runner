/**
 * TileRegistry - Dynamic tile type registration system
 * 
 * Replaces the static TILE_TYPES with a dynamic registry that supports:
 * - Runtime registration for custom tile types
 * - Priority-based overriding (pack tiles can override built-in)
 * - Tile categories for editor grouping
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

import type { TileType } from '../types/shapes/tile-types'

/**
 * Registration source for tracking where a tile type came from
 */
export type TileSource = 'built-in' | 'pack' | 'firebase' | 'editor'

/**
 * Priority levels for registration (higher = overrides lower)
 */
export const TILE_PRIORITY = {
  BUILT_IN: 0,
  FIREBASE: 10,
  PACK: 20,
  EDITOR: 30,
} as const

/**
 * Registered tile entry with metadata
 */
export interface RegisteredTile {
  tileType: TileType
  source: TileSource
  priority: number
  packId?: string
}

/**
 * TileRegistry class - manages tile type registration and lookup
 * Uses number as key since TileType.id is a number
 */
class TileRegistryClass {
  private tiles: Map<number, RegisteredTile> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Register a tile type with the given source and priority
   */
  register(
    tileType: TileType,
    source: TileSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? TILE_PRIORITY[source.toUpperCase().replaceAll('-', '_') as keyof typeof TILE_PRIORITY] ?? 0
    
    const existing = this.tiles.get(tileType.id)
    
    // Only override if new registration has higher or equal priority
    if (!existing || effectivePriority >= existing.priority) {
      this.tiles.set(tileType.id, {
        tileType,
        source,
        priority: effectivePriority,
        packId,
      })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple tile types at once
   */
  registerAll(
    tileTypes: TileType[],
    source: TileSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    tileTypes.forEach(tile => this.register(tile, source, priority, packId))
  }

  /**
   * Register from a record (for backwards compatibility with TILE_TYPES)
   */
  registerFromRecord(
    record: Record<number, TileType>,
    source: TileSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    Object.values(record).forEach(tile => this.register(tile, source, priority, packId))
  }

  /**
   * Unregister a tile type by ID
   */
  unregister(tileId: number): boolean {
    const deleted = this.tiles.delete(tileId)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  /**
   * Unregister all tiles from a specific pack
   */
  unregisterPack(packId: string): void {
    const toDelete: number[] = []
    this.tiles.forEach((entry, id) => {
      if (entry.packId === packId) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.tiles.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Unregister all tiles from a specific source
   */
  unregisterSource(source: TileSource): void {
    const toDelete: number[] = []
    this.tiles.forEach((entry, id) => {
      if (entry.source === source) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.tiles.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Get a tile type by ID
   */
  get(tileId: number): TileType | undefined {
    return this.tiles.get(tileId)?.tileType
  }

  /**
   * Get registered tile entry with metadata
   */
  getEntry(tileId: number): RegisteredTile | undefined {
    return this.tiles.get(tileId)
  }

  /**
   * Check if a tile type is registered
   */
  has(tileId: number): boolean {
    return this.tiles.has(tileId)
  }

  /**
   * Get all tile type IDs
   */
  getIds(): number[] {
    return Array.from(this.tiles.keys())
  }

  /**
   * Get all tile types
   */
  getAll(): TileType[] {
    return Array.from(this.tiles.values()).map(entry => entry.tileType)
  }

  /**
   * Get all registered entries with metadata
   */
  getAllEntries(): RegisteredTile[] {
    return Array.from(this.tiles.values())
  }

  /**
   * Get tiles filtered by category
   */
  getByCategory(category: TileType['category']): TileType[] {
    return Array.from(this.tiles.values())
      .filter(entry => entry.tileType.category === category)
      .map(entry => entry.tileType)
  }

  /**
   * Get tiles filtered by source
   */
  getBySource(source: TileSource): TileType[] {
    return Array.from(this.tiles.values())
      .filter(entry => entry.source === source)
      .map(entry => entry.tileType)
  }

  /**
   * Get tiles filtered by pack ID
   */
  getByPack(packId: string): TileType[] {
    return Array.from(this.tiles.values())
      .filter(entry => entry.packId === packId)
      .map(entry => entry.tileType)
  }

  /**
   * Get tiles grouped by category
   */
  getGroupedByCategory(): Record<TileType['category'], TileType[]> {
    const groups: Record<TileType['category'], TileType[]> = {
      solid: [],
      hazard: [],
      pickup: [],
      trigger: [],
      decoration: [],
    }
    
    this.tiles.forEach(entry => {
      groups[entry.tileType.category].push(entry.tileType)
    })
    
    return groups
  }

  /**
   * Convert to record format (for backwards compatibility)
   */
  toRecord(): Record<number, TileType> {
    const record = {} as Record<number, TileType>
    this.tiles.forEach((entry, id) => {
      record[id] = entry.tileType
    })
    return record
  }

  /**
   * Get the count of registered tiles
   */
  get size(): number {
    return this.tiles.size
  }

  /**
   * Clear all registered tiles
   */
  clear(): void {
    this.tiles.clear()
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
export const tileRegistry = new TileRegistryClass()

// Export class for testing
export { TileRegistryClass }
