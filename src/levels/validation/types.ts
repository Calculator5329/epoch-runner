/**
 * Validation Types - Types for the level validation pipeline
 */

import type { LevelDefinition } from '../types'

/**
 * Severity levels for validation results
 */
export type ValidationSeverity = 'error' | 'warning' | 'info'

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  /** Unique code for this type of issue */
  code: string
  
  /** Human-readable message */
  message: string
  
  /** Severity level */
  severity: ValidationSeverity
  
  /** Rule that generated this issue */
  rule: string
  
  /** Location in the level (if applicable) */
  location?: {
    col?: number
    row?: number
    section?: string
  }
  
  /** Suggested fix (if available) */
  suggestion?: string
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Whether the level passed validation (no errors) */
  valid: boolean
  
  /** List of all issues found */
  issues: ValidationIssue[]
  
  /** Count by severity */
  counts: {
    errors: number
    warnings: number
    info: number
  }
  
  /** Validation timestamp */
  timestamp: number
  
  /** Time taken to validate (ms) */
  duration: number
}

/**
 * Validation rule function
 */
export type ValidationRule = (level: LevelDefinition) => ValidationIssue[]

/**
 * Validation rule definition
 */
export interface ValidationRuleDefinition {
  /** Unique identifier for this rule */
  id: string
  
  /** Human-readable name */
  name: string
  
  /** Description of what this rule checks */
  description: string
  
  /** Default severity for issues from this rule */
  defaultSeverity: ValidationSeverity
  
  /** Whether this rule is enabled by default */
  enabledByDefault: boolean
  
  /** Category for grouping rules */
  category: ValidationRuleCategory
  
  /** The validation function */
  validate: ValidationRule
}

/**
 * Categories for organizing validation rules
 */
export type ValidationRuleCategory = 
  | 'structure'    // Basic level structure (dimensions, grid)
  | 'playability'  // Can the level be completed
  | 'gameplay'     // Gameplay quality (difficulty, balance)
  | 'assets'       // Asset references and resources
  | 'metadata'     // Metadata completeness
  | 'compatibility' // Version and dependency checks

/**
 * Configuration for validation
 */
export interface ValidationConfig {
  /** Rules to enable (by ID) */
  enabledRules?: string[]
  
  /** Rules to disable (by ID) */
  disabledRules?: string[]
  
  /** Severity overrides (rule ID -> severity) */
  severityOverrides?: Record<string, ValidationSeverity>
  
  /** Stop on first error */
  stopOnFirstError?: boolean
  
  /** Include info-level issues */
  includeInfo?: boolean
}
