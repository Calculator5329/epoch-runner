/**
 * Theme Registry - Dynamic theme registration system
 */

import type { ThemeDefinition } from './types'

/**
 * Theme source for tracking where a theme came from
 */
export type ThemeSource = 'built-in' | 'pack' | 'firebase' | 'user'

/**
 * Priority levels for theme registration
 */
export const THEME_PRIORITY = {
  BUILT_IN: 0,
  FIREBASE: 10,
  PACK: 20,
  USER: 30,
} as const

/**
 * Registered theme entry with metadata
 */
export interface RegisteredTheme {
  definition: ThemeDefinition
  source: ThemeSource
  priority: number
  packId?: string
}

/**
 * ThemeRegistry class - manages theme registration and lookup
 */
class ThemeRegistryClass {
  private themes: Map<string, RegisteredTheme> = new Map()
  private listeners: Set<() => void> = new Set()

  /**
   * Register a theme
   */
  register(
    definition: ThemeDefinition,
    source: ThemeSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? THEME_PRIORITY[source.toUpperCase() as keyof typeof THEME_PRIORITY] ?? 0
    
    const existing = this.themes.get(definition.id)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.themes.set(definition.id, {
        definition,
        source,
        priority: effectivePriority,
        packId,
      })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple themes at once
   */
  registerAll(
    definitions: ThemeDefinition[],
    source: ThemeSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    definitions.forEach(def => this.register(def, source, priority, packId))
  }

  /**
   * Unregister a theme by ID
   */
  unregister(themeId: string): boolean {
    const deleted = this.themes.delete(themeId)
    if (deleted) {
      this.notifyListeners()
    }
    return deleted
  }

  /**
   * Unregister all themes from a specific pack
   */
  unregisterPack(packId: string): void {
    const toDelete: string[] = []
    this.themes.forEach((entry, id) => {
      if (entry.packId === packId) {
        toDelete.push(id)
      }
    })
    toDelete.forEach(id => this.themes.delete(id))
    if (toDelete.length > 0) {
      this.notifyListeners()
    }
  }

  /**
   * Get a theme by ID
   */
  get(themeId: string): ThemeDefinition | undefined {
    return this.themes.get(themeId)?.definition
  }

  /**
   * Get registered theme entry with metadata
   */
  getEntry(themeId: string): RegisteredTheme | undefined {
    return this.themes.get(themeId)
  }

  /**
   * Check if a theme is registered
   */
  has(themeId: string): boolean {
    return this.themes.has(themeId)
  }

  /**
   * Get all theme IDs
   */
  getIds(): string[] {
    return Array.from(this.themes.keys())
  }

  /**
   * Get all theme definitions
   */
  getAll(): ThemeDefinition[] {
    return Array.from(this.themes.values()).map(entry => entry.definition)
  }

  /**
   * Get all registered entries with metadata
   */
  getAllEntries(): RegisteredTheme[] {
    return Array.from(this.themes.values())
  }

  /**
   * Get themes by source
   */
  getBySource(source: ThemeSource): ThemeDefinition[] {
    return Array.from(this.themes.values())
      .filter(entry => entry.source === source)
      .map(entry => entry.definition)
  }

  /**
   * Get the count of registered themes
   */
  get size(): number {
    return this.themes.size
  }

  /**
   * Clear all registered themes
   */
  clear(): void {
    this.themes.clear()
    this.notifyListeners()
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Export singleton instance
export const themeRegistry = new ThemeRegistryClass()

// Export class for testing
export { ThemeRegistryClass }
