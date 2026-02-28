---
description: Get a comprehensive overview of the Epoch Runner project architecture
---

Provide a quick architectural overview of Epoch Runner for context.

## Project Summary

**Epoch Runner** is a modular 2D platformer engine with a time-travel narrative ("The Chronological Odyssey"). Built with:

- **React 19 + TypeScript** - UI components
- **MobX** - State management (high-frequency game updates)
- **HTML5 Canvas** - Rendering
- **Firebase** - Level storage (future)

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI LAYER                            │
│  features/game/GameCanvas.tsx                               │
│  • React components observe stores                          │
│  • No business logic                                        │
├─────────────────────────────────────────────────────────────┤
│                        STORE LAYER                          │
│  stores/GameStore, PlayerStore, LevelStore, CameraStore     │
│  • MobX state + business logic                              │
│  • Orchestrates services                                    │
├─────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                         │
│  services/Physics, Input, Canvas, Camera, GameLoop          │
│  • Stateless singletons                                     │
│  • Receive stores as parameters                             │
└─────────────────────────────────────────────────────────────┘
```

**Dependency rule:** UI → Store → Service (one-way only!)

## Key Files

| File | Purpose |
|------|---------|
| `stores/RootStore.ts` | Store composition, React context, hooks |
| `stores/PlayerStore.ts` | Position, velocity, input handling |
| `stores/LevelStore.ts` | Collision grid, spawn points |
| `services/PhysicsService.ts` | Gravity, collision detection/response |
| `services/GameLoopService.ts` | RAF loop, tick orchestration |
| `levels/helpers.ts` | Level building utilities |
| `core/constants/index.ts` | TILE_SIZE, GRAVITY, physics values |
| `core/types/index.ts` | CollisionType, InputState, interfaces |

## Game Loop (60fps)

```
1. InputService.consumeFrame()      → Snapshot keyboard state
2. PlayerStore.applyInput()         → Set intended velocity
3. PhysicsService.update()          → Move, collide, check goal
4. CameraService.follow()           → Smooth camera tracking
5. CanvasRenderer.draw()            → Paint frame
```

## Grid System

- **TILE_SIZE** = 64 pixels
- **Coordinates**: World (pixels), Grid (tiles), Screen (pixels - camera offset)
- **Collision**: O(1) lookup via `collision[row][col]`
- **Row-major**: Arrays indexed as `[row][col]`, not `[col][row]`

## Level Building

```typescript
import { createLevel, tiles, platform, wall, goal, ground } from './helpers'

export const level_name = createLevel(
  'level_name',           // ID (matches filename)
  'Display Name',         // Title
  30, 15,                 // Width, height in tiles
  { col: 2, row: 13 },    // Player spawn (grid coords)
  tiles(
    ground(30, 14),       // Full-width floor at row 14
    platform(10, 10, 5),  // 5-tile platform at (10,10)
    wall(0, 0, 15),       // Left wall
    goal(27, 13),         // Goal tile
  )
)
```

## Current State (MVP Complete)

✅ Player movement, gravity, collision
✅ Grid-based levels with JSON import/export
✅ Camera system with smooth following
✅ Goal detection and win state

## Next Up (Roadmap)

- Level Builder React UI
- Firebase integration
- Spritesheet system
- Campaign progression
