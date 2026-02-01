import { makeAutoObservable, runInAction } from 'mobx'
import { TileTypeId } from '../core/types/shapes'

/**
 * Polygon hitbox definition with normalized coordinates (0-1)
 */
export interface Polygon {
  points: Array<{ x: number; y: number }>
}

/**
 * Single rectangle in normalized coordinates (0-1)
 */
export interface HitboxRect {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Hitbox definition - can be auto-generated from sprite or custom polygon
 */
export interface HitboxDefinition {
  type: 'auto' | 'rect' | 'polygon' | 'compound'
  // For rect type
  x?: number
  y?: number
  w?: number
  h?: number
  // For polygon type
  points?: Array<{ x: number; y: number }>
  // For compound type (multiple rectangles)
  rects?: HitboxRect[]
}

/**
 * Pack manifest format - describes contents of a level pack zip
 */
export interface PackManifest {
  formatVersion: 1
  name: string
  author?: string
  description?: string

  sprites: {
    tiles: Record<string, string>  // TileTypeId name -> relative path in zip
    entities?: Record<string, string>  // Entity definition ID -> relative path in zip
    player?: {
      idle?: string
      run?: string       // Legacy single run sprite
      run1?: string      // Run animation frame 1
      run2?: string      // Run animation frame 2
      jump?: string
    }
    background?: string
    ui?: Record<string, string>
  }

  audio?: {
    music?: string
    sfx?: Record<string, string>  // 'jump' | 'coin' | 'death' | 'goal' -> path
  }

  hitboxes?: string  // Path to hitboxes.json
}

/**
 * Loaded asset data for runtime use
 */
export interface LoadedAssets {
  // Sprite images (HTMLImageElement for efficient canvas drawing)
  tileSprites: Map<TileTypeId, HTMLImageElement>
  entitySprites: Map<string, HTMLImageElement>  // Entity definition ID -> sprite
  playerSprites: {
    idle?: HTMLImageElement
    run?: HTMLImageElement       // Legacy single run sprite
    run1?: HTMLImageElement      // Run animation frame 1
    run2?: HTMLImageElement      // Run animation frame 2
    jump?: HTMLImageElement
  }
  background?: HTMLImageElement
  uiSprites: Map<string, HTMLImageElement>

  // Audio blob URLs
  music?: string
  sfx: Map<string, string>

  // Hitbox definitions
  hitboxes: Map<string, HitboxDefinition>
}

/**
 * AssetStore - MobX store for managing loaded custom assets
 * 
 * Handles sprite images, audio, and hitbox definitions loaded from level packs.
 * Falls back to procedural rendering when custom assets are not available.
 */
export class AssetStore {
  // ============================================
  // Observable State
  // ============================================

  /** Whether a custom pack is currently loaded */
  isPackLoaded = false

  /** Pack metadata */
  packName?: string
  packAuthor?: string
  packDescription?: string

  /** Loaded tile sprites by TileTypeId */
  tileSprites: Map<TileTypeId, HTMLImageElement> = new Map()

  /** Player sprite variants */
  playerSprites: {
    idle?: HTMLImageElement
    run?: HTMLImageElement      // Legacy single run sprite
    run1?: HTMLImageElement     // Run animation frame 1
    run2?: HTMLImageElement     // Run animation frame 2
    jump?: HTMLImageElement
  } = {}

  /** Level background image */
  background?: HTMLImageElement

  /** UI element sprites (hearts, coin icon, etc.) */
  uiSprites: Map<string, HTMLImageElement> = new Map()

  /** Entity sprites by definition ID (enemies) */
  entitySprites: Map<string, HTMLImageElement> = new Map()

  /** Trigger/special tile sprites (checkpoint, goal, power-ups) */
  triggerSprites: Map<TileTypeId, HTMLImageElement> = new Map()

  /** Background music blob URL */
  music?: string

  /** Sound effect blob URLs */
  sfx: Map<string, string> = new Map()

  /** Custom hitbox definitions */
  hitboxes: Map<string, HitboxDefinition> = new Map()

  /** Raw blob URLs for cleanup */
  private blobUrls: string[] = []

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Whether any custom assets are loaded
   */
  get hasCustomAssets(): boolean {
    return this.tileSprites.size > 0 ||
      Object.keys(this.playerSprites).length > 0 ||
      !!this.background ||
      this.uiSprites.size > 0 ||
      this.entitySprites.size > 0 ||
      this.triggerSprites.size > 0 ||
      !!this.music ||
      this.sfx.size > 0
  }

  /**
   * Whether custom tile sprite exists for a tile type
   */
  hasTileSprite(tileTypeId: TileTypeId): boolean {
    return this.tileSprites.has(tileTypeId)
  }

  /**
   * Get tile sprite if available
   */
  getTileSprite(tileTypeId: TileTypeId): HTMLImageElement | undefined {
    return this.tileSprites.get(tileTypeId)
  }

  /**
   * Get hitbox definition for a key (e.g., 'player', tile type)
   */
  getHitbox(key: string): HitboxDefinition | undefined {
    return this.hitboxes.get(key)
  }

  /**
   * Set a hitbox definition
   */
  setHitbox(key: string, hitbox: HitboxDefinition): void {
    this.hitboxes.set(key, hitbox)
  }

