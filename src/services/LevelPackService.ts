import JSZip from 'jszip'
import { TileTypeId, TILE_TYPES } from '../core/types/shapes'
import type { LevelDefinition, LevelJSON } from '../levels/types'
import { levelToJSON, jsonToLevel, validateLevel } from '../levels/types'
import type { 
  PackManifest, 
  LoadedAssets, 
  HitboxDefinition 
} from '../stores/AssetStore'

/**
 * Validation result from pack validation
 */
export interface PackValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Result of extracting a level pack
 */
export interface ExtractedPack {
  level: LevelDefinition
  manifest: PackManifest
  assets: LoadedAssets
}

/**
 * LevelPackService - Handles creation and extraction of level pack zip files
 * 
 * Level packs are zip files containing:
 * - manifest.json: Pack metadata and asset mappings
 * - level.json: Level definition
 * - sprites/: Custom sprite images
 * - audio/: Music and sound effects
 * - hitboxes/: Custom collision polygons
 * - config/: Parameter overrides (future)
 */
class LevelPackService {
  /**
   * Create a level pack zip file from level definition and assets
   */
  async createPack(
    level: LevelDefinition,
    assets: {
      tileSprites?: Map<TileTypeId, Blob>
      playerSprites?: { idle?: Blob; run?: Blob; run1?: Blob; run2?: Blob; jump?: Blob }
      background?: Blob
      uiSprites?: Map<string, Blob>
      music?: Blob
      sfx?: Map<string, Blob>
      hitboxes?: Map<string, HitboxDefinition>
    },
    metadata: {
      name: string
      author?: string
      description?: string
    }
  ): Promise<Blob> {
    const zip = new JSZip()

    // Build manifest
    const manifest: PackManifest = {
      formatVersion: 1,
      name: metadata.name,
      author: metadata.author,
      description: metadata.description,
      sprites: {
        tiles: {},
      },
    }

    // Add level.json
    const levelJson = levelToJSON(level)
    zip.file('level.json', JSON.stringify(levelJson, null, 2))

    // Add tile sprites
    if (assets.tileSprites) {
      for (const [tileTypeId, blob] of assets.tileSprites) {
        const tileType = TILE_TYPES[tileTypeId]
        if (tileType) {
          const filename = `sprites/tiles/${tileType.name.toLowerCase().replace(/\s+/g, '_')}.png`
          zip.file(filename, blob)
          manifest.sprites.tiles[tileType.name] = filename
        }
      }
    }

    // Add player sprites
    if (assets.playerSprites) {
      manifest.sprites.player = {}
      if (assets.playerSprites.idle) {
        zip.file('sprites/player/idle.png', assets.playerSprites.idle)
        manifest.sprites.player.idle = 'sprites/player/idle.png'
      }
      if (assets.playerSprites.run) {
        zip.file('sprites/player/run.png', assets.playerSprites.run)
        manifest.sprites.player.run = 'sprites/player/run.png'
      }
      if (assets.playerSprites.run1) {
        zip.file('sprites/player/run1.png', assets.playerSprites.run1)
        manifest.sprites.player.run1 = 'sprites/player/run1.png'
      }
      if (assets.playerSprites.run2) {
        zip.file('sprites/player/run2.png', assets.playerSprites.run2)
        manifest.sprites.player.run2 = 'sprites/player/run2.png'
      }
      if (assets.playerSprites.jump) {
        zip.file('sprites/player/jump.png', assets.playerSprites.jump)
        manifest.sprites.player.jump = 'sprites/player/jump.png'
      }
    }

    // Add background
    if (assets.background) {
      zip.file('sprites/background.png', assets.background)
      manifest.sprites.background = 'sprites/background.png'
    }

    // Add UI sprites
    if (assets.uiSprites) {
      manifest.sprites.ui = {}
      for (const [name, blob] of assets.uiSprites) {
        const filename = `sprites/ui/${name}.png`
        zip.file(filename, blob)
        manifest.sprites.ui[name] = filename
      }
    }

    // Add music
    if (assets.music) {
      zip.file('audio/music.mp3', assets.music)
      manifest.audio = { music: 'audio/music.mp3' }
    }

    // Add sound effects
    if (assets.sfx) {
      if (!manifest.audio) manifest.audio = {}
      manifest.audio.sfx = {}
      for (const [name, blob] of assets.sfx) {
        const filename = `audio/sfx/${name}.mp3`
        zip.file(filename, blob)
        manifest.audio.sfx[name] = filename
      }
    }

    // Add hitboxes
    if (assets.hitboxes && assets.hitboxes.size > 0) {
      const hitboxData: Record<string, HitboxDefinition> = {}
      for (const [key, hitbox] of assets.hitboxes) {
        hitboxData[key] = hitbox
      }
      zip.file('hitboxes/hitboxes.json', JSON.stringify(hitboxData, null, 2))
      manifest.hitboxes = 'hitboxes/hitboxes.json'
    }

    // Add manifest
    zip.file('manifest.json', JSON.stringify(manifest, null, 2))

    // Generate zip blob
    return await zip.generateAsync({ type: 'blob' })
  }

