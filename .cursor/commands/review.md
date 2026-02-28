# Quick Review

Run TypeScript type checks and ESLint to catch bugs and code quality issues.

## Instructions

1. **Run TypeScript type checking**
   ```bash
   npx tsc --noEmit
   ```

2. **Run ESLint**
   ```bash
   npx eslint src --ext .ts,.tsx
   ```

3. **Fix any issues found**
   - For TypeScript errors: Fix type mismatches, missing imports, incorrect types
   - For ESLint errors: Remove unused imports/variables, fix code style issues
   - For ESLint warnings: Address if straightforward, otherwise note them

4. **Re-run checks** to verify all issues are resolved

## Conventions

- Prefix intentionally unused parameters with underscore (e.g., `_unusedParam`)
- Remove unused imports rather than commenting them out
- Prefer `const` over `let` when variable is never reassigned

## Output

Report:
- Number of issues found and fixed
- Summary of changes made
- Any remaining warnings that couldn't be auto-fixed
