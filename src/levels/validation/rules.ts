/**
 * Validation Rules - Built-in validation rules for levels
 */

import type { LevelDefinition } from '../types'
import type { ValidationRuleDefinition, ValidationIssue } from './types'
import { TileTypeId, getTileType } from '../../core/types/shapes'
import { getEntityDefinition } from '../../core/types/entities'

// ============================================
// Structure Rules
// ============================================

/**
 * Check that level dimensions are valid
 */
export const ruleDimensions: ValidationRuleDefinition = {
  id: 'dimensions',
  name: 'Valid Dimensions',
  description: 'Level must have valid width and height',
  defaultSeverity: 'error',
  enabledByDefault: true,
  category: 'structure',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    if (level.width < 1) {
      issues.push({
        code: 'INVALID_WIDTH',
        message: `Level width must be at least 1 (got ${level.width})`,
        severity: 'error',
        rule: 'dimensions',
      })
    }
    
    if (level.height < 1) {
      issues.push({
        code: 'INVALID_HEIGHT',
        message: `Level height must be at least 1 (got ${level.height})`,
        severity: 'error',
        rule: 'dimensions',
      })
    }
    
    if (level.width > 500 || level.height > 500) {
      issues.push({
        code: 'EXCESSIVE_SIZE',
        message: `Level is very large (${level.width}x${level.height}), may affect performance`,
        severity: 'warning',
        rule: 'dimensions',
      })
    }
    
    return issues
  },
}

/**
 * Check that collision grid matches dimensions
 */
export const ruleGridMatches: ValidationRuleDefinition = {
  id: 'grid-matches',
  name: 'Grid Matches Dimensions',
  description: 'Collision grid must match declared dimensions',
  defaultSeverity: 'error',
  enabledByDefault: true,
  category: 'structure',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    if (level.collision.length !== level.height) {
      issues.push({
        code: 'ROW_COUNT_MISMATCH',
        message: `Collision grid has ${level.collision.length} rows, expected ${level.height}`,
        severity: 'error',
        rule: 'grid-matches',
      })
    }
    
    for (let row = 0; row < level.collision.length; row++) {
      if (level.collision[row].length !== level.width) {
        issues.push({
          code: 'COL_COUNT_MISMATCH',
          message: `Row ${row} has ${level.collision[row].length} columns, expected ${level.width}`,
          severity: 'error',
          rule: 'grid-matches',
          location: { row },
        })
      }
    }
    
    return issues
  },
}

// ============================================
// Playability Rules
// ============================================

/**
 * Check that player spawn is valid
 */
export const ruleSpawnValid: ValidationRuleDefinition = {
  id: 'spawn-valid',
  name: 'Valid Player Spawn',
  description: 'Player spawn must be within bounds and not in a solid tile',
  defaultSeverity: 'error',
  enabledByDefault: true,
  category: 'playability',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    const { col, row } = level.playerSpawn
    
    // Check bounds
    if (col < 0 || col >= level.width) {
      issues.push({
        code: 'SPAWN_OUT_OF_BOUNDS_X',
        message: `Player spawn column ${col} is out of bounds (0-${level.width - 1})`,
        severity: 'error',
        rule: 'spawn-valid',
        location: { col, row },
      })
    }
    
    if (row < 0 || row >= level.height) {
      issues.push({
        code: 'SPAWN_OUT_OF_BOUNDS_Y',
        message: `Player spawn row ${row} is out of bounds (0-${level.height - 1})`,
        severity: 'error',
        rule: 'spawn-valid',
        location: { col, row },
      })
    }
    
    // Check not in solid tile
    if (col >= 0 && col < level.width && row >= 0 && row < level.height) {
      const spawnTile = level.collision[row]?.[col]
      if (spawnTile !== undefined) {
        const tileType = getTileType(spawnTile)
        if (tileType.category === 'solid') {
          issues.push({
            code: 'SPAWN_IN_SOLID',
            message: `Player spawn is inside a solid tile (${tileType.name})`,
            severity: 'error',
            rule: 'spawn-valid',
            location: { col, row },
            suggestion: 'Move the spawn point to an empty tile',
          })
        }
      }
    }
    
    return issues
  },
}

/**
 * Check that level has a goal
 */
export const ruleHasGoal: ValidationRuleDefinition = {
  id: 'has-goal',
  name: 'Has Goal Tile',
  description: 'Level must have at least one goal tile',
  defaultSeverity: 'error',
  enabledByDefault: true,
  category: 'playability',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    for (const row of level.collision) {
      for (const tile of row) {
        if (tile === TileTypeId.GOAL) {
          return [] // Found a goal
        }
      }
    }
    
    return [{
      code: 'NO_GOAL',
      message: 'Level has no goal tile',
      severity: 'error',
      rule: 'has-goal',
      suggestion: 'Add a goal tile (ID: 100) to the level',
    }]
  },
}

/**
 * Check that entities reference valid definitions
 */