  /**
   * Extract and load a level pack from a zip file
   */
  async extractPack(file: File): Promise<ExtractedPack> {
    const zip = await JSZip.loadAsync(file)

    // Validate pack structure
    const validation = await this.validatePack(zip)
    if (!validation.valid) {
      throw new Error(`Invalid pack: ${validation.errors.join(', ')}`)
    }

    // Load manifest
    const manifestFile = zip.file('manifest.json')
    if (!manifestFile) {
      throw new Error('Missing manifest.json')
    }
    const manifestText = await manifestFile.async('string')
    const manifest: PackManifest = JSON.parse(manifestText)

    // Load level
    const levelFile = zip.file('level.json')
    if (!levelFile) {
      throw new Error('Missing level.json')
    }
    const levelText = await levelFile.async('string')
    const levelJson: LevelJSON = JSON.parse(levelText)
    const level = jsonToLevel(levelJson)

    // Validate level
    const levelErrors = validateLevel(level)
    if (levelErrors.length > 0) {
      throw new Error(`Invalid level: ${levelErrors.join(', ')}`)
    }

    // Load assets
    const assets = await this.loadAssets(zip, manifest)

    return { level, manifest, assets }
  }

  /**
   * Validate pack structure without fully loading
   */
  async validatePack(zip: JSZip): Promise<PackValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required files
    if (!zip.file('manifest.json')) {
      errors.push('Missing manifest.json')
    }
    if (!zip.file('level.json')) {
      errors.push('Missing level.json')
    }

    // Validate manifest if present
    const manifestFile = zip.file('manifest.json')
    if (manifestFile) {
      try {
        const text = await manifestFile.async('string')
        const manifest: PackManifest = JSON.parse(text)

        if (manifest.formatVersion !== 1) {
          errors.push(`Unsupported format version: ${manifest.formatVersion}`)
        }
        if (!manifest.name) {
          errors.push('Manifest missing name')
        }
        if (!manifest.sprites) {
          errors.push('Manifest missing sprites section')
        }

        // Check that referenced files exist
        if (manifest.sprites?.tiles) {
          for (const [tileName, path] of Object.entries(manifest.sprites.tiles)) {
            if (!zip.file(path)) {
              warnings.push(`Missing tile sprite: ${tileName} (${path})`)
            }
          }
        }

        if (manifest.sprites?.player) {
          for (const [variant, path] of Object.entries(manifest.sprites.player)) {
            if (path && !zip.file(path)) {
              warnings.push(`Missing player sprite: ${variant} (${path})`)
            }
          }
        }

        if (manifest.sprites?.background && !zip.file(manifest.sprites.background)) {
          warnings.push(`Missing background: ${manifest.sprites.background}`)
        }

        if (manifest.audio?.music && !zip.file(manifest.audio.music)) {
          warnings.push(`Missing music: ${manifest.audio.music}`)
        }

        if (manifest.audio?.sfx) {
          for (const [sfxName, path] of Object.entries(manifest.audio.sfx)) {
            if (!zip.file(path)) {
              warnings.push(`Missing SFX: ${sfxName} (${path})`)
            }
          }
        }
      } catch (e) {
        errors.push(`Invalid manifest.json: ${e instanceof Error ? e.message : 'Parse error'}`)
      }
    }

