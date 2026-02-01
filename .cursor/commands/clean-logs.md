---
description: Find and remove unnecessary console.log statements from the codebase
---

Clean up debug/development console.log statements that are no longer needed.

## What to Remove

```typescript
// ❌ Debug logs - REMOVE
console.log('here')
console.log('test')
console.log('debugging...')
console.log(someVariable)
console.log('value:', value)
console.log('state', { player, level })

// ❌ Temporary trace logs - REMOVE
console.log('>>> entering function')
console.log('<<< exiting function')
console.log('checkpoint 1')
```

## What to Keep

```typescript
// ✅ Error handling - KEEP
console.error('Failed to load level:', error)

// ✅ Warnings about important issues - KEEP
console.warn('Level has no goal defined')

// ✅ Intentional startup/init messages - KEEP (if brief)
console.log('Game initialized, version:', VERSION)
```

## Process

1. **Search** for console.log statements in `src/` directory
2. **Review** each occurrence in context
3. **Remove** logs that are:
   - Generic debug output (`'here'`, `'test'`, variable dumps)
   - Leftover from debugging sessions
   - Commented-out logs (delete entirely)
   - Overly verbose runtime logging
4. **Keep** logs that are:
   - Error reporting (`console.error`)
   - Meaningful warnings (`console.warn`)
   - Intentional production logging

## Quick Search Command

```
rg "console\.(log|debug)" src/ --type ts --type tsx
```

After cleanup, verify the game still runs correctly.
