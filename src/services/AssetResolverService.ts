/**
 * AssetResolverService - Maps asset IDs/keys to URLs
 * 
 * Abstracts asset resolution so levels can reference assets by ID
 * instead of hardcoded paths. Supports:
 * - Built-in assets (public/ folder)
 * - Pack assets (blob URLs from loaded packs)
 * - Remote assets (Firebase storage URLs)
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

/**
 * Asset types supported by the resolver
 */
export type AssetType = 
  | 'background'
  | 'tile-sprite'
  | 'entity-sprite'
  | 'player-sprite'
  | 'ui-sprite'
  | 'music'
  | 'sfx'

/**
 * Asset source priority
 */
export type AssetSource = 'built-in' | 'pack' | 'firebase'

/**
 * Registered asset entry
 */
export interface RegisteredAsset {
  url: string
  source: AssetSource
  priority: number
  packId?: string
}

/**
 * Player sprite keys
 */
export type PlayerSpriteKey = 'idle' | 'run' | 'run1' | 'run2' | 'jump'

/**
 * UI sprite keys
 */
export type UISpriteKey = 'heart' | 'heart-empty' | 'coin-icon'

/**
 * Priority levels for asset registration
 */
export const ASSET_PRIORITY = {
  BUILT_IN: 0,
  FIREBASE: 10,
  PACK: 20,
} as const

/**
 * AssetResolverService class - manages asset ID to URL mapping
 */
class AssetResolverServiceClass {
  // Background assets
  private backgrounds: Map<string, RegisteredAsset> = new Map()
  
  // Tile sprite assets (keyed by tile type ID)
  private tileSprites: Map<number, RegisteredAsset> = new Map()
  
  // Entity sprite assets (keyed by entity definition ID)
  private entitySprites: Map<string, RegisteredAsset> = new Map()
  
  // Player sprite assets (keyed by sprite type: idle, run, jump, etc.)
  private playerSprites: Map<PlayerSpriteKey, RegisteredAsset> = new Map()
  
  // UI sprite assets
  private uiSprites: Map<UISpriteKey, RegisteredAsset> = new Map()
  
  // Music assets (keyed by level ID or 'default')
  private music: Map<string, RegisteredAsset> = new Map()
  
  // SFX assets (keyed by sound name: jump, coin, death, etc.)
  private sfx: Map<string, RegisteredAsset> = new Map()
  
  // Change listeners
  private listeners: Set<() => void> = new Set()

  // ============================================
  // Background Registration
  // ============================================

