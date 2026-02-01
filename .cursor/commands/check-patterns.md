---
description: Validate code follows the three-layer architecture and project patterns
---

Review the current file or recent changes against Epoch Runner architecture rules.

**Check for these common violations:**

## Three-Layer Architecture

```
UI → Store → Service (one-way only!)
```

### UI Layer Violations

```typescript
// ❌ Business logic in component
const handleClick = () => {
  if (playerStore.isGrounded && playerStore.energy > 0) {
    playerStore.vy = -550
    playerStore.energy -= 10
  }
}

// ✅ Delegate to store
const handleClick = () => {
  playerStore.jump()
}
```

### Store Layer Violations

```typescript
// ❌ Store imports React
import { useEffect } from 'react'

// ❌ Store holds service reference
class PlayerStore {
  private physics = physicsService // WRONG
}

// ✅ Store receives service calls as method
applyPhysics(deltaTime: number): void {
  physicsService.update(deltaTime, this, levelStore)
}
```

### Service Layer Violations

```typescript
// ❌ Service imports store at class level
import { playerStore } from '../stores/PlayerStore'

// ❌ Service uses MobX
class BadService {
  @observable value = 0  // WRONG
}

// ✅ Service receives stores as parameters
update(deltaTime: number, player: PlayerStore): void {
  // Use player parameter, not import
}
```

## Naming Convention Checks

| Pattern | Check |
|---------|-------|
| Store files | `{Name}Store.ts` |
| Service files | `{Name}Service.ts` |
| Level files | `level_{name}.ts` |
| Level IDs | Match filename |
| Constants | `SCREAMING_SNAKE_CASE` |
| Classes | `PascalCase` |
| Functions | `camelCase` |

## Component Pattern Checks

- [ ] Uses `observer()` wrapper
- [ ] Uses named function: `observer(function Name() {})`
- [ ] Gets stores via hooks, not imports
- [ ] No business logic in handlers
- [ ] No cross-feature imports

## Level Pattern Checks

- [ ] Uses `createLevel()` helper
- [ ] Level ID matches filename
- [ ] Has ground and goal
- [ ] Player spawn not inside solid
- [ ] Grid dimensions match width/height

## Quick Fixes

If violations found, suggest the correct pattern from the rules:
- Store patterns: `.cursor/rules/store-patterns.mdc`
- Service patterns: `.cursor/rules/service-patterns.mdc`
- Component patterns: `.cursor/rules/react-components.mdc`
- Level patterns: `.cursor/rules/level-building.mdc`
