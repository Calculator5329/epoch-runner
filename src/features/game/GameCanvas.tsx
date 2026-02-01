import { useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useRootStore } from '../../stores/RootStore'
import { gameLoopService } from '../../services/GameLoopService'
import { inputService } from '../../services/InputService'
import { physicsService } from '../../services/PhysicsService'
import { cameraService } from '../../services/CameraService'
import { canvasRenderer } from '../../services/CanvasRenderer'
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '../../core/constants'
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
  const { gameStore, playerStore, levelStore, cameraStore } = rootStore

  // Main game tick function
  const tick = useCallback((deltaTime: number) => {
    // 1. Consume input
    const input = inputService.consumeFrame()

    // 2. Apply input to player
    playerStore.applyInput(input)

    // 3. Update physics
    physicsService.update(deltaTime, playerStore, levelStore, gameStore)

    // 4. Update camera to follow player
    cameraService.update(deltaTime, cameraStore, playerStore, levelStore)

    // 5. Render frame
    canvasRenderer.draw(levelStore, playerStore, gameStore, cameraStore)
  }, [gameStore, playerStore, levelStore, cameraStore])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR') {
        rootStore.reset()
      }
      if (e.code === 'Escape') {
        gameStore.setPaused(!gameStore.isPaused)
      }
      // L key to list available levels
      if (e.code === 'KeyL' && e.ctrlKey) {
        e.preventDefault()
        console.log('Available levels:', rootStore.getAvailableLevels())
      }
      // S key to save/download current level
      if (e.code === 'KeyS' && e.ctrlKey) {
        e.preventDefault()
        rootStore.downloadCurrentLevel()
      }
      // O key to open/import level
      if (e.code === 'KeyO' && e.ctrlKey) {
        e.preventDefault()
        fileInputRef.current?.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rootStore, gameStore])

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

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
      />
      <div className="game-info">
        <p className="level-name">
          {levelStore.currentLevelName || 'Untitled Level'} 
          <span className="level-size">({levelStore.width}×{levelStore.height})</span>
        </p>
      </div>
      <div className="game-controls">
        <p>
          <strong>Movement:</strong> Arrow keys or WASD | <strong>Jump:</strong> Space/Up
        </p>
        <p>
          <strong>R:</strong> Restart | <strong>Esc:</strong> Pause | <strong>Ctrl+S:</strong> Save Level | <strong>Ctrl+O:</strong> Load Level
        </p>
      </div>
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
