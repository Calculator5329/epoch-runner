# feat: Add moving platforms system

## Summary

Implements a complete moving platform system for Epoch Runner.

## Features

- **MovingPlatformStore** - MobX store for platform state management
- **MovingPlatformService** - Stateless service for platform movement logic
- **Platform patterns**: Horizontal (left/right) and Vertical (up/down)
- **Player riding** - Player inherits platform velocity when standing on top
- **Visual polish** - 3D rendering effect with highlights and shadows

## Technical Details

- Smooth oscillation between start/end points
- AABB collision detection for player-on-platform checks
- Integrated with existing physics and reset systems
- Follows 3-layer architecture (UI → Store → Service)
- Fully typed with TypeScript
- Works with level export/import system

## New Level

**Level 10: Platform Rider** - Demo level showcasing:
- Horizontal platform over spike pit
- Vertical elevator platform
- Fast-moving challenge platforms
- Timing-based puzzle sections

## Level Building Helpers

```typescript
// Horizontal platform (left/right)
horizontalPlatform(startCol, startRow, endCol, endRow, widthTiles, speed?, color?)

// Vertical platform (up/down)
verticalPlatform(startCol, startRow, endCol, endRow, widthTiles, speed?, color?)

// Combine multiple platforms
movingPlatforms(...platforms)
```

## Files Changed

**Created:**
- `src/core/types/movingPlatforms.ts` - Type definitions
- `src/stores/MovingPlatformStore.ts` - State management
- `src/services/MovingPlatformService.ts` - Movement logic
- `src/levels/helpers/movingPlatforms.ts` - Level building helpers
- `src/levels/level_10_platforms.ts` - Demo level

**Modified:**
- `src/services/PhysicsService.ts` - Player riding logic
- `src/services/renderers/GameplayRenderer.ts` - Platform rendering
- `src/services/renderers/CanvasRenderer.ts` - Renderer integration
- `src/stores/RootStore.ts` - Store composition
- `src/levels/types.ts` - Level definition schema
- `src/features/game/GameCanvas.tsx` - Game loop integration
- Plus exports/indexes for clean imports

Ready for review! 🎮
