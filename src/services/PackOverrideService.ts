/**
 * PackOverrideService - Handles parameter overrides from level packs
 * 
 * Allows level packs to customize game behavior without code changes:
 * - Physics parameters (gravity, jump velocity, move speed)
 * - Player parameters (starting lives, max health)
 * - Gameplay parameters (coin values, hazard damage)
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

/**
 * Physics parameter overrides
 */
export interface PhysicsOverrides {
  /** Gravity acceleration (pixels/second²) */
  gravity?: number
  /** Jump velocity (pixels/second, negative = up) */
  jumpVelocity?: number
  /** Movement speed (pixels/second) */
  moveSpeed?: number
  /** Maximum horizontal velocity */
  maxVelocityX?: number
  /** Maximum vertical velocity */
  maxVelocityY?: number
  /** Friction coefficient (0-1) */
  friction?: number
  /** Air control multiplier (0-1) */
  airControl?: number
}

/**
 * Player parameter overrides
 */
export interface PlayerOverrides {
  /** Starting lives for the level */
  startingLives?: number
  /** Maximum lives */
  maxLives?: number
  /** Base max jumps (1 = single, 2 = double) */
  baseMaxJumps?: number
  /** Invincibility duration after taking damage (ms) */
  invincibilityDuration?: number
}

/**
 * Gameplay parameter overrides
 */
export interface GameplayOverrides {
  /** Base coin value */
  coinValue?: number
  /** Triple jump power-up duration (seconds) */
  tripleJumpDuration?: number
  /** Speed boost duration (seconds) */
  speedBoostDuration?: number
  /** Speed boost multiplier */
  speedBoostMultiplier?: number
  /** Super jump duration (seconds) */
  superJumpDuration?: number
  /** Super jump multiplier */
  superJumpMultiplier?: number
  /** Invincibility power-up duration (seconds) */
  invincibilityPowerDuration?: number
}

/**
 * Visual parameter overrides
 */
export interface VisualOverrides {
  /** Background parallax speed (0-1) */
  parallaxSpeed?: number
  /** Camera deadzone width (pixels) */
  cameraDeadzoneX?: number
  /** Camera deadzone height (pixels) */
  cameraDeadzoneY?: number
  /** Camera smoothing factor */
  cameraSmoothing?: number
}

/**
 * Complete pack override configuration
 */
export interface PackOverrides {
  physics?: PhysicsOverrides
  player?: PlayerOverrides
  gameplay?: GameplayOverrides
  visual?: VisualOverrides
}

/**
 * Extended pack manifest with override support
 */
export interface ExtendedPackManifest {
  formatVersion: number
  name: string
  author?: string
  description?: string
  version?: string
  
  // Level ID (for multiple levels per pack in future)
  levelId?: string
  
  // Asset mappings (existing)
  sprites: {
    tiles: Record<string, string>
    entities?: Record<string, string>
    player?: {
      idle?: string
      run?: string
      run1?: string
      run2?: string
      jump?: string
    }
    background?: string
    ui?: Record<string, string>
  }
  
  audio?: {
    music?: string
    sfx?: Record<string, string>
  }
  
  hitboxes?: string
  
  // New: Parameter overrides
  overrides?: PackOverrides
  
  // New: Theme ID (for future theme system)
  themeId?: string
  
  // New: Campaign integration
  campaign?: {
    /** Add to an existing campaign */
    appendToCampaign?: string
    /** Or define a new campaign */
    campaignId?: string
    campaignName?: string
    campaignOrder?: number
  }
  
  // New: Dependencies on other packs
  dependencies?: string[]
  
  // New: Pack metadata
  tags?: string[]
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert'
  estimatedTime?: number // seconds
}

/**
 * Active override state
 */
interface ActiveOverrides {
  packId: string | null
  overrides: PackOverrides | null
}

/**
 * PackOverrideService class - manages pack parameter overrides
 */
class PackOverrideServiceClass {
  private activeOverrides: ActiveOverrides = {
    packId: null,
    overrides: null,
  }
  
  private listeners: Set<() => void> = new Set()

  /**
   * Apply overrides from a pack
   */
  applyOverrides(packId: string, overrides: PackOverrides): void {
    this.activeOverrides = {
      packId,
      overrides,
    }
    this.notifyListeners()
  }

  /**
   * Clear active overrides
   */
  clearOverrides(): void {
    this.activeOverrides = {
      packId: null,
      overrides: null,
    }
    this.notifyListeners()
  }

