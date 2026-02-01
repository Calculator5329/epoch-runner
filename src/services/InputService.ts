import type { InputState } from '../core/types'

/**
 * InputService - Hybrid event-driven keyboard input with state caching
 * 
 * Events update internal state on keydown/keyup.
 * Game loop calls consumeFrame() to get a snapshot each frame.
 * Supports "just pressed" detection for jump buffering.
 */
class InputService {
  private state = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
  }
  
  private jumpPressedThisFrame = false
  private isInitialized = false

  init(): void {
    if (this.isInitialized) return
    
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
    this.isInitialized = true
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
    this.isInitialized = false
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Prevent default for game keys to avoid scrolling
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
      e.preventDefault()
    }

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = true
        break
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = true
        break
      case 'ArrowUp':
      case 'KeyW':
        this.state.up = true
        if (!this.state.jump) {
          this.jumpPressedThisFrame = true
        }
        this.state.jump = true
        break
      case 'Space':
        if (!this.state.jump) {
          this.jumpPressedThisFrame = true
        }
        this.state.jump = true
        break
      case 'ArrowDown':
      case 'KeyS':
        this.state.down = true
        break
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.state.left = false
        break
      case 'ArrowRight':
      case 'KeyD':
        this.state.right = false
        break
      case 'ArrowUp':
      case 'KeyW':
        this.state.up = false
        this.state.jump = false
        break
      case 'Space':
        this.state.jump = false
        break
      case 'ArrowDown':
      case 'KeyS':
        this.state.down = false
        break
    }
  }

  /**
   * Get input state snapshot and reset per-frame flags.
   * Called once per frame by the game loop.
   */
  consumeFrame(): InputState {
    const snapshot: InputState = {
      left: this.state.left,
      right: this.state.right,
      up: this.state.up,
      down: this.state.down,
      jump: this.state.jump,
      jumpJustPressed: this.jumpPressedThisFrame,
    }
    
    // Reset "just pressed" flag after consuming
    this.jumpPressedThisFrame = false
    
    return snapshot
  }

  /**
   * Reset all input state (e.g., on level restart)
   */
  reset(): void {
    this.state.left = false
    this.state.right = false
    this.state.up = false
    this.state.down = false
    this.state.jump = false
    this.jumpPressedThisFrame = false
  }
}

// Singleton instance
export const inputService = new InputService()
