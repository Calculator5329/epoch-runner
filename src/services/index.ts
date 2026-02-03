/**
 * Service Layer - Barrel Export
 * 
 * All services are stateless singletons that receive stores as parameters.
 * Import from this file for cleaner imports.
 */

export { gameLoopService } from './GameLoopService'
export { inputService } from './InputService'
export { physicsService } from './PhysicsService'
export { cameraService } from './CameraService'
export { canvasRenderer } from './renderers'
export { levelLoaderService } from './LevelLoaderService'
export { levelPackService } from './LevelPackService'
export type { PackValidationResult, ExtractedPack } from './LevelPackService'
export { audioService } from './AudioService'
export { hitboxService } from './HitboxService'
export { assetResolverService } from './AssetResolverService'
export type { 
  AssetType, 
  AssetSource, 
  RegisteredAsset, 
  PlayerSpriteKey, 
  UISpriteKey 
} from './AssetResolverService'
export { editorHistoryService } from './EditorHistoryService'
export type { HistorySnapshot } from './EditorHistoryService'
export { editorGridService } from './EditorGridService'
export { packOverrideService, OVERRIDE_PRESETS } from './PackOverrideService'
export type {
  PhysicsOverrides,
  PlayerOverrides,
  GameplayOverrides,
  VisualOverrides,
  PackOverrides,
  ExtendedPackManifest,
} from './PackOverrideService'
export { levelMetadataService } from './LevelMetadataService'
export type {
  LevelStatistics,
  LevelFilter,
  LevelSort,
} from './LevelMetadataService'