  /**
   * Check if a pack has active overrides
   */
  hasActiveOverrides(): boolean {
    return this.activeOverrides.packId !== null
  }

  /**
   * Get the active pack ID
   */
  getActivePackId(): string | null {
    return this.activeOverrides.packId
  }

  /**
   * Get all active overrides
   */
  getOverrides(): PackOverrides | null {
    return this.activeOverrides.overrides
  }

  /**
   * Get physics overrides with defaults
   */
  getPhysics<K extends keyof PhysicsOverrides>(key: K, defaultValue: PhysicsOverrides[K]): PhysicsOverrides[K] {
    return this.activeOverrides.overrides?.physics?.[key] ?? defaultValue
  }

  /**
   * Get player overrides with defaults
   */
  getPlayer<K extends keyof PlayerOverrides>(key: K, defaultValue: PlayerOverrides[K]): PlayerOverrides[K] {
    return this.activeOverrides.overrides?.player?.[key] ?? defaultValue
  }

  /**
   * Get gameplay overrides with defaults
   */
  getGameplay<K extends keyof GameplayOverrides>(key: K, defaultValue: GameplayOverrides[K]): GameplayOverrides[K] {
    return this.activeOverrides.overrides?.gameplay?.[key] ?? defaultValue
  }

  /**
   * Get visual overrides with defaults
   */
  getVisual<K extends keyof VisualOverrides>(key: K, defaultValue: VisualOverrides[K]): VisualOverrides[K] {
    return this.activeOverrides.overrides?.visual?.[key] ?? defaultValue
  }

  /**
   * Parse overrides from a pack manifest
   */
  parseOverridesFromManifest(manifest: ExtendedPackManifest): PackOverrides | null {
    return manifest.overrides ?? null
  }

  /**
   * Validate override values
   */
  validateOverrides(overrides: PackOverrides): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate physics
    if (overrides.physics) {
      if (overrides.physics.gravity !== undefined && overrides.physics.gravity < 0) {
        errors.push('Gravity must be non-negative')
      }
      if (overrides.physics.friction !== undefined && (overrides.physics.friction < 0 || overrides.physics.friction > 1)) {
        errors.push('Friction must be between 0 and 1')
      }
      if (overrides.physics.airControl !== undefined && (overrides.physics.airControl < 0 || overrides.physics.airControl > 1)) {
        errors.push('Air control must be between 0 and 1')
      }
    }

    // Validate player
    if (overrides.player) {
      if (overrides.player.startingLives !== undefined && overrides.player.startingLives < 1) {
        errors.push('Starting lives must be at least 1')
      }
      if (overrides.player.baseMaxJumps !== undefined && (overrides.player.baseMaxJumps < 1 || overrides.player.baseMaxJumps > 5)) {
        errors.push('Base max jumps must be between 1 and 5')
      }
    }

    // Validate gameplay
    if (overrides.gameplay) {
      if (overrides.gameplay.coinValue !== undefined && overrides.gameplay.coinValue < 0) {
        errors.push('Coin value must be non-negative')
      }
      if (overrides.gameplay.speedBoostMultiplier !== undefined && overrides.gameplay.speedBoostMultiplier < 1) {
        errors.push('Speed boost multiplier must be at least 1')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Subscribe to override changes
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
export const packOverrideService = new PackOverrideServiceClass()

// Export class for testing
export { PackOverrideServiceClass }

// Export preset override templates
export const OVERRIDE_PRESETS = {
  /** Floaty physics - higher jumps, slower fall */
  floaty: {
    physics: {
      gravity: 1200,
      jumpVelocity: -650,
      airControl: 0.9,
    },
  } as PackOverrides,
  
  /** Speedy physics - faster movement */
  speedy: {
    physics: {
      moveSpeed: 400,
      maxVelocityX: 600,
      friction: 0.85,
    },
  } as PackOverrides,
  
  /** Hardcore mode - fewer lives, more difficult */
  hardcore: {
    player: {
      startingLives: 1,
      maxLives: 3,
    },
  } as PackOverrides,
  
  /** Easy mode - more lives, power-ups last longer */
  easy: {
    player: {
      startingLives: 5,
      maxLives: 10,
    },
    gameplay: {
      tripleJumpDuration: 15,
      speedBoostDuration: 12,
      invincibilityPowerDuration: 10,
    },
  } as PackOverrides,
} as const
