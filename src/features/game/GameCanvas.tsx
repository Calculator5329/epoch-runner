import { useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useRootStore } from '../../stores/RootStore'
import { gameLoopService } from '../../services/GameLoopService'
import { inputService } from '../../services/InputService'
import { physicsService } from '../../services/PhysicsService'
import { cameraService } from '../../services/CameraService'
import { canvasRenderer } from '../../services/CanvasRenderer'
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
import { CAMPAIGN_LEVELS } from '../../levels'
import type { LevelJSON } from '../../levels/types'

/**
 * GameCanvas - Main game rendering component
 * 
 * Mounts the canvas, initializes services, and runs the game loop.
 */
export const GameCanvas = observer(function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rootStore = useRootStore()
  const { gameStore, playerStore, levelStore, cameraStore, campaignStore } = rootStore

  // Track if we need to respawn (set when player dies)
  const needsRespawnRef = useRef(false)
  const prevLivesRef = useRef(gameStore.lives)
  const wasLevelCompleteRef = useRef(false)

  // Main game tick function
  const tick = useCallback((deltaTime: number) => {
    const screenState = campaignStore.screenState

    // Only run game logic when playing
    if (screenState === 'playing') {
      // Check if player died (lives decreased)
      if (gameStore.lives < prevLivesRef.current && !gameStore.isGameOver) {
        needsRespawnRef.current = true
      }
      prevLivesRef.current = gameStore.lives

      // Handle respawn after death
      if (needsRespawnRef.current && !gameStore.isGameOver) {
        needsRespawnRef.current = false
        rootStore.respawnPlayer()
      }

      // 1. Consume input
      const input = inputService.consumeFrame()

      // 2. Apply input to player
      playerStore.applyInput(input)

      // 3. Update power-up timers
      playerStore.updatePowerUps(deltaTime)

      // 4. Update physics (pass input for noclip vertical movement)
      physicsService.update(deltaTime, playerStore, levelStore, gameStore, input)

      // 5. Update camera to follow player
      cameraService.update(deltaTime, cameraStore, playerStore, levelStore)

      // 6. Check for level completion (transition to campaign screen)
      if (gameStore.levelComplete && !wasLevelCompleteRef.current) {
        wasLevelCompleteRef.current = true
        rootStore.onLevelComplete()
      }
    }
    
    // Reset level complete tracking when starting new level
    if (!gameStore.levelComplete) {
      wasLevelCompleteRef.current = false
    }

    // 7. Render frame (always render for UI screens)
    canvasRenderer.draw(levelStore, playerStore, gameStore, cameraStore, campaignStore)
  }, [rootStore, gameStore, playerStore, levelStore, cameraStore, campaignStore])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const screenState = campaignStore.screenState

      // ============================================
      // Intro Screen Controls
      // ============================================
      if (screenState === 'intro') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          rootStore.startCampaign()
        }
        return
      }

      // ============================================
      // Roadmap Screen Controls
      // ============================================
      if (screenState === 'roadmap') {
        if (e.code === 'Escape') {
          e.preventDefault()
          // If viewing phase detail, go back to list; otherwise go to intro
          if (canvasRenderer.selectedRoadmapPhase !== null) {
            canvasRenderer.selectedRoadmapPhase = null
          } else {
            canvasRenderer.clearRoadmapSelection()
            campaignStore.setScreenState('intro')
          }
        }
        if (e.code === 'Tab') {
          e.preventDefault()
          canvasRenderer.clearRoadmapSelection()
          campaignStore.setScreenState('intro')
        }
        return
      }

      // ============================================
      // Level Complete Screen Controls
      // ============================================
      if (screenState === 'level_complete') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          rootStore.continueToNextLevel()
        }
        if (e.code === 'KeyR') {
          e.preventDefault()
          // Replay current level
          const currentLevelId = levelStore.currentLevelId
          if (currentLevelId) {
            campaignStore.setScreenState('playing')
            rootStore.loadLevel(currentLevelId)
          }
        }
        return
      }

      // ============================================
      // Campaign Complete Screen Controls
      // ============================================
      if (screenState === 'campaign_complete') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          // Play again - restart campaign
          rootStore.restartCampaign()
          rootStore.startCampaign()
        }
        if (e.code === 'Escape') {
          e.preventDefault()
          rootStore.restartCampaign()
        }
        // Number keys for level select (admin)
        if (campaignStore.isAdminMode) {
          const num = parseInt(e.key)
          if (!isNaN(num) && num >= 1 && num <= CAMPAIGN_LEVELS.length) {
            e.preventDefault()
            rootStore.adminJumpToLevel(num - 1)
          }
          // Backtick for level select menu
          if (e.code === 'Backquote') {
            e.preventDefault()
            campaignStore.setScreenState('playing')
            gameStore.toggleAdminMenu()
          }
        }
        return
      }

      // ============================================
      // Playing State Controls
      // ============================================
      
      // Backtick toggles admin menu (admin only)
      if (e.code === 'Backquote' && campaignStore.isAdminMode) {
        e.preventDefault()
        gameStore.toggleAdminMenu()
        return
      }
      
      // Escape closes admin menu or toggles pause
      if (e.code === 'Escape') {
        if (gameStore.isAdminMenuOpen) {
          canvasRenderer.clearHover()
          gameStore.closeAdminMenu()
        } else {
          gameStore.setPaused(!gameStore.isPaused)
        }
        return
      }
      
      // Don't process other keys while admin menu is open
      if (gameStore.isAdminMenuOpen) return
      
      if (e.code === 'KeyR') {
        rootStore.reset()
      }
      
      // ============================================
      // Debug Keys (Admin Only) F1-F5
      // ============================================
      if (campaignStore.isAdminMode) {
        // F1: Toggle grid overlay
        if (e.code === 'F1') {
          e.preventDefault()
          gameStore.toggleGridOverlay()
        }
        // F2: Toggle collision shape outlines
        if (e.code === 'F2') {
          e.preventDefault()
          gameStore.toggleCollisionShapes()
        }
        // F3: Toggle debug info panel
        if (e.code === 'F3') {
          e.preventDefault()
          gameStore.toggleDebugInfo()
        }
        // F4: Toggle god mode (invincibility)
        if (e.code === 'F4') {
          e.preventDefault()
          gameStore.toggleGodMode()
        }
        // F5: Toggle noclip (fly through walls)
        if (e.code === 'F5') {
          e.preventDefault()
          gameStore.toggleNoclip()
        }
      }
      
      // L key to list available levels
      if (e.code === 'KeyL' && e.ctrlKey) {
        e.preventDefault()
        console.log('Available levels:', rootStore.getAvailableLevels())
      }
      // S key to save/download current level (admin only)
      if (e.code === 'KeyS' && e.ctrlKey && campaignStore.isAdminMode) {
        e.preventDefault()
        rootStore.downloadCurrentLevel()
      }
      // O key to open/import level (admin only)
      if (e.code === 'KeyO' && e.ctrlKey && campaignStore.isAdminMode) {
        e.preventDefault()
        fileInputRef.current?.click()
      }
      // TEMP: Semicolon to skip to campaign complete screen (admin only)
      if (e.code === 'Semicolon' && campaignStore.isAdminMode) {
        e.preventDefault()
        campaignStore.setScreenState('campaign_complete')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rootStore, gameStore, campaignStore, levelStore])

  // Handle canvas click (for admin menu, roadmap, and intro terminal)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Get click position relative to canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    // Handle intro screen terminal click
    if (campaignStore.screenState === 'intro') {
      if (canvasRenderer.isTerminalClicked(clickX, clickY)) {
        canvasRenderer.clearTerminalState()
        campaignStore.setScreenState('roadmap')
      }
      return
    }

    // Handle roadmap screen clicks
    if (campaignStore.screenState === 'roadmap') {
      canvasRenderer.handleRoadmapClick(clickX, clickY)
      return
    }
    
    // Handle admin menu clicks
    if (gameStore.isAdminMenuOpen) {
      const levelId = canvasRenderer.getLevelAtPosition(clickX, clickY)
      if (levelId) {
        canvasRenderer.clearHover()
        rootStore.adminJumpToLevelById(levelId)
        gameStore.closeAdminMenu()
      }
    }
  }, [rootStore, gameStore, campaignStore.screenState])

  // Handle canvas mouse move (for admin menu, roadmap, and intro terminal hover effects)
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const mouseX = (e.clientX - rect.left) * scaleX
    const mouseY = (e.clientY - rect.top) * scaleY

    // Handle intro screen terminal hover
    if (campaignStore.screenState === 'intro') {
      canvasRenderer.updateTerminalHover(mouseX, mouseY)
      return
    }

    // Handle roadmap hover
    if (campaignStore.screenState === 'roadmap') {
      canvasRenderer.updateRoadmapHover(mouseX, mouseY)
      return
    }
    
    // Handle admin menu hover
    if (gameStore.isAdminMenuOpen) {
      canvasRenderer.updateHoverPosition(mouseX, mouseY)
    } else {
      canvasRenderer.clearHover()
    }
  }, [gameStore.isAdminMenuOpen, campaignStore.screenState])

  // Handle file import
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as LevelJSON
        const result = rootStore.loadLevelFromJSON(json)
        if (!result.success) {
          console.error('Failed to load level:', result.errors)
          alert('Failed to load level:\n' + result.errors.join('\n'))
        } else {
          console.log('Level loaded successfully')
        }
      } catch (error) {
        console.error('Failed to parse JSON:', error)
        alert('Failed to parse level file')
      }
    }
    reader.readAsText(file)
    
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [rootStore])

  // Initialize game on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size to viewport (camera handles scrolling)
    canvas.width = VIEWPORT_WIDTH
    canvas.height = VIEWPORT_HEIGHT

    // Get context and set up renderer
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get canvas context')
      return
    }
    canvasRenderer.setContext(ctx)

    // Initialize stores (loads default level, spawns player, sets up camera)
    rootStore.init()

    // Initialize input service
    inputService.init()

    // Set up game loop
    gameLoopService.setTickCallback(tick)
    gameLoopService.start()
    gameStore.setRunning(true)

    // Cleanup on unmount
    return () => {
      gameLoopService.stop()
      inputService.destroy()
      gameStore.setRunning(false)
    }
  }, [rootStore, gameStore, tick])

  // Determine cursor style based on hover state
  const isClickable = canvasRenderer.isTerminalHovered || 
                      canvasRenderer.hoveredRoadmapPhase !== null ||
                      (gameStore.isAdminMenuOpen && canvasRenderer.hoveredLevelIndex !== null)

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        style={{ cursor: isClickable ? 'pointer' : 'default' }}
      />
      {campaignStore.screenState === 'playing' && (
        <>
          <div className="game-info">
            <p className="level-name">
              Level {campaignStore.currentLevelIndex + 1}/{CAMPAIGN_LEVELS.length}: {levelStore.currentLevelName || 'Untitled Level'} 
              <span className="level-size">({levelStore.width}×{levelStore.height})</span>
            </p>
          </div>
          <div className="game-controls">
            <p>
              <strong>Movement:</strong> Arrow keys or WASD | <strong>Jump:</strong> Space/Up
            </p>
            <p>
              <strong>R:</strong> Restart | <strong>Esc:</strong> Pause
              {campaignStore.isAdminMode && <> | <strong>`:</strong> Level Select | <strong>Ctrl+S:</strong> Save</>}
            </p>
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />
    </div>
  )
})
