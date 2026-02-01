# Epoch Runner - Changelog

## [Unreleased]

### Session: 2026-01-31

#### Added
- Initial project scaffolding (Vite + React 19 + TypeScript)
- Documentation structure (`docs/roadmap.md`, `docs/tech_spec.md`, `docs/changelog.md`)
- Updated README with project vision and architecture overview
- Installed core dependencies: MobX, MobX-React-Lite, Firebase

#### Architecture Decisions (Brainstorm Session)
- **Tile Size**: 64px global constant
- **Collision Layer**: Direct collision codes for O(1) lookup
- **Physics Pattern**: `PlayerStore → PhysicsService → LevelStore`
- **Input System**: Hybrid event-driven with state caching
- **Game Loop**: `GameLoopService` orchestrates stores/services
- **Hitboxes**: Polygon-based from PNG scan (future), AABB for MVP
- **Sprites**: Global registry by ID, per-level name → ID lookup
- **Theme Swapping**: Separate levels per theme (not runtime swap)
- **Level Bundles**: JS modules with custom logic (future)
- **Save System**: Auto-save checkpoints, campaign progress persistent
- **Lives**: Classic 3 lives, -10 coins on game over

#### MVP Implementation
- Created `src/core/constants/index.ts` - TILE_SIZE, physics values
- Created `src/core/types/index.ts` - CollisionType enum, interfaces
- Created `src/services/GameLoopService.ts` - RAF loop with deltaTime
- Created `src/services/InputService.ts` - Keyboard event handling
- Created `src/services/CanvasRenderer.ts` - Tile and player rendering
- Created `src/services/PhysicsService.ts` - Gravity and collision
- Created `src/stores/GameStore.ts` - Game state (running, complete)
- Created `src/stores/PlayerStore.ts` - Position, velocity, grounded
- Created `src/stores/LevelStore.ts` - Collision grid, player spawn
- Created `src/stores/RootStore.ts` - Store composition and context
- Created `src/features/game/GameCanvas.tsx` - Canvas component
- Updated `src/App.tsx` - Mount game canvas

#### NPM Scripts
- Added `npm run new:level <name>` - Generate level file with boilerplate
- Added `npm run validate:levels` - Validate all registered levels
- Added `npm run typecheck` - Type check without building
- Added `npm run typecheck:watch` - Watch mode for type errors
- Created `scripts/new-level.js` - Level generator script
- Created `scripts/validate-levels.js` - Level validation script
- Installed `tsx` dev dependency for TypeScript script execution

#### Cursor Slash Commands
- Created `/new-level` - Interactive level file creation
- Created `/level-helpers` - Quick reference for level building functions
- Created `/add-platform` - Add platforms/obstacles to levels
- Created `/explain-physics` - Physics system documentation
- Created `/debug-collision` - Collision troubleshooting guide

#### Project Rules
- Created `.cursor/rules/architecture.mdc` - Three-layer separation (always applies)
- Created `.cursor/rules/store-patterns.mdc` - MobX store conventions
- Created `.cursor/rules/service-patterns.mdc` - Stateless singleton services
- Created `.cursor/rules/level-building.mdc` - Level definition patterns
- Created `.cursor/rules/grid-physics.mdc` - Coordinate systems and physics conventions

#### Code-Based Level Builder
- Created `src/stores/CameraStore.ts` - Camera position, deadzone, bounds clamping
- Created `src/services/CameraService.ts` - Smooth player following
- Updated `src/services/CanvasRenderer.ts` - Camera offset for all rendering
- Created `src/levels/types.ts` - LevelDefinition, LevelJSON interfaces
- Created `src/levels/helpers.ts` - Level building utilities (platform, wall, goal, rect, stairs, etc.)
- Created `src/levels/index.ts` - LevelRegistry for managing levels
- Created `src/levels/level_test.ts` - 40x15 test level for camera scrolling
- Created `src/services/LevelLoaderService.ts` - Load/save levels from registry or JSON
- Updated `src/stores/RootStore.ts` - Level loading and export methods
- Updated `src/features/game/GameCanvas.tsx` - File import/export UI (Ctrl+S, Ctrl+O)

---

## Version History

*No releases yet. Project in initial development phase.*
