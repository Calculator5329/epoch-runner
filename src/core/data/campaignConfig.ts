/**
 * Campaign Configuration Module
 * 
 * Data-driven campaign definitions that can be extended for:
 * - Multiple built-in campaigns
 * - Custom pack campaigns
 * - User-created campaigns
 */

/**
 * Campaign definition interface
 */
export interface CampaignDefinition {
  /** Unique identifier for this campaign */
  id: string
  
  /** Display name */
  name: string
  
  /** Description for campaign select screen */
  description?: string
  
  /** Author (for custom campaigns) */
  author?: string
  
  /** Ordered list of level IDs in this campaign */
  levels: string[]
  
  /** Default level to start on (usually first in list) */
  defaultLevelId?: string
  
  /** Level index at which double jump is unlocked */
  doubleJumpUnlockIndex: number
  
  /** Whether this is the main/default campaign */
  isDefault?: boolean
  
  /** Pack ID this campaign belongs to (for custom packs) */
  packId?: string
  
  /** Version of this campaign definition */
  version?: string
}

/**
 * Main campaign - the built-in progression
 */
export const MAIN_CAMPAIGN: CampaignDefinition = {
  id: 'main',
  name: 'Epoch Runner',
  description: 'The main campaign - journey through time to save the future!',
  levels: [
    'level_0_basic',
    'level_1_shapes',
    'level_2_hazards',
    'level_3_coins',
    'level_4_powerup',
    'level_5_gauntlet',
    'level_6_et_custom_1',
    'level_7_enemies',
    'level_8_powerups',
    'level_9_et_custom_2',
  ],
  defaultLevelId: 'level_0_basic',
  doubleJumpUnlockIndex: 5, // Level 5 (The Gauntlet) and above
  isDefault: true,
  version: '1.0.0',
}

/**
 * Tutorial campaign - subset of main for quick onboarding
 */
export const TUTORIAL_CAMPAIGN: CampaignDefinition = {
  id: 'tutorial',
  name: 'Tutorial',
  description: 'Learn the basics of Epoch Runner',
  levels: [
    'level_0_basic',
    'level_1_shapes',
    'level_2_hazards',
  ],
  defaultLevelId: 'level_0_basic',
  doubleJumpUnlockIndex: 999, // No double jump in tutorial
  version: '1.0.0',
}

/**
 * All built-in campaigns
 */
export const BUILT_IN_CAMPAIGNS: CampaignDefinition[] = [
  MAIN_CAMPAIGN,
  TUTORIAL_CAMPAIGN,
]

/**
 * Campaign registry - allows runtime registration of campaigns
 */
class CampaignRegistryClass {
  private campaigns: Map<string, CampaignDefinition> = new Map()
  private defaultCampaignId: string = 'main'
  private listeners: Set<() => void> = new Set()

  constructor() {
    // Register built-in campaigns
    BUILT_IN_CAMPAIGNS.forEach(campaign => {
      this.register(campaign)
      if (campaign.isDefault) {
        this.defaultCampaignId = campaign.id
      }
    })
  }

  /**
   * Register a campaign
   */
  register(campaign: CampaignDefinition): void {
    this.campaigns.set(campaign.id, campaign)
    if (campaign.isDefault) {
      this.defaultCampaignId = campaign.id
    }
    this.notifyListeners()
  }

  /**
   * Unregister a campaign
   */
  unregister(campaignId: string): void {
    this.campaigns.delete(campaignId)
    
    // Reset default if we just unregistered it
    if (this.defaultCampaignId === campaignId) {
      const firstRemaining = this.campaigns.keys().next().value
      this.defaultCampaignId = firstRemaining ?? 'main'
    }
    
    this.notifyListeners()
  }

  /**
   * Get a campaign by ID
   */
  get(campaignId: string): CampaignDefinition | undefined {
    return this.campaigns.get(campaignId)
  }

  /**
   * Get the default campaign
   */
  getDefault(): CampaignDefinition {
    return this.campaigns.get(this.defaultCampaignId) ?? MAIN_CAMPAIGN
  }

  /**
   * Get all registered campaigns
   */
  getAll(): CampaignDefinition[] {
    return Array.from(this.campaigns.values())
  }

  /**
   * Get all campaign IDs
   */
  getIds(): string[] {
    return Array.from(this.campaigns.keys())
  }

  /**
   * Set the default campaign
   */
  setDefault(campaignId: string): void {
    if (this.campaigns.has(campaignId)) {
      this.defaultCampaignId = campaignId
      this.notifyListeners()
    }
  }

  /**
   * Subscribe to registry changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Export singleton instance
export const campaignRegistry = new CampaignRegistryClass()

// ============================================
// Campaign Utility Functions
// ============================================

/**
 * Get level index in a campaign
 */
export function getCampaignLevelIndex(campaign: CampaignDefinition, levelId: string): number {
  return campaign.levels.indexOf(levelId)
}

/**
 * Get next level ID in a campaign
 */
export function getCampaignNextLevelId(campaign: CampaignDefinition, currentLevelId: string): string | null {
  const currentIndex = getCampaignLevelIndex(campaign, currentLevelId)
  if (currentIndex === -1 || currentIndex >= campaign.levels.length - 1) {
    return null
  }
  return campaign.levels[currentIndex + 1]
}

/**
 * Check if level is last in a campaign
 */
export function isCampaignLastLevel(campaign: CampaignDefinition, levelId: string): boolean {
  if (campaign.levels.length === 0) return false
  const index = getCampaignLevelIndex(campaign, levelId)
  if (index === -1) return false
  return index === campaign.levels.length - 1
}

/**
 * Check if double jump is unlocked for a level in a campaign
 */
export function hasCampaignDoubleJump(campaign: CampaignDefinition, levelId: string): boolean {
  const index = getCampaignLevelIndex(campaign, levelId)
  // Also return true for non-campaign levels (custom levels get double jump)
  return index === -1 || index >= campaign.doubleJumpUnlockIndex
}

/**
 * Get campaign length
 */
export function getCampaignLength(campaign: CampaignDefinition): number {
  return campaign.levels.length
}

/**
 * Get level ID at a specific index in a campaign
 */
export function getCampaignLevelAtIndex(campaign: CampaignDefinition, index: number): string | undefined {
  return campaign.levels[index]
}

/**
 * Check if a level is part of a campaign
 */
export function isLevelInCampaign(campaign: CampaignDefinition, levelId: string): boolean {
  return campaign.levels.includes(levelId)
}
