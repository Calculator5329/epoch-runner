import type { PlayerStore } from '../../stores/PlayerStore'
import type { LevelStore } from '../../stores/LevelStore'
import type { GameStore } from '../../stores/GameStore'
import type { CameraStore } from '../../stores/CameraStore'
import type { CampaignStore, ScreenState } from '../../stores/CampaignStore'
import type { UIStore } from '../../stores/UIStore'
import type { AssetStore } from '../../stores/AssetStore'
import type { EntityStore } from '../../stores/EntityStore'
import type { MovingPlatformStore } from '../../stores/MovingPlatformStore'

// Sub-renderers
import { GameplayRenderer } from './GameplayRenderer'
import { DebugRenderer } from './DebugRenderer'
import { IntroScreenRenderer } from './screens/IntroScreenRenderer'
import { RoadmapScreenRenderer } from './screens/RoadmapScreenRenderer'
import { LevelCompleteRenderer } from './screens/LevelCompleteRenderer'
import { CampaignCompleteRenderer } from './screens/CampaignCompleteRenderer'
import { AdminMenuRenderer } from './screens/AdminMenuRenderer'
import { OverlayRenderer } from './screens/OverlayRenderer'

/**
 * CanvasRenderer - Main rendering orchestrator
 * 
 * Delegates rendering to specialized sub-renderers based on game state.
 * This class is now stateless - all UI interaction state lives in UIStore.
 * 
 * Sub-renderers:
 * - GameplayRenderer: Tiles, player, HUD
 * - DebugRenderer: Grid overlay, collision shapes, debug panel
 * - IntroScreenRenderer: Welcome/intro screen
 * - RoadmapScreenRenderer: Development roadmap
 * - LevelCompleteRenderer: Level complete overlay
 * - CampaignCompleteRenderer: Final stats screen
 * - AdminMenuRenderer: Level select overlay
 * - OverlayRenderer: Pause, game over
 */
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D | null = null

  // Sub-renderers
  private gameplayRenderer = new GameplayRenderer()
  private debugRenderer = new DebugRenderer()
  private introRenderer = new IntroScreenRenderer()
  private roadmapRenderer = new RoadmapScreenRenderer()
  private levelCompleteRenderer = new LevelCompleteRenderer()
  private campaignCompleteRenderer = new CampaignCompleteRenderer()
  private adminMenuRenderer = new AdminMenuRenderer()
  private overlayRenderer = new OverlayRenderer()

  /**
   * Set the canvas context to render to
   */
  setContext(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx
  }

  /**
   * Main draw call - renders entire frame
   * Delegates to appropriate sub-renderer based on screen state.
   */
  draw(
    levelStore: LevelStore,
    playerStore: PlayerStore,
    gameStore: GameStore,
    cameraStore: CameraStore,
    campaignStore?: CampaignStore,
    uiStore?: UIStore,
    assetStore?: AssetStore,
    entityStore?: EntityStore,
    movingPlatformStore?: MovingPlatformStore
  ): void {
    if (!this.ctx) return

    const ctx = this.ctx

    // Handle screen states from campaign
    const screenState: ScreenState = campaignStore?.screenState || 'playing'

    // ============================================
    // Full-Screen States (no gameplay visible)
    // ============================================

    // Intro screen
    if (screenState === 'intro' && campaignStore && uiStore) {
      this.introRenderer.draw(ctx, campaignStore, uiStore)
      return
    }

    // Roadmap screen
    if (screenState === 'roadmap' && campaignStore && uiStore) {
      this.roadmapRenderer.draw(ctx, campaignStore, uiStore)
      return
    }

    // Campaign complete screen
    if (screenState === 'campaign_complete' && campaignStore) {
      this.campaignCompleteRenderer.draw(ctx, campaignStore)
      return
    }

    // ============================================
    // Playing State (gameplay + overlays)
    // ============================================

    // Draw gameplay (tiles, player, HUD, entities, platforms) - pass assetStore for custom sprites
    this.gameplayRenderer.draw(ctx, levelStore, playerStore, gameStore, cameraStore, assetStore, entityStore, movingPlatformStore)

    // Draw debug overlays if enabled
    this.debugRenderer.draw(ctx, levelStore, playerStore, gameStore, cameraStore)

    // Level complete overlay
    if (screenState === 'level_complete' || gameStore.levelComplete) {
      this.levelCompleteRenderer.draw(ctx, gameStore, campaignStore)
      return
    }

    // Game state overlays (pause, game over)
    this.overlayRenderer.draw(ctx, gameStore)

    // Admin menu overlay (on top of everything)
    if (gameStore.isAdminMenuOpen && uiStore) {
      this.adminMenuRenderer.draw(ctx, levelStore.currentLevelId, uiStore)
    }
  }
}

// Singleton instance
export const canvasRenderer = new CanvasRenderer()
