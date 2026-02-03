/**
 * Themes Module - Barrel Export
 * 
 * Provides the visual theming system including:
 * - Theme type definitions
 * - Theme registry for dynamic registration
 * - ThemeService for loading and applying themes
 */

// Types
export type {
  ThemePalette,
  ThemeAssets,
  ThemeEffects,
  ThemeDefinition,
  ActiveTheme,
} from './types'

// Registry
export {
  themeRegistry,
  ThemeRegistryClass,
  THEME_PRIORITY,
  type ThemeSource,
  type RegisteredTheme,
} from './registry'

// Service
export {
  themeService,
  ThemeServiceClass,
  DEFAULT_THEME,
  DEFAULT_PALETTE,
} from './ThemeService'
