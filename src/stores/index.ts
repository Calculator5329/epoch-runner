/**
 * Store Layer - Barrel Export
 * 
 * All MobX stores and convenience hooks.
 * Import from this file for cleaner imports.
 */

// Store classes (for type imports)
export { GameStore } from './GameStore'
export { PlayerStore } from './PlayerStore'
export { LevelStore } from './LevelStore'
export { CameraStore } from './CameraStore'
export { CampaignStore } from './CampaignStore'
export type { ScreenState, SessionStats, LevelStats } from './CampaignStore'
export { UIStore } from './UIStore'
export type { Bounds, AdminMenuBounds, RoadmapPhaseBounds } from './UIStore'

// Root store and hooks
export { 
  RootStore,
  rootStore,
  RootStoreProvider,
  useRootStore,
  useGameStore,
  usePlayerStore,
  useLevelStore,
  useCameraStore,
  useCampaignStore,
  useUIStore,
} from './RootStore'
