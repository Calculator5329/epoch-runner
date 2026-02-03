/**
 * Theme Types - Type definitions for the visual theme system
 */

/**
 * Color palette for a theme
 */
export interface ThemePalette {
  /** Primary accent color */
  primary: string
  
  /** Secondary accent color */
  secondary: string
  
  /** Background colors */
  background: {
    main: string
    secondary: string
    accent: string
  }
  
  /** UI colors */
  ui: {
    text: string
    textSecondary: string
    border: string
    overlay: string
  }
  
  /** Tile colors override */
  tiles?: {
    solid?: string
    platform?: string
    hazard?: string
    coin?: string
    powerup?: string
    goal?: string
    checkpoint?: string
  }
  
  /** Player colors */
  player?: {
    body: string
    accent: string
  }
}

/**
 * Theme assets configuration
 */
export interface ThemeAssets {
  /** Tile sprite overrides (tile ID -> sprite URL) */
  tileSprites?: Record<number, string>
  
  /** Player sprite overrides */
  playerSprites?: {
    idle?: string
    run?: string
    run1?: string
    run2?: string
    jump?: string
  }
  
  /** Background image */
  background?: string
  
  /** Background parallax speed (0-1) */
  parallaxSpeed?: number
  
  /** UI sprite overrides */
  uiSprites?: Record<string, string>
  
  /** Music track */
  music?: string
  
  /** Sound effect overrides */
  sfx?: Record<string, string>
}

/**
 * Theme visual effects
 */
export interface ThemeEffects {
  /** Enable particle effects */
  particles?: boolean
  
  /** Screen shake intensity multiplier */
  screenShake?: number
  
  /** Enable glow effects */
  glow?: boolean
  
  /** Bloom intensity */
  bloom?: number
  
  /** Scanline overlay */
  scanlines?: boolean
  
  /** CRT curvature effect */
  crtCurve?: boolean
}

/**
 * Complete theme definition
 */
export interface ThemeDefinition {
  /** Unique identifier */
  id: string
  
  /** Display name */
  name: string
  
  /** Description */
  description?: string
  
  /** Author */
  author?: string
  
  /** Color palette */
  palette: ThemePalette
  
  /** Asset overrides */
  assets?: ThemeAssets
  
  /** Visual effects */
  effects?: ThemeEffects
  
  /** Pack ID this theme belongs to */
  packId?: string
  
  /** Preview image URL */
  previewUrl?: string
}

/**
 * Active theme state
 */
export interface ActiveTheme {
  /** The theme definition */
  definition: ThemeDefinition
  
  /** Loaded assets (HTMLImageElements, audio, etc.) */
  loadedAssets: {
    tileSprites: Map<number, HTMLImageElement>
    playerSprites: Map<string, HTMLImageElement>
    background?: HTMLImageElement
    uiSprites: Map<string, HTMLImageElement>
    music?: HTMLAudioElement
    sfx: Map<string, HTMLAudioElement>
  }
  
  /** Whether all assets are loaded */
  loaded: boolean
}
