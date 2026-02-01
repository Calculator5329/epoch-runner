import { makeAutoObservable } from 'mobx'

/**
 * GameStore - Top-level game state
 * 
 * Manages game running state, level completion, and pause functionality.
 */
export class GameStore {
  isRunning = false
  levelComplete = false
  isPaused = false

  constructor() {
    makeAutoObservable(this)
  }

  setRunning(running: boolean): void {
    this.isRunning = running
  }

  setLevelComplete(complete: boolean): void {
    this.levelComplete = complete
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused
  }

  /**
   * Reset game state for level restart
   */
  reset(): void {
    this.levelComplete = false
    this.isPaused = false
  }
}
