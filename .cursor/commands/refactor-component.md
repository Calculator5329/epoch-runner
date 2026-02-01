---
description: Refactor a component that has grown too large or violates patterns
---

Help refactor a React component that has accumulated too much responsibility.

**Common symptoms to look for:**

1. **Too many effects** - Multiple useEffect hooks doing different things
2. **Business logic in handlers** - Complex conditionals in onClick/onChange
3. **Multiple concerns** - Initialization, rendering, keyboard handling, file I/O all in one
4. **Too many state variables** - Mix of UI state and business state
5. **Long file** - Over 150 lines usually indicates need for splitting

**Refactoring strategies:**

## 1. Extract to Custom Hook

Move initialization/setup logic to a custom hook:

```typescript
// Before: All in component
export const GameCanvas = observer(function GameCanvas() {
  const canvasRef = useRef()
  
  useEffect(() => {
    // 30 lines of initialization...
  }, [])
  
  // ...
})

// After: Hook handles setup
function useGameInit(canvasRef: RefObject<HTMLCanvasElement>) {
  const rootStore = useRootStore()
  
  useEffect(() => {
    // Initialization logic moved here
  }, [])
  
  return { rootStore }
}

export const GameCanvas = observer(function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { rootStore } = useGameInit(canvasRef)
  // Cleaner component
})
```

## 2. Move Keyboard Handling to Service/Store

```typescript
// Before: In component
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.code === 'KeyR') rootStore.reset()
    if (e.code === 'Escape') gameStore.setPaused(!gameStore.isPaused)
    // ... more keys
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])

// After: In InputService or separate KeyboardService
// inputService.registerShortcut('KeyR', () => rootStore.reset())
```

## 3. Extract Sub-Components

Split UI into logical parts:

```typescript
// Before: Monolithic
export const GameCanvas = observer(function GameCanvas() {
  return (
    <div>
      <canvas ... />
      <div className="game-info">...</div>
      <div className="game-controls">...</div>
      <input type="file" ... />
    </div>
  )
})

// After: Composed
export const GameCanvas = observer(function GameCanvas() {
  return (
    <div className="game-container">
      <GameRenderer />
      <GameHUD />
      <GameControls />
      <LevelFileInput />
    </div>
  )
})
```

## 4. Move Logic to Store

If component is making decisions, move to store:

```typescript
// Before: Component decides
const handleAction = () => {
  if (gameStore.isPaused) return
  if (playerStore.isGrounded && playerStore.energy > 10) {
    playerStore.vy = -550
    playerStore.energy -= 10
  }
}

// After: Store method
const handleAction = () => gameStore.performAction()

// In GameStore
performAction(): void {
  if (this.isPaused) return
  // Logic here
}
```

**Steps to refactor:**

1. Identify which concerns are mixed (UI, business logic, initialization, events)
2. Decide where each concern belongs:
   - UI state → local useState
   - Game state → MobX store
   - Setup/teardown → custom hook or service
   - Event handling → service
3. Extract one concern at a time
4. Test after each extraction
5. Update imports to use barrel exports (`src/stores`, `src/services`)

**Files that commonly need this:**
- `GameCanvas.tsx` - handles too much (good candidate for splitting)
- Future `EditorCanvas.tsx` - will likely have same issue