  /**
   * Get entity sprite by definition ID
   */
  getEntitySprite(definitionId: string): HTMLImageElement | undefined {
    return this.entitySprites.get(definitionId)
  }

  /**
   * Check if entity has custom sprite
   */
  hasEntitySprite(definitionId: string): boolean {
    return this.entitySprites.has(definitionId)
  }

  /**
   * Get trigger/special tile sprite (checkpoint, goal, power-ups)
   */
  getTriggerSprite(tileTypeId: TileTypeId): HTMLImageElement | undefined {
    return this.triggerSprites.get(tileTypeId)
  }

  /**
   * Check if trigger tile has custom sprite
   */
  hasTriggerSprite(tileTypeId: TileTypeId): boolean {
    return this.triggerSprites.has(tileTypeId)
  }

  // ============================================
  // Actions
  // ============================================

  /**
   * Set pack metadata
   */
  setPackMetadata(name: string, author?: string, description?: string): void {
    this.packName = name
    this.packAuthor = author
    this.packDescription = description
    this.isPackLoaded = true
  }

  /**
   * Add a tile sprite
   */
  addTileSprite(tileTypeId: TileTypeId, image: HTMLImageElement): void {
    this.tileSprites.set(tileTypeId, image)
  }

  /**
   * Remove a tile sprite
   */
  removeTileSprite(tileTypeId: TileTypeId): void {
    this.tileSprites.delete(tileTypeId)
  }

  /**
   * Set player sprites
   */
  setPlayerSprites(sprites: {
    idle?: HTMLImageElement
    run?: HTMLImageElement
    run1?: HTMLImageElement
    run2?: HTMLImageElement
    jump?: HTMLImageElement
  }): void {
    this.playerSprites = sprites
  }

  /**
   * Set background image
   */
  setBackground(image: HTMLImageElement): void {
    this.background = image
  }

  /**
   * Add a UI sprite
   */
  addUISprite(name: string, image: HTMLImageElement): void {
    this.uiSprites.set(name, image)
  }

  /**
   * Add an entity sprite
   */
  addEntitySprite(definitionId: string, image: HTMLImageElement): void {
    this.entitySprites.set(definitionId, image)
  }

  /**
   * Remove an entity sprite
   */
  removeEntitySprite(definitionId: string): void {
    this.entitySprites.delete(definitionId)
  }

  /**
   * Add a trigger sprite (checkpoint, goal, power-ups)
   */
  addTriggerSprite(tileTypeId: TileTypeId, image: HTMLImageElement): void {
    this.triggerSprites.set(tileTypeId, image)
  }

  /**
   * Remove a trigger sprite
   */
  removeTriggerSprite(tileTypeId: TileTypeId): void {
    this.triggerSprites.delete(tileTypeId)
  }

  /**
   * Set music blob URL
   */
  setMusic(url: string): void {
    this.music = url
    this.blobUrls.push(url)
  }

  /**
   * Add a sound effect
   */
  addSfx(name: string, url: string): void {
    this.sfx.set(name, url)
    this.blobUrls.push(url)
  }

  /**
   * Set hitbox definitions
   */
  setHitboxes(hitboxes: Map<string, HitboxDefinition>): void {
    this.hitboxes = hitboxes
  }

  /**
   * Add a hitbox definition
   */
  addHitbox(key: string, hitbox: HitboxDefinition): void {
    this.hitboxes.set(key, hitbox)
  }

  /**
   * Track a blob URL for cleanup
   */
  trackBlobUrl(url: string): void {
    this.blobUrls.push(url)
  }

  /**
   * Clear all loaded assets and revoke blob URLs
   */
  clear(): void {
    // Revoke all blob URLs to free memory
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url)
    }

    runInAction(() => {
      this.isPackLoaded = false
      this.packName = undefined
      this.packAuthor = undefined
      this.packDescription = undefined
      this.tileSprites.clear()
      this.playerSprites = {}
      this.background = undefined
      this.uiSprites.clear()
      this.entitySprites.clear()
      this.triggerSprites.clear()
      this.music = undefined
      this.sfx.clear()
      this.hitboxes.clear()
      this.blobUrls = []
    })
  }

  /**
   * Load all assets from extracted pack data
   */
  loadAssets(assets: LoadedAssets, metadata: { name: string; author?: string; description?: string }): void {
    runInAction(() => {
      this.clear()

      this.packName = metadata.name
      this.packAuthor = metadata.author
      this.packDescription = metadata.description
      this.isPackLoaded = true

      // Copy tile sprites
      for (const [key, value] of assets.tileSprites) {
        this.tileSprites.set(key, value)
      }

      // Copy entity sprites
      for (const [key, value] of assets.entitySprites) {
        this.entitySprites.set(key, value)
      }

      // Copy player sprites
      this.playerSprites = { ...assets.playerSprites }

      // Copy background
      this.background = assets.background

      // Copy UI sprites
      for (const [key, value] of assets.uiSprites) {
        this.uiSprites.set(key, value)
      }

      // Copy audio
      if (assets.music) {
        this.music = assets.music
        this.blobUrls.push(assets.music)
      }

      for (const [key, value] of assets.sfx) {
        this.sfx.set(key, value)
        this.blobUrls.push(value)
      }

      // Copy hitboxes
      for (const [key, value] of assets.hitboxes) {
        this.hitboxes.set(key, value)
      }
    })
  }
}
