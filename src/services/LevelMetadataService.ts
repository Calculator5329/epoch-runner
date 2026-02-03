/**
 * LevelMetadataService - Handles level metadata operations
 * 
 * Provides utilities for:
 * - Extracting and analyzing level metadata
 * - Computing derived metadata (coin count, difficulty estimation)
 * - Filtering and searching levels by metadata
 * - Validating metadata
 * 
 * Follows the Service pattern - stateless operations, no MobX.
 */

import type { LevelDefinition, LevelMetadata, LevelDifficulty } from '../levels/types'
import { TileTypeId, getTileType } from '../core/types/shapes'

/**
 * Level statistics computed from collision grid
 */
export interface LevelStatistics {
  /** Total number of tiles */
  totalTiles: number
  
  /** Count by tile category */
  tilesByCategory: {
    solid: number
    hazard: number
    pickup: number
    trigger: number
    empty: number
  }
  
  /** Number of coins */
  coinCount: number
  
  /** Number of power-ups */
  powerupCount: number
  
  /** Number of hazard tiles */
  hazardCount: number
  
  /** Number of enemies */
  enemyCount: number
  
  /** Number of checkpoints */
  checkpointCount: number
  
  /** Has a goal tile */
  hasGoal: boolean
  
  /** Level dimensions */
  dimensions: { width: number; height: number }
  
  /** Estimated difficulty based on hazard density */
  estimatedDifficulty: LevelDifficulty
}

/**
 * Filter options for level queries
 */
export interface LevelFilter {
  difficulty?: LevelDifficulty | LevelDifficulty[]
  tags?: string[]
  author?: string
  source?: LevelMetadata['source']
  packId?: string
  verified?: boolean
  minEstimatedTime?: number
  maxEstimatedTime?: number
}

/**
 * Sort options for level queries
 */
export interface LevelSort {
  field: 'name' | 'difficulty' | 'estimatedTime' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

/**
 * LevelMetadataService class
 */
class LevelMetadataServiceClass {
  /**
   * Compute statistics from a level definition
   */
  computeStatistics(level: LevelDefinition): LevelStatistics {
    const stats: LevelStatistics = {
      totalTiles: 0,
      tilesByCategory: {
        solid: 0,
        hazard: 0,
        pickup: 0,
        trigger: 0,
        empty: 0,
      },
      coinCount: 0,
      powerupCount: 0,
      hazardCount: 0,
      enemyCount: level.entities?.length ?? 0,
      checkpointCount: 0,
      hasGoal: false,
      dimensions: { width: level.width, height: level.height },
      estimatedDifficulty: 'unrated',
    }

    // Analyze collision grid
    for (const row of level.collision) {
      for (const tileId of row) {
        stats.totalTiles++
        
        if (tileId === TileTypeId.EMPTY) {
          stats.tilesByCategory.empty++
          continue
        }
        
        const tileType = getTileType(tileId)
        
        switch (tileType.category) {
          case 'solid':
            stats.tilesByCategory.solid++
            break
          case 'hazard':
            stats.tilesByCategory.hazard++
            stats.hazardCount++
            break
          case 'pickup':
            stats.tilesByCategory.pickup++
            if (tileId === TileTypeId.COIN) {
              stats.coinCount++
            } else {
              stats.powerupCount++
            }
            break
          case 'trigger':
            stats.tilesByCategory.trigger++
            if (tileId === TileTypeId.GOAL) {
              stats.hasGoal = true
            } else if (tileId === TileTypeId.CHECKPOINT) {
              stats.checkpointCount++
            }
            break
          default:
            // decoration
            break
        }
      }
    }

    // Estimate difficulty based on hazard density
    stats.estimatedDifficulty = this.estimateDifficulty(stats)

    return stats
  }

  /**
   * Estimate difficulty from statistics
   */
  estimateDifficulty(stats: LevelStatistics): LevelDifficulty {
    const totalPlayableArea = stats.totalTiles - stats.tilesByCategory.solid
    if (totalPlayableArea === 0) return 'unrated'
    
    const hazardDensity = stats.hazardCount / totalPlayableArea
    const enemyFactor = stats.enemyCount * 0.05
    const difficultyScore = hazardDensity + enemyFactor
    
    // Adjust for checkpoints (more checkpoints = easier)
    const checkpointAdjustment = stats.checkpointCount * 0.02
    const adjustedScore = Math.max(0, difficultyScore - checkpointAdjustment)
    
    if (adjustedScore < 0.02) return 'easy'
    if (adjustedScore < 0.05) return 'normal'
    if (adjustedScore < 0.1) return 'hard'
    return 'expert'
  }

  /**
   * Estimate completion time in seconds
   */
  estimateCompletionTime(level: LevelDefinition): number {
    // Base time: 2 seconds per 10 tiles of width
    const baseTime = (level.width / 10) * 2
    
    // Add time for height (vertical sections)
    const verticalTime = (level.height / 15) * 3
    
    // Add time for hazards and enemies
    const stats = this.computeStatistics(level)
    const hazardTime = stats.hazardCount * 0.5
    const enemyTime = stats.enemyCount * 2
    
    // Add time for collecting coins (optional but common)
    const coinTime = stats.coinCount * 0.3
    
    return Math.round(baseTime + verticalTime + hazardTime + enemyTime + coinTime)
  }

