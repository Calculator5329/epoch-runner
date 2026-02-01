# Code Review

Review the codebase for issues and improvements.

## Instructions

Perform a comprehensive code review of the Epoch Runner codebase:

### 1. Critical Issues (Fix Immediately)
Scan for and fix:
- **Runtime errors**: Null/undefined access, type mismatches, missing imports
- **Logic bugs**: Infinite loops, off-by-one errors, race conditions
- **Memory leaks**: Unremoved event listeners, uncleaned intervals/timeouts
- **Security issues**: Exposed secrets, unsafe data handling
- **Broken functionality**: Features that don't work as intended

### 2. Architecture Violations
Check for violations of the three-layer architecture:
- UI components importing services directly (should go through stores)
- Services importing from UI layer
- Features importing from other features (should use stores)
- Business logic in UI components (should be in stores)

### 3. Code Quality Issues
Look for:
- Unused imports, variables, or functions
- Duplicate code that should be extracted
- Missing error handling
- Inconsistent naming conventions
- Magic numbers without constants
- Missing TypeScript types (any, implicit any)

### 4. Performance Concerns
Identify:
- Unnecessary re-renders in React components
- Missing memoization where beneficial
- Inefficient algorithms (O(n²) where O(n) possible)
- Large objects being recreated each frame

### 5. Recommended Improvements
Suggest enhancements for:
- Code readability and maintainability
- Better separation of concerns
- Improved type safety
- More robust error handling
- Better developer experience

## Output Format

Organize findings by severity:

```
## Critical Issues (Must Fix)
- [File:Line] Description of issue
  - Fix: What to change

## Architecture Violations
- [File] Description of violation
  - Recommendation: How to fix

## Code Quality
- [File:Line] Issue description
  - Suggestion: Improvement

## Performance
- [File] Performance concern
  - Optimization: Suggested change

## Improvements
- [Area] Enhancement opportunity
  - Benefit: Why this helps
```

## Scope

Focus on:
- `src/` directory (main application code)
- Exclude `node_modules/`, build outputs, and generated files

## Action

After the review, fix all Critical Issues automatically. Present Architecture Violations, Code Quality, Performance, and Improvements as recommendations for user approval.
