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
- Created `/add-store` - Create new MobX store with proper patterns
- Created `/add-service` - Create new stateless service
- Created `/add-entity` - Add enemy, collectible, or trigger
- Created `/check-patterns` - Validate code against architecture rules
- Created `/project-overview` - Quick project context for agent onboarding
- Created `/refactor-component` - Split large components following patterns

#### Project Rules
- Created `.cursor/rules/architecture.mdc` - Three-layer separation (always applies)
- Created `.cursor/rules/store-patterns.mdc` - MobX store conventions
- Created `.cursor/rules/service-patterns.mdc` - Stateless singleton services
- Created `.cursor/rules/level-building.mdc` - Level definition patterns
- Created `.cursor/rules/grid-physics.mdc` - Coordinate systems and physics conventions
- Created `.cursor/rules/naming-conventions.mdc` - File, class, function, variable naming
- Created `.cursor/rules/react-components.mdc` - React/MobX component patterns
- Created `.cursor/rules/entity-patterns.mdc` - Enemy, collectible, trigger patterns (future)
- Created `.cursor/rules/file-organization.mdc` - Where to put new files (always applies)
- Created `.cursor/rules/common-pitfalls.mdc` - AI agent mistake prevention (always applies)
- Created `.cursor/rules/events-signals.mdc` - Event system blueprint (future)
- Created `.cursor/rules/testing-patterns.mdc` - Test file patterns (when tests added)

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

#### Quality of Life Improvements
- Added debug mode toggle (F3 key) - Shows camera, player position, velocity, grounded state
- Created barrel exports `src/services/index.ts` and `src/stores/index.ts` for cleaner imports
- Fixed `scripts/validate-levels.js` bug (was calling wrong API method)
- Added `debugMode` observable to GameStore
- Updated CanvasRenderer to conditionally show debug info

### Session: 2026-01-31 (Gameplay Systems)

#### Collision Shape System
- Created `src/core/types/shapes.ts` - TileTypeId enum, CollisionShape, SHAPES, TileType registry
- Created `src/services/CollisionUtils.ts` - AABB/polygon collision, SAT algorithm
- Predefined shapes: FULL, HALF_LEFT/RIGHT/TOP/BOTTOM, QUARTER_TL/TR/BL/BR, slopes, spikes
- Updated `src/services/PhysicsService.ts` - Shape-based collision detection

#### Hazards & Lives System
- Added TileTypeId values for hazards (HAZARD_FULL, HAZARD_SPIKE_UP/DOWN/LEFT/RIGHT)
- Updated GameStore with lives, maxLives, isGameOver, onPlayerDeath()
- Death respawns player at checkpoint or level start
- Game over screen when lives = 0
- Updated CanvasRenderer with heart icons for lives

#### Checkpoints & Respawning
- Added TileTypeId.CHECKPOINT tile type
- GameStore tracks lastCheckpoint position
- RootStore.respawnPlayer() handles respawn logic
- Coins reset on death, preserved on game over

#### Coin Economy
- Added TileTypeId.COIN tile type
- GameStore tracks coinsThisAttempt, totalCoins, levelEarnings
- Replay multiplier: 0.9^n for completed levels
- HUD shows current coins and total wallet
- Coins collected are removed from level grid

#### Power-ups (Double Jump)
- Added TileTypeId.POWERUP_DOUBLE_JUMP tile type
- PlayerStore: hasDoubleJump, jumpsRemaining, doubleJumpTimer
- 10 second duration, visual indicator above player
- Jump allowed when jumpsRemaining > 0, reset on landing

#### One-Way Platforms
- Added TileTypeId.PLATFORM_FULL/HALF_LEFT/HALF_RIGHT
- Platform collision only from above (when falling)
- Player can jump through from below

#### Level Building Helpers (New)
- `halfBlockLeft/Right/Top/Bottom()` - Half-tile collision
- `quarterBlock(col, row, corner)` - Quarter-tile collision
- `slopeUpRight/UpLeft()` - Slope tiles
- `rampUpRight/UpLeft()` - Multi-tile ramps with fill
- `oneWayPlatform()` - Pass-through platforms
- `hazard()`, `spikesUp/Down/Left/Right()` - Hazard tiles
- `coin()`, `coins()`, `coinRow()`, `coinArc()` - Coin placement
- `doubleJump()` - Power-up placement
- `checkpoint()` - Checkpoint tile

#### Age 0 Test Levels
- `level_0_basic` - Basic platforming (renamed from level_test)
- `level_0_shapes` - Half blocks, quarter blocks, slopes demo
- `level_0_hazards` - Spike pits, wall spikes, hazard maze
- `level_0_coins` - Coin collection, arcs, checkpoints
- `level_0_powerup` - Double jump challenges, timed sections

#### Store Updates
- GameStore: lives, coins, checkpoints, game over, replay multiplier
- PlayerStore: double jump, jumpsRemaining, death state
- LevelStore: startingLives, resetToOriginal(), tile type helpers
- RootStore: respawnPlayer(), level initialization

---

## Version History

*No releases yet. Project in initial development phase.*