  /**
   * Register a background asset
   */
  registerBackground(
    levelId: string,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.backgrounds.get(levelId)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.backgrounds.set(levelId, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Get background URL for a level
   */
  getBackground(levelId: string): string | undefined {
    return this.backgrounds.get(levelId)?.url
  }

  // ============================================
  // Tile Sprite Registration
  // ============================================

  /**
   * Register a tile sprite
   */
  registerTileSprite(
    tileTypeId: number,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.tileSprites.get(tileTypeId)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.tileSprites.set(tileTypeId, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple tile sprites at once
   */
  registerTileSprites(
    sprites: Record<number, string>,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    Object.entries(sprites).forEach(([id, url]) => {
      this.registerTileSprite(Number(id), url, source, priority, packId)
    })
  }

  /**
   * Get tile sprite URL
   */
  getTileSprite(tileTypeId: number): string | undefined {
    return this.tileSprites.get(tileTypeId)?.url
  }

  // ============================================
  // Entity Sprite Registration
  // ============================================

  /**
   * Register an entity sprite
   */
  registerEntitySprite(
    entityId: string,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.entitySprites.get(entityId)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.entitySprites.set(entityId, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Get entity sprite URL
   */
  getEntitySprite(entityId: string): string | undefined {
    return this.entitySprites.get(entityId)?.url
  }

  // ============================================
  // Player Sprite Registration
  // ============================================

  /**
   * Register a player sprite
   */
  registerPlayerSprite(
    key: PlayerSpriteKey,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.playerSprites.get(key)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.playerSprites.set(key, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple player sprites at once
   */
  registerPlayerSprites(
    sprites: Partial<Record<PlayerSpriteKey, string>>,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    (Object.entries(sprites) as Array<[PlayerSpriteKey, string]>).forEach(([key, url]) => {
      if (url) {
        this.registerPlayerSprite(key, url, source, priority, packId)
      }
    })
  }

  /**
   * Get player sprite URL
   */
  getPlayerSprite(key: PlayerSpriteKey): string | undefined {
    return this.playerSprites.get(key)?.url
  }

  /**
   * Get all player sprites as an object
   */
  getAllPlayerSprites(): Partial<Record<PlayerSpriteKey, string>> {
    const sprites: Partial<Record<PlayerSpriteKey, string>> = {}
    this.playerSprites.forEach((asset, key) => {
      sprites[key] = asset.url
    })
    return sprites
  }

  // ============================================
  // UI Sprite Registration
  // ============================================

  /**
   * Register a UI sprite
   */
  registerUISprite(
    key: UISpriteKey,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.uiSprites.get(key)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.uiSprites.set(key, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Get UI sprite URL
   */
  getUISprite(key: UISpriteKey): string | undefined {
    return this.uiSprites.get(key)?.url
  }

  // ============================================
  // Music Registration
  // ============================================

  /**
   * Register music for a level
   */
  registerMusic(
    levelId: string,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.music.get(levelId)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.music.set(levelId, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Get music URL for a level
   */
  getMusic(levelId: string): string | undefined {
    return this.music.get(levelId)?.url ?? this.music.get('default')?.url
  }

  // ============================================
  // SFX Registration
  // ============================================

  /**
   * Register a sound effect
   */
  registerSfx(
    name: string,
    url: string,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    const effectivePriority = priority ?? ASSET_PRIORITY[source.toUpperCase() as keyof typeof ASSET_PRIORITY] ?? 0
    const existing = this.sfx.get(name)
    
    if (!existing || effectivePriority >= existing.priority) {
      this.sfx.set(name, { url, source, priority: effectivePriority, packId })
      this.notifyListeners()
    }
  }

  /**
   * Register multiple sound effects at once
   */
  registerSfxAll(
    sounds: Record<string, string>,
    source: AssetSource = 'built-in',
    priority?: number,
    packId?: string
  ): void {
    Object.entries(sounds).forEach(([name, url]) => {
      this.registerSfx(name, url, source, priority, packId)
    })
  }

  /**
   * Get sound effect URL
   */
  getSfx(name: string): string | undefined {
    return this.sfx.get(name)?.url
  }

  // ============================================
  // Pack Management
  // ============================================

  /**
   * Unregister all assets from a specific pack
   */
  unregisterPack(packId: string): void {
    const clearFromMap = <K, V extends { packId?: string }>(map: Map<K, V>) => {
      const toDelete: K[] = []
      map.forEach((value, key) => {
        if (value.packId === packId) {
          toDelete.push(key)
        }
      })
      toDelete.forEach(key => map.delete(key))
    }

    clearFromMap(this.backgrounds)
    clearFromMap(this.tileSprites)
    clearFromMap(this.entitySprites)
    clearFromMap(this.playerSprites)
    clearFromMap(this.uiSprites)
    clearFromMap(this.music)
    clearFromMap(this.sfx)
    
    this.notifyListeners()
  }

  /**
   * Clear all registered assets
   */
  clear(): void {
    this.backgrounds.clear()
    this.tileSprites.clear()
    this.entitySprites.clear()
    this.playerSprites.clear()
    this.uiSprites.clear()
    this.music.clear()
    this.sfx.clear()
    this.notifyListeners()
  }

  // ============================================
  // Convenience Methods
  // ============================================

  /**
   * Resolve an asset URL from a level definition
   * If the value is already a URL (starts with / or http), return it
   * Otherwise, try to resolve it as an asset ID
   */
  resolveUrl(value: string | undefined, type: AssetType, context?: string): string | undefined {
    if (!value) return undefined
    
    // Already a URL
    if (value.startsWith('/') || value.startsWith('http')) {
      return value
    }
    
    // Try to resolve as asset ID
    switch (type) {
      case 'background':
        return this.getBackground(value)
      case 'tile-sprite':
        return this.getTileSprite(Number(value))
      case 'entity-sprite':
        return this.getEntitySprite(value)
      case 'player-sprite':
        return this.getPlayerSprite(value as PlayerSpriteKey)
      case 'ui-sprite':
        return this.getUISprite(value as UISpriteKey)
      case 'music':
        return this.getMusic(context ?? value)
      case 'sfx':
        return this.getSfx(value)
      default:
        return undefined
    }
  }

  // ============================================
  // Listeners
  // ============================================

  /**
   * Subscribe to asset changes
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
export const assetResolverService = new AssetResolverServiceClass()

// Export class for testing
export { AssetResolverServiceClass }
