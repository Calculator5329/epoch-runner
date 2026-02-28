import { makeAutoObservable } from 'mobx'

/**
 * Screen state for the campaign flow
 */
export type ScreenState = 
  | 'intro'           // Welcome/documentation screen
  | 'roadmap'         // Full development roadmap view
  | 'playing'         // Active gameplay
  | 'level_complete'  // Just beat a level, show stats
  | 'campaign_complete' // Beat all levels, show final stats + level select

/**
 * Stats tracked for the current session
 */
export interface SessionStats {
  totalDeaths: number
  totalCoinsCollected: number
  levelsCompleted: number
  startTime: number
  totalPlayTime: number  // milliseconds
}

/**
 * Per-level stats for display
 */
export interface LevelStats {
  levelId: string
  levelName: string
  deaths: number
  coinsCollected: number
  bestTime: number | null  // milliseconds
  completed: boolean
}

/**
 * CampaignStore - Manages level progression and game flow
 * 
 * Controls the campaign from intro screen through all levels to the
 * final stats screen. Tracks progression, unlocks, and session stats.
 */
export class CampaignStore {
  // Current state of the game flow
  screenState: ScreenState = 'intro'
  
  // Campaign progression (index into orderedLevels)
  currentLevelIndex = 0
  
  // Track which levels are unlocked (levelId -> unlocked)
  unlockedLevels: Set<string> = new Set()
  
  // Session statistics
  sessionStats: SessionStats = {
    totalDeaths: 0,
    totalCoinsCollected: 0,
    levelsCompleted: 0,
    startTime: 0,
    totalPlayTime: 0,
  }
  
  // Per-level statistics for this session
  levelStats: Map<string, LevelStats> = new Map()
  
  // Current level tracking
  currentLevelDeaths = 0
  currentLevelCoins = 0
  currentLevelStartTime = 0
  
  // ============================================
  // Admin Mode
  // ============================================
  
  /**
   * Admin mode flag - enables level select, skipping, etc.
   * Set to true for development, would be false in production
   */
  isAdminMode = true
  
  constructor() {
    makeAutoObservable(this)
  }

  // ============================================
  // Screen State Management
  // ============================================

  /**
   * Set the current screen state
   */
  setScreenState(state: ScreenState): void {
    this.screenState = state
  }

  /**
   * Start the campaign from intro
   */
  startCampaign(): void {
    this.screenState = 'playing'
    this.sessionStats.startTime = Date.now()
    this.currentLevelStartTime = Date.now()
  }

  /**
   * Go back to intro screen (restart campaign)
   */
  returnToIntro(): void {
    this.screenState = 'intro'
    this.currentLevelIndex = 0
    this.resetSessionStats()
  }

  // ============================================
  // Level Progression
  // ============================================

  /**
   * Initialize campaign with available levels
   */
  initCampaign(levelIds: string[]): void {
    // Unlock first level
    if (levelIds.length > 0) {
      this.unlockedLevels.add(levelIds[0])
    }
    
    // In admin mode, unlock all levels
    if (this.isAdminMode) {
      levelIds.forEach(id => this.unlockedLevels.add(id))
    }
    
    this.currentLevelIndex = 0
  }

  /**
   * Get the current level ID
   */
  getCurrentLevelId(orderedLevels: string[]): string | null {
    if (this.currentLevelIndex < 0 || this.currentLevelIndex >= orderedLevels.length) {
      return null
    }
    return orderedLevels[this.currentLevelIndex]
  }

  /**
   * Check if there's a next level available
   */
  hasNextLevel(totalLevels: number): boolean {
    return this.currentLevelIndex < totalLevels - 1
  }

  /**
   * Called when player completes current level
   * @param coinsCollected - Raw number of coins collected in this level
   */
  onLevelComplete(levelId: string, levelName: string, coinsCollected: number): void {
    // Record level stats
    const elapsed = Date.now() - this.currentLevelStartTime
    const existing = this.levelStats.get(levelId)
    
    this.levelStats.set(levelId, {
      levelId,
      levelName,
      deaths: this.currentLevelDeaths,
      coinsCollected: coinsCollected,  // Use raw count passed from GameStore
      bestTime: existing?.bestTime ? Math.min(existing.bestTime, elapsed) : elapsed,
      completed: true,
    })
    
    // Update session stats with raw count
    this.sessionStats.levelsCompleted += 1
    this.sessionStats.totalCoinsCollected += coinsCollected
    this.sessionStats.totalPlayTime = Date.now() - this.sessionStats.startTime
    
    this.screenState = 'level_complete'
  }

  /**
   * Advance to next level or show completion screen
   */
  advanceToNextLevel(orderedLevels: string[]): string | null {
    this.currentLevelIndex += 1
    
    // Reset current level tracking
    this.currentLevelDeaths = 0
    this.currentLevelCoins = 0
    this.currentLevelStartTime = Date.now()
    
    if (this.currentLevelIndex >= orderedLevels.length) {
      // Campaign complete!
      this.screenState = 'campaign_complete'
      return null
    }
    
    // Unlock next level
    const nextLevelId = orderedLevels[this.currentLevelIndex]
    this.unlockedLevels.add(nextLevelId)
    
    this.screenState = 'playing'
    return nextLevelId
  }

  /**
   * Jump to a specific level (admin mode)
   */
  jumpToLevel(levelIndex: number, orderedLevels: string[]): string | null {
    if (!this.isAdminMode) return null
    if (levelIndex < 0 || levelIndex >= orderedLevels.length) return null
    
    this.currentLevelIndex = levelIndex
    this.currentLevelDeaths = 0
    this.currentLevelCoins = 0
    this.currentLevelStartTime = Date.now()
    this.screenState = 'playing'
    
    return orderedLevels[levelIndex]
  }

  // ============================================
  // Stats Tracking
  // ============================================

  /**
   * Record a death on current level
   */
  recordDeath(): void {
    this.currentLevelDeaths += 1
    this.sessionStats.totalDeaths += 1
  }

  /**
   * Record coin collection
   */
  recordCoin(): void {
    this.currentLevelCoins += 1
  }

  /**
   * Reset session statistics
   */
  resetSessionStats(): void {
    this.sessionStats = {
      totalDeaths: 0,
      totalCoinsCollected: 0,
      levelsCompleted: 0,
      startTime: 0,
      totalPlayTime: 0,
    }
    this.levelStats.clear()
    this.currentLevelDeaths = 0
    this.currentLevelCoins = 0
    this.currentLevelStartTime = 0
  }

  // ============================================
  // Computed Properties
  // ============================================

  /**
   * Get formatted total play time
   */
  get formattedPlayTime(): string {
    const ms = this.sessionStats.totalPlayTime
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  /**
   * Get all level stats as array
   */
  get allLevelStats(): LevelStats[] {
    return Array.from(this.levelStats.values())
  }

  /**
   * Check if a level is unlocked
   */
  isLevelUnlocked(levelId: string): boolean {
    return this.isAdminMode || this.unlockedLevels.has(levelId)
  }
}
