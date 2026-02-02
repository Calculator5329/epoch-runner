/**
 * Validation Module - Level validation pipeline
 * 
 * Provides comprehensive validation for level definitions including:
 * - Structure validation (dimensions, grid)
 * - Playability checks (spawn, goal, reachability)
 * - Gameplay quality (balance, difficulty)
 * - Metadata completeness
 */

import type { LevelDefinition } from '../types'
import type { 
  ValidationResult, 
  ValidationConfig, 
  ValidationIssue,
  ValidationRuleDefinition,
  ValidationSeverity,
} from './types'
import { ALL_RULES } from './rules'

// Re-export types and rules
export * from './types'
export * from './rules'

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: ValidationConfig = {
  includeInfo: true,
  stopOnFirstError: false,
}

/**
 * Run validation on a level definition
 */
export function validateLevel(
  level: LevelDefinition,
  config: ValidationConfig = {}
): ValidationResult {
  const startTime = performance.now()
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  
  const issues: ValidationIssue[] = []
  
  // Determine which rules to run
  const rulesToRun = getRulesToRun(mergedConfig)
  
  // Run each rule
  for (const rule of rulesToRun) {
    const ruleIssues = rule.validate(level)
    
    // Apply severity overrides
    for (const issue of ruleIssues) {
      if (mergedConfig.severityOverrides?.[rule.id]) {
        issue.severity = mergedConfig.severityOverrides[rule.id]
      }
    }
    
    // Filter by severity
    const filteredIssues = ruleIssues.filter(issue => {
      if (!mergedConfig.includeInfo && issue.severity === 'info') {
        return false
      }
      return true
    })
    
    issues.push(...filteredIssues)
    
    // Stop on first error if configured
    if (mergedConfig.stopOnFirstError && filteredIssues.some(i => i.severity === 'error')) {
      break
    }
  }
  
  // Count by severity
  const counts = {
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }
  
  const endTime = performance.now()
  
  return {
    valid: counts.errors === 0,
    issues,
    counts,
    timestamp: Date.now(),
    duration: Math.round(endTime - startTime),
  }
}

/**
 * Quick validation - only checks critical rules
 */
export function quickValidate(level: LevelDefinition): ValidationResult {
  return validateLevel(level, {
    enabledRules: ['dimensions', 'grid-matches', 'spawn-valid', 'has-goal'],
    includeInfo: false,
  })
}

/**
 * Full validation - all rules including info
 */
export function fullValidate(level: LevelDefinition): ValidationResult {
  return validateLevel(level, {
    includeInfo: true,
  })
}

/**
 * Get rules to run based on config
 */
function getRulesToRun(config: ValidationConfig): ValidationRuleDefinition[] {
  let rules = [...ALL_RULES]
  
  // If specific rules are enabled, only use those
  if (config.enabledRules && config.enabledRules.length > 0) {
    rules = rules.filter(rule => config.enabledRules!.includes(rule.id))
  } else {
    // Otherwise, start with default enabled rules
    rules = rules.filter(rule => rule.enabledByDefault)
  }
  
  // Remove disabled rules
  if (config.disabledRules && config.disabledRules.length > 0) {
    rules = rules.filter(rule => !config.disabledRules!.includes(rule.id))
  }
  
  return rules
}

/**
 * Format validation result as a string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []
  
  if (result.valid) {
    lines.push('✓ Level is valid')
  } else {
    lines.push('✗ Level has validation errors')
  }
  
  lines.push(`  ${result.counts.errors} errors, ${result.counts.warnings} warnings, ${result.counts.info} info`)
  lines.push('')
  
  // Group issues by severity
  const severityOrder: ValidationSeverity[] = ['error', 'warning', 'info']
  const severityIcons: Record<ValidationSeverity, string> = {
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  }
  
  for (const severity of severityOrder) {
    const severityIssues = result.issues.filter(i => i.severity === severity)
    if (severityIssues.length === 0) continue
    
    for (const issue of severityIssues) {
      const icon = severityIcons[severity]
      const location = issue.location 
        ? ` at (${issue.location.col ?? '?'}, ${issue.location.row ?? '?'})`
        : ''
      lines.push(`${icon} [${issue.rule}] ${issue.message}${location}`)
      if (issue.suggestion) {
        lines.push(`  → ${issue.suggestion}`)
      }
    }
  }
  
  lines.push('')
  lines.push(`Validated in ${result.duration}ms`)
  
  return lines.join('\n')
}

/**
 * Validation service class for stateful validation
 */
class ValidationServiceClass {
  private customRules: ValidationRuleDefinition[] = []
  
  /**
   * Register a custom validation rule
   */
  registerRule(rule: ValidationRuleDefinition): void {
    this.customRules.push(rule)
  }
  
  /**
   * Unregister a custom rule by ID
   */
  unregisterRule(ruleId: string): void {
    this.customRules = this.customRules.filter(r => r.id !== ruleId)
  }
  
  /**
   * Get all registered rules (built-in + custom)
   */
  getAllRules(): ValidationRuleDefinition[] {
    return [...ALL_RULES, ...this.customRules]
  }
  
  /**
   * Validate with custom rules included
   */
  validate(level: LevelDefinition, config?: ValidationConfig): ValidationResult {
    // Temporarily add custom rules to ALL_RULES
    const allWithCustom = [...ALL_RULES, ...this.customRules]
    
    const startTime = performance.now()
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }
    const issues: ValidationIssue[] = []
    
    // Determine which rules to run
    let rulesToRun = [...allWithCustom]
    
    if (mergedConfig.enabledRules && mergedConfig.enabledRules.length > 0) {
      rulesToRun = rulesToRun.filter(rule => mergedConfig.enabledRules!.includes(rule.id))
    } else {
      rulesToRun = rulesToRun.filter(rule => rule.enabledByDefault)
    }
    
    if (mergedConfig.disabledRules && mergedConfig.disabledRules.length > 0) {
      rulesToRun = rulesToRun.filter(rule => !mergedConfig.disabledRules!.includes(rule.id))
    }
    
    // Run each rule
    for (const rule of rulesToRun) {
      const ruleIssues = rule.validate(level)
      
      for (const issue of ruleIssues) {
        if (mergedConfig.severityOverrides?.[rule.id]) {
          issue.severity = mergedConfig.severityOverrides[rule.id]
        }
      }
      
      const filteredIssues = ruleIssues.filter(issue => {
        if (!mergedConfig.includeInfo && issue.severity === 'info') {
          return false
        }
        return true
      })
      
      issues.push(...filteredIssues)
      
      if (mergedConfig.stopOnFirstError && filteredIssues.some(i => i.severity === 'error')) {
        break
      }
    }
    
    const counts = {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    }
    
    const endTime = performance.now()
    
    return {
      valid: counts.errors === 0,
      issues,
      counts,
      timestamp: Date.now(),
      duration: Math.round(endTime - startTime),
    }
  }
}

// Export singleton instance
export const validationService = new ValidationServiceClass()
