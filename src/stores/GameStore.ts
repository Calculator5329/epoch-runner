import { makeAutoObservable } from 'mobx'
import { DEFAULT_LIVES } from '../core/constants'
import type { GridPosition } from '../levels/types'

/**
 * GameStore - Top-level game state
 * 
 * Manages game running state, level completion, lives, checkpoints,
 * and coin economy.
 */
export class GameStore {
  // Game state
  isRunning = false
  levelComplete = false
  isPaused = false
  isGameOver = false
  isAdminMenuOpen = false

  // ============================================
  // Debug Mode Flags (Admin/Dev Tools)
  // ============================================
  
  /** God mode - invincibility (no hazard/boundary damage) */
  isGodMode = false
  
  /** Noclip mode - fly through walls (no collision) */
  isNoclip = false
  
  /** Show tile grid overlay with coordinates */
  showGridOverlay = false
  
  /** Show collision shape outlines */
  showCollisionShapes = false
  
  /** Show debug info panel (position, velocity, etc.) */
  showDebugInfo = false

  // Lives system
  lives = DEFAULT_LIVES
  maxLives = DEFAULT_LIVES
  
  // Checkpoint (grid coordinates)
  lastCheckpoint: GridPosition | null = null
  
  // Coin economy
  coinsThisAttempt = 0
  totalCoins = 0  // Persistent wallet (would be saved to localStorage/Firebase)
  levelEarnings: Record<string, number> = {}  // Best earnings per level
  levelCompletionCount: Record<string, number> = {}  // Times completed per level
  lastCompletionEarnings = 0  // Earnings from last level completion (for subsequent calls)
  
  // Current level ID for tracking
  currentLevelId: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Game State
  // ============================================

  setRunning(running: boolean): void {
    this.isRunning = running
  }

  setLevelComplete(complete: boolean): void {
    this.levelComplete = complete
  }

  setPaused(paused: boolean): void {
    this.isPaused = paused
  }

  // ============================================
  // Admin Menu
  // ============================================

  /**
   * Toggle admin level selector overlay
   */
  toggleAdminMenu(): void {
    this.isAdminMenuOpen = !this.isAdminMenuOpen
    // Pause game when admin menu is open
    this.isPaused = this.isAdminMenuOpen
  }

  /**
   * Close admin menu
   */
  closeAdminMenu(): void {
    if (this.isAdminMenuOpen) {
      this.isAdminMenuOpen = false
      this.isPaused = false
    }
  }

  // ============================================
  // Debug Mode Toggles
  // ============================================

  /** Toggle god mode (invincibility) */
  toggleGodMode(): void {
    this.isGodMode = !this.isGodMode
  }

  /** Toggle noclip mode (fly through walls) */
  toggleNoclip(): void {
    this.isNoclip = !this.isNoclip
  }

  /** Toggle grid overlay */
  toggleGridOverlay(): void {
    this.showGridOverlay = !this.showGridOverlay
  }

  /** Toggle collision shape outlines */
  toggleCollisionShapes(): void {
    this.showCollisionShapes = !this.showCollisionShapes
  }

  /** Toggle debug info panel */
  toggleDebugInfo(): void {
    this.showDebugInfo = !this.showDebugInfo
  }

  // ============================================
  // Level Management
  // ============================================

  /**
   * Initialize for a new level
   */
  initLevel(levelId: string, startingLives: number = DEFAULT_LIVES): void {
    this.currentLevelId = levelId
    this.levelComplete = false
    this.isGameOver = false
    this.isPaused = false
    this.lives = startingLives
    this.maxLives = startingLives
    this.lastCheckpoint = null
    this.coinsThisAttempt = 0
    this.lastCompletionEarnings = 0
  }

  /**
   * Complete the current level
   * Returns the coins earned for display
   * Returns cached earnings if called multiple times (safe to call repeatedly)
   */
  completeLevel(): number {
    // Return cached earnings if already complete
    if (this.levelComplete) return this.lastCompletionEarnings
    
    this.levelComplete = true
    
    // Calculate earnings with replay multiplier
    let earnings = this.coinsThisAttempt
    
    if (this.currentLevelId) {
      const completionCount = this.levelCompletionCount[this.currentLevelId] || 0
      
      if (completionCount > 0) {
        // Apply 0.9^n multiplier for replays
        const multiplier = Math.pow(0.9, completionCount)
        earnings = Math.floor(earnings * multiplier)
      }
      
      // Update completion count
      this.levelCompletionCount[this.currentLevelId] = completionCount + 1
      
      // Track best earnings
      const prevBest = this.levelEarnings[this.currentLevelId] || 0
      if (this.coinsThisAttempt > prevBest) {
        this.levelEarnings[this.currentLevelId] = this.coinsThisAttempt
      }
    }
    
    // Add to total wallet
    this.totalCoins += earnings
    
    // Cache earnings for subsequent calls
    this.lastCompletionEarnings = earnings
    
    return earnings
  }

  // ============================================
  // Lives & Death
  // ============================================

  /**
   * Called when player hits a hazard
   */
  onPlayerDeath(): void {
    this.lives -= 1
    
    // Reset coins collected this attempt
    this.coinsThisAttempt = 0
    
    if (this.lives <= 0) {
      this.gameOver()
    }
    // Note: Actual respawn is handled by RootStore.respawnPlayer()
  }

  /**
   * Game over - no lives remaining
   */
  private gameOver(): void {
    this.isGameOver = true
    // Coins from this attempt are already reset, but totalCoins persists
  }

  /**
   * Get spawn position (checkpoint or level start)
   */
  get spawnPosition(): GridPosition | null {
    return this.lastCheckpoint
  }

  // ============================================
  // Checkpoints
  // ============================================

  /**
   * Set checkpoint position
   */
  setCheckpoint(col: number, row: number): void {
    // Only set if different from current checkpoint
    if (!this.lastCheckpoint || 
        this.lastCheckpoint.col !== col || 
        this.lastCheckpoint.row !== row) {
      this.lastCheckpoint = { col, row }
    }
  }

  // ============================================
  // Coins
  // ============================================

  /**
   * Collect a coin at position
   */
  collectCoin(_col: number, _row: number): void {
    this.coinsThisAttempt += 1
  }

  /**
   * Get replay multiplier for current level
   */
  get replayMultiplier(): number {
    if (!this.currentLevelId) return 1
    const completionCount = this.levelCompletionCount[this.currentLevelId] || 0
    if (completionCount === 0) return 1
    return Math.pow(0.9, completionCount)
  }

  // ============================================
  // Reset
  // ============================================

  /**
   * Reset game state for level restart (R key)
   */
  reset(): void {
    this.levelComplete = false
    this.isPaused = false
    this.isGameOver = false
    this.lives = this.maxLives
    this.lastCheckpoint = null
    this.coinsThisAttempt = 0
    this.lastCompletionEarnings = 0
  }

  /**
   * Full reset (new session)
   */
  fullReset(): void {
    this.reset()
    this.totalCoins = 0
    this.levelEarnings = {}
    this.levelCompletionCount = {}
    this.currentLevelId = null
  }
}
