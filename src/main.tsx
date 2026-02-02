import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { rootStore } from './stores/RootStore'
import { initCore } from './core/init'

// Initialize core registries before anything else
initCore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Expose debug interface in development mode
if (import.meta.env.DEV) {
  const debugInterface = {
    // Store access
    stores: rootStore,
    player: rootStore.playerStore,
    game: rootStore.gameStore,
    level: rootStore.levelStore,
    camera: rootStore.cameraStore,
    campaign: rootStore.campaignStore,
    
    // Helper methods
    loadLevel: (id: string) => rootStore.loadLevel(id),
    teleport: (col: number, row: number) => rootStore.teleport(col, row),
    
    // Debug toggles (getters/setters for convenience)
    get god() { return rootStore.gameStore.isGodMode },
    set god(v: boolean) { rootStore.gameStore.isGodMode = v },
    get noclip() { return rootStore.gameStore.isNoclip },
    set noclip(v: boolean) { rootStore.gameStore.isNoclip = v },
    get grid() { return rootStore.gameStore.showGridOverlay },
    set grid(v: boolean) { rootStore.gameStore.showGridOverlay = v },
    get debug() { return rootStore.gameStore.showDebugInfo },
    set debug(v: boolean) { rootStore.gameStore.showDebugInfo = v },
    
    // Quick info
    help: () => {
      console.log(`
__EPOCH__ Debug Interface
========================
Stores:
  __EPOCH__.player   - PlayerStore (x, y, vx, vy, isGrounded)
  __EPOCH__.game     - GameStore (lives, coins, etc.)
  __EPOCH__.level    - LevelStore (collision grid, tiles)
  __EPOCH__.camera   - CameraStore (viewport position)
  __EPOCH__.campaign - CampaignStore (progression)

Commands:
  __EPOCH__.loadLevel('level_0_basic')  - Load a level by ID
  __EPOCH__.teleport(col, row)          - Teleport player to grid position

Toggles (get/set):
  __EPOCH__.god     - Invincibility (no hazard damage)
  __EPOCH__.noclip  - Fly through walls (no collision)
  __EPOCH__.grid    - Show tile grid overlay
  __EPOCH__.debug   - Show debug info panel
      `)
    },
  }
  
  ;(window as unknown as { __EPOCH__: typeof debugInterface }).__EPOCH__ = debugInterface
  console.log('🎮 Epoch Runner dev mode - type __EPOCH__.help() for commands')
}
