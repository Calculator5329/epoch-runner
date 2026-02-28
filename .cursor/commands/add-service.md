---
description: Create a new stateless service following the three-layer architecture
---

Help the user create a new service following Epoch Runner patterns.

**Ask the user for:**
1. Service name (e.g., "Audio", "Particle", "Save")
2. Brief description of what it does
3. Which stores it will need to interact with

**Then create** `src/services/{Name}Service.ts`:

```typescript
import type { PlayerStore } from '../stores/PlayerStore'
import type { LevelStore } from '../stores/LevelStore'
import type { GameStore } from '../stores/GameStore'
// Add other store imports as needed

/**
 * {Name}Service - {description}
 * 
 * Stateless service that {what it does}.
 * Receives stores as parameters, never holds store references.
 */
class {Name}Service {
  // Configuration state only (e.g., canvas context)
  // private ctx: CanvasRenderingContext2D | null = null

  /**
   * Initialize the service (if needed)
   */
  init(/* config params */): void {
    // Setup code
  }

  /**
   * Main update method - called each frame if applicable
   */
  update(
    deltaTime: number,
    playerStore: PlayerStore,
    levelStore: LevelStore,
    gameStore: GameStore
  ): void {
    // Service logic here
    // Read from stores
    // Perform operations
    // Write back to stores
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Cleanup if needed
  }
}

// Singleton instance
export const {name}Service = new {Name}Service()
```

**Key patterns:**
- ✅ Services are stateless singletons
- ✅ Stores passed as method parameters, never stored
- ✅ No MobX (`makeAutoObservable`) in services
- ✅ No React/UI imports
- ✅ Export singleton at bottom: `export const fooService = new FooService()`

**If it needs to be called in the game loop:**
Update `GameLoopService.ts` tick method to call the new service in the correct order:
1. InputService
2. PlayerStore.applyInput()
3. {NewService if before physics}
4. PhysicsService
5. {NewService if after physics}
6. CameraService
7. CanvasRenderer
