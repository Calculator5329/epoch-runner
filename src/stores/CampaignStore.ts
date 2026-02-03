import { makeAutoObservable } from 'mobx'
import { 
  campaignRegistry, 
  type CampaignDefinition,
  getCampaignLevelIndex,
  getCampaignNextLevelId,
  isCampaignLastLevel,
  hasCampaignDoubleJump,
  getCampaignLength,
  getCampaignLevelAtIndex,
} from '../core/data/campaignConfig'

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
 * 
 * Now uses the campaign config system for data-driven campaigns.
 */
export class CampaignStore {
  // Current state of the game flow
  screenState: ScreenState = 'intro'
  
  // Current campaign definition
  currentCampaignId: string = 'main'
  
  // Campaign progression (index into campaign levels)
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
  // Campaign Access
  // ============================================

  /**
   * Get the current campaign definition
   */
  get currentCampaign(): CampaignDefinition {
    return campaignRegistry.get(this.currentCampaignId) ?? campaignRegistry.getDefault()
  }

  /**
   * Get the ordered level IDs for the current campaign
   */
  get orderedLevels(): string[] {
    return this.currentCampaign.levels
  }

  /**
   * Set the current campaign
   */
  setCampaign(campaignId: string): void {
    const campaign = campaignRegistry.get(campaignId)
    if (campaign) {
      this.currentCampaignId = campaignId
      this.currentLevelIndex = 0
      this.unlockedLevels.clear()
      // Unlock first level
      if (campaign.levels.length > 0) {
        this.unlockedLevels.add(campaign.levels[0])
      }
      // In admin mode, unlock all levels
      if (this.isAdminMode) {
        campaign.levels.forEach(id => this.unlockedLevels.add(id))
      }
    }
  }

  /**
   * Check if double jump is unlocked for a level ID
   */
  hasDoubleJump(levelId: string): boolean {
    return hasCampaignDoubleJump(this.currentCampaign, levelId)
  }

  /**
   * Get the next level ID
   */
  getNextLevelId(currentLevelId: string): string | null {
    return getCampaignNextLevelId(this.currentCampaign, currentLevelId)
  }

  /**
   * Check if level is the last in campaign
   */
  isLastLevel(levelId: string): boolean {
    return isCampaignLastLevel(this.currentCampaign, levelId)
  }

  /**
   * Get level index in current campaign
   */
  getLevelIndex(levelId: string): number {
    return getCampaignLevelIndex(this.currentCampaign, levelId)
  }

  /**
   * Get campaign length
   */
  get campaignLength(): number {
    return getCampaignLength(this.currentCampaign)
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
   * @deprecated Use setCampaign() instead
   */
  initCampaign(levelIds?: string[]): void {
    // If levelIds provided, use them (backward compatibility)
    // Otherwise, use the current campaign
    const levels = levelIds ?? this.orderedLevels
    
    // Unlock first level
    if (levels.length > 0) {
      this.unlockedLevels.add(levels[0])
    }
    
    // In admin mode, unlock all levels
    if (this.isAdminMode) {
      levels.forEach(id => this.unlockedLevels.add(id))
    }
    
    this.currentLevelIndex = 0
  }

  /**
   * Get the current level ID
   * @deprecated Use getCurrentLevelIdFromCampaign() or access orderedLevels directly
   */
  getCurrentLevelId(orderedLevels?: string[]): string | null {
    const levels = orderedLevels ?? this.orderedLevels
    if (this.currentLevelIndex < 0 || this.currentLevelIndex >= levels.length) {
      return null
    }
    return levels[this.currentLevelIndex]
  }

  /**
   * Get the current level ID from the current campaign
   */
  getCurrentLevelIdFromCampaign(): string | null {
    return getCampaignLevelAtIndex(this.currentCampaign, this.currentLevelIndex) ?? null
  }

  /**
   * Check if there's a next level available
   * @deprecated Use hasNextLevelInCampaign() instead
   */
  hasNextLevel(totalLevels?: number): boolean {
    const total = totalLevels ?? this.campaignLength
    return this.currentLevelIndex < total - 1
  }

  /**
   * Check if there's a next level in the current campaign
   */
  hasNextLevelInCampaign(): boolean {
    return this.currentLevelIndex < this.campaignLength - 1
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
   * @deprecated Use advanceToNextLevelInCampaign() instead
   */
  advanceToNextLevel(orderedLevels?: string[]): string | null {
    const levels = orderedLevels ?? this.orderedLevels
    
    this.currentLevelIndex += 1
    
    // Reset current level tracking
    this.currentLevelDeaths = 0
    this.currentLevelCoins = 0
    this.currentLevelStartTime = Date.now()
    
    if (this.currentLevelIndex >= levels.length) {
      // Campaign complete!
      this.screenState = 'campaign_complete'
      return null
    }
    
    // Unlock next level
    const nextLevelId = levels[this.currentLevelIndex]
    this.unlockedLevels.add(nextLevelId)
    
    this.screenState = 'playing'
    return nextLevelId
  }

  /**
   * Advance to next level in current campaign
   */
  advanceToNextLevelInCampaign(): string | null {
    return this.advanceToNextLevel()
  }

  /**
   * Jump to a specific level (admin mode)
   * @deprecated Use jumpToLevelInCampaign() instead
   */
  jumpToLevel(levelIndex: number, orderedLevels?: string[]): string | null {
    const levels = orderedLevels ?? this.orderedLevels
    
    if (!this.isAdminMode) return null
    if (levelIndex < 0 || levelIndex >= levels.length) return null
    
    this.currentLevelIndex = levelIndex
    this.currentLevelDeaths = 0
    this.currentLevelCoins = 0
    this.currentLevelStartTime = Date.now()
    this.screenState = 'playing'
    
    return levels[levelIndex]
  }

  /**
   * Jump to a specific level in current campaign (admin mode)
   */
  jumpToLevelInCampaign(levelIndex: number): string | null {
    return this.jumpToLevel(levelIndex)
  }

  /**
   * Jump to a specific level by ID (admin mode)
   */
  jumpToLevelById(levelId: string): string | null {
    const index = this.getLevelIndex(levelId)
    if (index === -1) return null
    return this.jumpToLevel(index)
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