  /**
   * Generate metadata for a level
   */
  generateMetadata(level: LevelDefinition): LevelMetadata {
    const stats = this.computeStatistics(level)
    const estimatedTime = this.estimateCompletionTime(level)
    
    return {
      difficulty: stats.estimatedDifficulty,
      estimatedTime,
      createdAt: level.metadata?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      verified: false,
      ...level.metadata,
    }
  }

  /**
   * Merge existing metadata with computed values
   */
  enrichMetadata(level: LevelDefinition): LevelDefinition {
    const generated = this.generateMetadata(level)
    
    return {
      ...level,
      metadata: {
        ...generated,
        ...level.metadata,
        // Always update computed values
        estimatedTime: generated.estimatedTime,
        updatedAt: Date.now(),
      },
    }
  }

  /**
   * Filter levels by criteria
   */
  filterLevels(levels: LevelDefinition[], filter: LevelFilter): LevelDefinition[] {
    return levels.filter(level => {
      const meta = level.metadata
      
      // Difficulty filter
      if (filter.difficulty) {
        const difficulties = Array.isArray(filter.difficulty) 
          ? filter.difficulty 
          : [filter.difficulty]
        if (!meta?.difficulty || !difficulties.includes(meta.difficulty)) {
          return false
        }
      }
      
      // Tags filter (any match)
      if (filter.tags && filter.tags.length > 0) {
        if (!meta?.tags || !filter.tags.some(tag => meta.tags!.includes(tag))) {
          return false
        }
      }
      
      // Author filter
      if (filter.author) {
        if (level.author?.toLowerCase() !== filter.author.toLowerCase()) {
          return false
        }
      }
      
      // Source filter
      if (filter.source) {
        if (meta?.source !== filter.source) {
          return false
        }
      }
      
      // Pack filter
      if (filter.packId) {
        if (meta?.packId !== filter.packId) {
          return false
        }
      }
      
      // Verified filter
      if (filter.verified !== undefined) {
        if (meta?.verified !== filter.verified) {
          return false
        }
      }
      
      // Time range filters
      if (filter.minEstimatedTime !== undefined) {
        if (meta?.estimatedTime == null || meta.estimatedTime < filter.minEstimatedTime) {
          return false
        }
      }
      if (filter.maxEstimatedTime !== undefined) {
        if (meta?.estimatedTime == null || meta.estimatedTime > filter.maxEstimatedTime) {
          return false
        }
      }
      
      return true
    })
  }

  /**
   * Sort levels
   */
  sortLevels(levels: LevelDefinition[], sort: LevelSort): LevelDefinition[] {
    const sortedLevels = [...levels]
    
    const difficultyOrder: Record<LevelDifficulty, number> = {
      easy: 0,
      normal: 1,
      hard: 2,
      expert: 3,
      unrated: 4,
    }
    
    sortedLevels.sort((a, b) => {
      let comparison = 0
      
      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'difficulty': {
          const aDiff = difficultyOrder[a.metadata?.difficulty ?? 'unrated']
          const bDiff = difficultyOrder[b.metadata?.difficulty ?? 'unrated']
          comparison = aDiff - bDiff
          break
        }
        case 'estimatedTime':
          comparison = (a.metadata?.estimatedTime ?? 0) - (b.metadata?.estimatedTime ?? 0)
          break
        case 'createdAt':
          comparison = (a.metadata?.createdAt ?? 0) - (b.metadata?.createdAt ?? 0)
          break
        case 'updatedAt':
          comparison = (a.metadata?.updatedAt ?? 0) - (b.metadata?.updatedAt ?? 0)
          break
      }
      
      return sort.direction === 'desc' ? -comparison : comparison
    })
    
    return sortedLevels
  }

  /**
   * Search levels by text query
   */
  searchLevels(levels: LevelDefinition[], query: string): LevelDefinition[] {
    const lowerQuery = query.toLowerCase()
    
    return levels.filter(level => {
      // Search in name
      if (level.name.toLowerCase().includes(lowerQuery)) return true
      
      // Search in description
      if (level.description?.toLowerCase().includes(lowerQuery)) return true
      
      // Search in author
      if (level.author?.toLowerCase().includes(lowerQuery)) return true
      
      // Search in tags
      if (level.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        return true
      }
      
      return false
    })
  }

  /**
   * Validate metadata
   */
  validateMetadata(metadata: LevelMetadata): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (metadata.estimatedTime !== undefined && metadata.estimatedTime < 0) {
      errors.push('Estimated time must be non-negative')
    }
    
    if (metadata.version && !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      errors.push('Version must be in semver format (e.g., 1.0.0)')
    }
    
    if (metadata.minGameVersion && !/^\d+\.\d+\.\d+$/.test(metadata.minGameVersion)) {
      errors.push('Min game version must be in semver format')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Export singleton instance
export const levelMetadataService = new LevelMetadataServiceClass()

// Export class for testing
export { LevelMetadataServiceClass }
