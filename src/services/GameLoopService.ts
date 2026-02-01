type TickCallback = (deltaTime: number) => void

/**
 * GameLoopService - Owns requestAnimationFrame loop
 * 
 * Calculates deltaTime between frames and calls registered tick callbacks.
 * Provides start/stop control for pausing the game.
 */
class GameLoopService {
  private isRunning = false
  private lastTimestamp = 0
  private animationFrameId: number | null = null
  private tickCallback: TickCallback | null = null

  /**
   * Register the main tick callback
   */
  setTickCallback(callback: TickCallback): void {
    this.tickCallback = callback
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return
    
    this.isRunning = true
    this.lastTimestamp = performance.now()
    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Check if loop is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning
  }

  private loop = (timestamp: number): void => {
    if (!this.isRunning) return

    // Calculate delta time in seconds
    const deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1) // Cap at 100ms to prevent huge jumps
    this.lastTimestamp = timestamp

    // Call the tick callback with error handling to prevent loop crash
    if (this.tickCallback) {
      try {
        this.tickCallback(deltaTime)
      } catch (error) {
        console.error('Error in game loop tick:', error)
        // Continue running to allow recovery
      }
    }

    // Schedule next frame (only if still running)
    if (this.isRunning) {
      this.animationFrameId = requestAnimationFrame(this.loop)
    }
  }
}

// Singleton instance
export const gameLoopService = new GameLoopService()
