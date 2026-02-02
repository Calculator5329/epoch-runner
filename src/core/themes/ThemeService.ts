/**
 * ThemeService - Manages theme loading and application
 * 
 * Handles:
 * - Loading theme assets (sprites, audio)
 * - Applying theme palettes
 * - Switching between themes
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

import type { ThemeDefinition, ActiveTheme, ThemePalette } from './types'
import { themeRegistry } from './registry'
import { TILE_COLORS } from '../types/shapes/tile-colors'

/**
 * Default theme palette
 */
export const DEFAULT_PALETTE: ThemePalette = {
  primary: '#4fd1c5',      // Teal
  secondary: '#38b2ac',    // Darker teal
  background: {
    main: '#1a202c',       // Dark blue-gray
    secondary: '#2d3748',  // Lighter gray
    accent: '#4a5568',     // Mid gray
  },
  ui: {
    text: '#f7fafc',       // Near white
    textSecondary: '#a0aec0', // Light gray
    border: '#4a5568',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  tiles: {
    solid: TILE_COLORS.solid,
    platform: TILE_COLORS.platform,
    hazard: TILE_COLORS.hazard,
    coin: TILE_COLORS.coin,
    powerup: TILE_COLORS.powerup,
    goal: TILE_COLORS.goal,
    checkpoint: TILE_COLORS.checkpoint,
  },
  player: {
    body: '#4299e1',       // Blue
    accent: '#63b3ed',     // Light blue
  },
}

/**
 * Default theme definition
 */
export const DEFAULT_THEME: ThemeDefinition = {
  id: 'default',
  name: 'Default',
  description: 'The default Epoch Runner theme',
  palette: DEFAULT_PALETTE,
}

/**
 * ThemeService class
 */
class ThemeServiceClass {
  private activeTheme: ActiveTheme | null = null
  private listeners: Set<(theme: ActiveTheme | null) => void> = new Set()

  constructor() {
    // Register default theme
    themeRegistry.register(DEFAULT_THEME, 'built-in', 0)
  }

  /**
   * Get the currently active theme
   */
  getActiveTheme(): ActiveTheme | null {
    return this.activeTheme
  }

  /**
   * Get the active theme definition, or default if none
   */
  getActiveDefinition(): ThemeDefinition {
    return this.activeTheme?.definition ?? DEFAULT_THEME
  }

  /**
   * Get the active palette
   */
  getActivePalette(): ThemePalette {
    return this.activeTheme?.definition.palette ?? DEFAULT_PALETTE
  }

  /**
   * Load and activate a theme by ID
   */
  async loadTheme(themeId: string): Promise<boolean> {
    const definition = themeRegistry.get(themeId)
    if (!definition) {
      console.warn(`[ThemeService] Theme not found: ${themeId}`)
      return false
    }

    // Create active theme with empty loaded assets
    const activeTheme: ActiveTheme = {
      definition,
      loadedAssets: {
        tileSprites: new Map(),
        playerSprites: new Map(),
        uiSprites: new Map(),
        sfx: new Map(),
      },
      loaded: false,
    }

    // Load assets if defined
    if (definition.assets) {
      try {
        await this.loadThemeAssets(activeTheme, definition.assets)
        activeTheme.loaded = true
      } catch (error) {
        console.error(`[ThemeService] Failed to load theme assets:`, error)
        // Continue with partial load
      }
    } else {
      activeTheme.loaded = true
    }

    this.activeTheme = activeTheme
    this.notifyListeners()
    
    return true
  }

  /**
   * Load theme assets
   */
  private async loadThemeAssets(
    theme: ActiveTheme,
    assets: ThemeDefinition['assets']
  ): Promise<void> {
    if (!assets) return

    const loadImage = async (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = url
      })
    }

    // Load tile sprites
    if (assets.tileSprites) {
      for (const [tileId, url] of Object.entries(assets.tileSprites)) {
        try {
          const img = await loadImage(url)
          theme.loadedAssets.tileSprites.set(Number(tileId), img)
        } catch (error) {
          console.warn(`[ThemeService] Failed to load tile sprite ${tileId}:`, error)
        }
      }
    }

    // Load player sprites
    if (assets.playerSprites) {
      for (const [key, url] of Object.entries(assets.playerSprites)) {
        if (url) {
          try {
            const img = await loadImage(url)
            theme.loadedAssets.playerSprites.set(key, img)
          } catch (error) {
            console.warn(`[ThemeService] Failed to load player sprite ${key}:`, error)
          }
        }
      }
    }

    // Load background
    if (assets.background) {
      try {
        theme.loadedAssets.background = await loadImage(assets.background)
      } catch (error) {
        console.warn(`[ThemeService] Failed to load background:`, error)
      }
    }

    // Load UI sprites
    if (assets.uiSprites) {
      for (const [key, url] of Object.entries(assets.uiSprites)) {
        try {
          const img = await loadImage(url)
          theme.loadedAssets.uiSprites.set(key, img)
        } catch (error) {
          console.warn(`[ThemeService] Failed to load UI sprite ${key}:`, error)
        }
      }
    }

    // Audio loading would go here (similar pattern)
  }

  /**
   * Unload the current theme
   */
  unloadTheme(): void {
    // Clean up any resources
    if (this.activeTheme?.loadedAssets.music) {
      this.activeTheme.loadedAssets.music.pause()
      this.activeTheme.loadedAssets.music.src = ''
    }
    
    this.activeTheme = null
    this.notifyListeners()
  }

  /**
   * Get a color from the active palette
   */
  getColor(path: string): string {
    const palette = this.getActivePalette()
    const parts = path.split('.')
    
    // Navigate the palette object
    let value: unknown = palette
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        return '#ff00ff' // Magenta fallback for missing colors
      }
    }
    
    return typeof value === 'string' ? value : '#ff00ff'
  }

  /**
   * Get tile color from active theme
   */
  getTileColor(tileType: string): string {
    return this.getActivePalette().tiles?.[tileType as keyof ThemePalette['tiles']] ?? '#808080'
  }

  /**
   * Get player color from active theme
   */
  getPlayerColor(part: 'body' | 'accent'): string {
    return this.getActivePalette().player?.[part] ?? DEFAULT_PALETTE.player![part]
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (theme: ActiveTheme | null) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.activeTheme))
  }
}

// Export singleton instance
export const themeService = new ThemeServiceClass()

// Export class for testing
export { ThemeServiceClass }