    // Validate level if present
    const levelFile = zip.file('level.json')
    if (levelFile) {
      try {
        const text = await levelFile.async('string')
        const levelJson: LevelJSON = JSON.parse(text)
        const level = jsonToLevel(levelJson)
        const levelErrors = validateLevel(level)

        if (levelErrors.length > 0) {
          errors.push(...levelErrors.map(e => `Level: ${e}`))
        }
      } catch (e) {
        errors.push(`Invalid level.json: ${e instanceof Error ? e.message : 'Parse error'}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Load all assets from a zip file
   */
  private async loadAssets(zip: JSZip, manifest: PackManifest): Promise<LoadedAssets> {
    const assets: LoadedAssets = {
      tileSprites: new Map(),
      playerSprites: {},
      uiSprites: new Map(),
      sfx: new Map(),
      hitboxes: new Map(),
    }

    // Load tile sprites
    if (manifest.sprites?.tiles) {
      for (const [tileName, path] of Object.entries(manifest.sprites.tiles)) {
        const file = zip.file(path)
        if (file) {
          const blob = await file.async('blob')
          const image = await this.loadImage(blob)
          
          // Find TileTypeId by name
          const tileTypeId = this.findTileTypeIdByName(tileName)
          if (tileTypeId !== undefined) {
            assets.tileSprites.set(tileTypeId, image)
          }
        }
      }
    }

    // Load player sprites
    if (manifest.sprites?.player) {
      if (manifest.sprites.player.idle) {
        const file = zip.file(manifest.sprites.player.idle)
        if (file) {
          const blob = await file.async('blob')
          assets.playerSprites.idle = await this.loadImage(blob)
        }
      }
      if (manifest.sprites.player.run) {
        const file = zip.file(manifest.sprites.player.run)
        if (file) {
          const blob = await file.async('blob')
          assets.playerSprites.run = await this.loadImage(blob)
        }
      }
      if (manifest.sprites.player.run1) {
        const file = zip.file(manifest.sprites.player.run1)
        if (file) {
          const blob = await file.async('blob')
          assets.playerSprites.run1 = await this.loadImage(blob)
        }
      }
      if (manifest.sprites.player.run2) {
        const file = zip.file(manifest.sprites.player.run2)
        if (file) {
          const blob = await file.async('blob')
          assets.playerSprites.run2 = await this.loadImage(blob)
        }
      }
      if (manifest.sprites.player.jump) {
        const file = zip.file(manifest.sprites.player.jump)
        if (file) {
          const blob = await file.async('blob')
          assets.playerSprites.jump = await this.loadImage(blob)
        }
      }
    }

    // Load background
    if (manifest.sprites?.background) {
      const file = zip.file(manifest.sprites.background)
      if (file) {
        const blob = await file.async('blob')
        assets.background = await this.loadImage(blob)
      }
    }

    // Load UI sprites
    if (manifest.sprites?.ui) {
      for (const [name, path] of Object.entries(manifest.sprites.ui)) {
        const file = zip.file(path)
        if (file) {
          const blob = await file.async('blob')
          const image = await this.loadImage(blob)
          assets.uiSprites.set(name, image)
        }
      }
    }

    // Load music
    if (manifest.audio?.music) {
      const file = zip.file(manifest.audio.music)
      if (file) {
        const blob = await file.async('blob')
        assets.music = URL.createObjectURL(blob)
      }
    }

    // Load sound effects
    if (manifest.audio?.sfx) {
      for (const [name, path] of Object.entries(manifest.audio.sfx)) {
        const file = zip.file(path)
        if (file) {
          const blob = await file.async('blob')
          assets.sfx.set(name, URL.createObjectURL(blob))
        }
      }
    }

    // Load hitboxes
    const hitboxPath = manifest.hitboxes || 'hitboxes/hitboxes.json'
    const hitboxFile = zip.file(hitboxPath)
    if (hitboxFile) {
      try {
        const text = await hitboxFile.async('string')
        const hitboxData: Record<string, HitboxDefinition> = JSON.parse(text)
        for (const [key, hitbox] of Object.entries(hitboxData)) {
          assets.hitboxes.set(key, hitbox)
        }
      } catch {
        // Hitboxes are optional, ignore errors
      }
    }

    return assets
  }

  /**
   * Load an image from a blob
   */
  private loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob)
      const img = new Image()

      img.onload = () => {
        // Don't revoke URL here - we need it for canvas drawing
        // It will be revoked when AssetStore.clear() is called
        resolve(img)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Find TileTypeId by tile type name
   */
  private findTileTypeIdByName(name: string): TileTypeId | undefined {
    const normalizedName = name.toLowerCase().replace(/[_\s]+/g, '')
    
    for (const [idStr, tileType] of Object.entries(TILE_TYPES)) {
      const tileName = tileType.name.toLowerCase().replace(/[_\s]+/g, '')
      if (tileName === normalizedName) {
        return Number(idStr) as TileTypeId
      }
    }

    return undefined
  }

  /**
   * Download a level pack
   */
  downloadPack(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.endsWith('.zip') ? filename : `${filename}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Check if a file is a level pack (zip file)
   */
  isLevelPack(file: File): boolean {
    return file.name.toLowerCase().endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed'
  }

  /**
   * Check if a file is a plain JSON level
   */
  isJSONLevel(file: File): boolean {
    return file.name.toLowerCase().endsWith('.json') ||
      file.type === 'application/json'
  }
}

// Export singleton
export const levelPackService = new LevelPackService()
