---
description: Create a new MobX store with proper architecture
---

Help the user create a new MobX store following Epoch Runner patterns.

**Ask the user for:**
1. Store name (e.g., "Campaign", "Inventory", "Audio")
2. Brief description of what state it will manage

**Then create:**

1. **Store file** at `src/stores/{Name}Store.ts`:

```typescript
import { makeAutoObservable } from 'mobx'

/**
 * {Name}Store - {description}
 * 
 * Manages {what kind of state}.
 */
export class {Name}Store {
  // Observable state
  // Example: isActive: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  // Computed properties (derived state)
  // get derivedValue(): Type { return ... }

  // Actions (state mutations)
  // setValue(v: Type): void { this.value = v }

  /**
   * Reset to initial state
   */
  reset(): void {
    // Reset all observable properties
  }
}
```

2. **Update RootStore.ts:**
   - Import the new store
   - Add property: `{name}Store: {Name}Store`
   - Initialize in constructor: `this.{name}Store = new {Name}Store()`
   - Add convenience hook at bottom:
   
```typescript
export function use{Name}Store(): {Name}Store {
  return useRootStore().{name}Store
}
```

**Checklist:**
- [ ] Store uses `makeAutoObservable(this)` in constructor
- [ ] Store has a `reset()` method
- [ ] RootStore imports and instantiates the store
- [ ] Convenience hook exported from RootStore
- [ ] No service imports in store (services are passed as parameters)