export const ruleValidEntities: ValidationRuleDefinition = {
  id: 'valid-entities',
  name: 'Valid Entity References',
  description: 'All entities must reference valid definitions',
  defaultSeverity: 'error',
  enabledByDefault: true,
  category: 'playability',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    if (!level.entities) return issues
    
    level.entities.forEach((entity, index) => {
      const definition = getEntityDefinition(entity.definitionId)
      
      if (!definition) {
        issues.push({
          code: 'UNKNOWN_ENTITY',
          message: `Entity ${index} references unknown definition "${entity.definitionId}"`,
          severity: 'error',
          rule: 'valid-entities',
          location: { col: entity.position.col, row: entity.position.row },
        })
      }
      
      // Check entity position is in bounds
      if (entity.position.col < 0 || entity.position.col >= level.width ||
          entity.position.row < 0 || entity.position.row >= level.height) {
        issues.push({
          code: 'ENTITY_OUT_OF_BOUNDS',
          message: `Entity ${index} is positioned out of bounds`,
          severity: 'warning',
          rule: 'valid-entities',
          location: { col: entity.position.col, row: entity.position.row },
        })
      }
    })
    
    return issues
  },
}

// ============================================
// Gameplay Rules
// ============================================

/**
 * Check for hazards near spawn
 */
export const ruleNoHazardsAtSpawn: ValidationRuleDefinition = {
  id: 'no-hazards-spawn',
  name: 'No Hazards at Spawn',
  description: 'Player should not spawn directly on or next to hazards',
  defaultSeverity: 'warning',
  enabledByDefault: true,
  category: 'gameplay',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    const { col, row } = level.playerSpawn
    
    // Check 3x3 area around spawn
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const checkCol = col + dx
        const checkRow = row + dy
        
        if (checkCol < 0 || checkCol >= level.width ||
            checkRow < 0 || checkRow >= level.height) {
          continue
        }
        
        const tileId = level.collision[checkRow]?.[checkCol]
        if (tileId !== undefined) {
          const tileType = getTileType(tileId)
          if (tileType.category === 'hazard') {
            issues.push({
              code: 'HAZARD_NEAR_SPAWN',
              message: `Hazard tile found near spawn at (${checkCol}, ${checkRow})`,
              severity: 'warning',
              rule: 'no-hazards-spawn',
              location: { col: checkCol, row: checkRow },
              suggestion: 'Consider moving hazards away from spawn point',
            })
          }
        }
      }
    }
    
    return issues
  },
}

/**
 * Check for unreachable coins
 */
export const ruleReachableCoins: ValidationRuleDefinition = {
  id: 'reachable-coins',
  name: 'Reachable Coins',
  description: 'Coins should not be inside solid tiles',
  defaultSeverity: 'warning',
  enabledByDefault: true,
  category: 'gameplay',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    // Find all coins and check if surrounded by solids
    for (let row = 0; row < level.collision.length; row++) {
      for (let col = 0; col < level.collision[row].length; col++) {
        const tile = level.collision[row][col]
        if (tile === TileTypeId.COIN) {
          // Check if this coin is inside a solid block (shouldn't happen, but check)
          // A coin inside solid is when all 4 neighbors are solid
          let solidNeighbors = 0
          const neighbors = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1],
          ]
          
          for (const [nRow, nCol] of neighbors) {
            if (nRow < 0 || nRow >= level.height || nCol < 0 || nCol >= level.width) {
              solidNeighbors++ // Out of bounds counts as solid
              continue
            }
            const neighborTile = level.collision[nRow][nCol]
            const neighborType = getTileType(neighborTile)
            if (neighborType.category === 'solid') {
              solidNeighbors++
            }
          }
          
          if (solidNeighbors >= 4) {
            issues.push({
              code: 'UNREACHABLE_COIN',
              message: `Coin at (${col}, ${row}) appears to be surrounded by solid tiles`,
              severity: 'warning',
              rule: 'reachable-coins',
              location: { col, row },
            })
          }
        }
      }
    }
    
    return issues
  },
}

// ============================================
// Metadata Rules
// ============================================

/**
 * Check for missing metadata
 */
export const ruleMissingMetadata: ValidationRuleDefinition = {
  id: 'missing-metadata',
  name: 'Has Required Metadata',
  description: 'Level should have basic metadata filled in',
  defaultSeverity: 'info',
  enabledByDefault: true,
  category: 'metadata',
  validate: (level: LevelDefinition): ValidationIssue[] => {
    const issues: ValidationIssue[] = []
    
    if (!level.description) {
      issues.push({
        code: 'NO_DESCRIPTION',
        message: 'Level has no description',
        severity: 'info',
        rule: 'missing-metadata',
        suggestion: 'Add a description to help players understand the level',
      })
    }
    
    if (!level.author) {
      issues.push({
        code: 'NO_AUTHOR',
        message: 'Level has no author specified',
        severity: 'info',
        rule: 'missing-metadata',
      })
    }
    
    return issues
  },
}

// ============================================
// Export All Rules
// ============================================

export const ALL_RULES: ValidationRuleDefinition[] = [
  // Structure
  ruleDimensions,
  ruleGridMatches,
  
  // Playability
  ruleSpawnValid,
  ruleHasGoal,
  ruleValidEntities,
  
  // Gameplay
  ruleNoHazardsAtSpawn,
  ruleReachableCoins,
  
  // Metadata
  ruleMissingMetadata,
]

/**
 * Get rule by ID
 */
export function getRule(id: string): ValidationRuleDefinition | undefined {
  return ALL_RULES.find(rule => rule.id === id)
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: ValidationRuleDefinition['category']): ValidationRuleDefinition[] {
  return ALL_RULES.filter(rule => rule.category === category)
}
