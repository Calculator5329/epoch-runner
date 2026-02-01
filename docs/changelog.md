# Epoch Runner - Changelog

## [Unreleased]

### Session: 2026-02-01 (Part 6) - Jump System Overhaul

#### Changed: Progressive Jump Unlocks

The jump system has been redesigned to provide clearer progression and better power-up differentiation.

**Double Jump → Level Unlock**
- Double jump is now unlocked by completing levels, not from a power-up
- Levels 0-3: Single jump only (teaches core platforming)
- Levels 4-5: Double jump unlocked by default (enables advanced challenges)
- Custom/imported levels: Double jump enabled by default

**Triple Jump Power-up (formerly Double Jump)**
- The power-up tile now grants **triple jump** (3 air jumps for 10 seconds)
- Renamed across codebase:
  - `POWERUP_DOUBLE_JUMP` → `POWERUP_TRIPLE_JUMP`
  - `doubleJump()` helper → `tripleJump()` helper
  - `hasDoubleJump` → `hasTripleJump`
  - `DOUBLE_JUMP_DURATION` → `TRIPLE_JUMP_DURATION`

#### Added
- **`baseMaxJumps` property** in `PlayerStore` - Determines default jumps per level (1 or 2)
- **`setBaseMaxJumps()`** method in `PlayerStore` - Called on level load
- **`hasDoubleJumpUnlocked()`** function in level registry - Returns true for level 4+

#### Changed
- **RootStore** now sets `baseMaxJumps` when loading any level
- **Level files** updated to use `tripleJump()` helper
- **Power-up color** changed from teal (#38b2ac) to green (#48bb78) to match goal color
- **GameplayRenderer** uses `TRIPLE_JUMP_DURATION` constant for timer display

#### Level Progression Summary
| Level | Jump Type | Power-up Effect |
|-------|-----------|-----------------|
| 0-3 | Single jump | Triple jump (3 total) |
| 4-5 | Double jump | Triple jump (3 total) |

---

### Session: 2026-02-01 (Part 5) - CanvasRenderer Refactor

#### Architecture Refactor: CanvasRenderer Modularization

The monolithic 1893-line `CanvasRenderer.ts` has been refactored into focused, single-responsibility modules.

**Problem**: The original file violated the "stateless service" principle by holding UI interaction state, mixed multiple concerns (gameplay, debug, screens), and had embedded data.

**Solution**: Extracted into 11 new files with clear separation of concerns.

#### New File Structure

```
services/
  renderers/
    CanvasRenderer.ts          # Main orchestrator (~100 lines)
    GameplayRenderer.ts        # Tiles, player, HUD (~200 lines)
    DebugRenderer.ts           # Grid, collision, debug panel (~180 lines)
    DrawingUtils.ts            # roundRect, gradients, helpers (~200 lines)
    index.ts                   # Barrel exports
    screens/
      IntroScreenRenderer.ts   # Welcome screen
      RoadmapScreenRenderer.ts # Roadmap + phase detail
      LevelCompleteRenderer.ts # Level complete overlay
      CampaignCompleteRenderer.ts # Final stats screen
      AdminMenuRenderer.ts     # Level select overlay
      OverlayRenderer.ts       # Pause, game over

stores/
  UIStore.ts                   # UI interaction state (hover, selection, bounds)

core/
  data/
    roadmapData.ts             # Extracted roadmap phases data
```

#### Added
- **UIStore** - MobX store for UI interaction state
  - Hover states: `hoveredLevelIndex`, `hoveredRoadmapPhase`, `isTerminalHovered`
  - Selection states: `selectedRoadmapPhase`
  - Bounds for hit testing: `adminMenuBounds`, `roadmapPhaseBounds`, `terminalBounds`
  - Methods: `updateAdminMenuHover()`, `updateRoadmapHover()`, `handleRoadmapClick()`, etc.
  - Computed: `isClickable` for cursor styling
- **DrawingUtils** - Common canvas drawing utilities
  - `roundRect()`, `createDarkGradient()`, `drawGridPattern()`
  - `drawCornerAccents()`, `createFadeGradient()`, `drawOverlay()`
  - `drawCenteredText()`, `drawProgressBar()`
- **roadmapData.ts** - Extracted roadmap phase definitions
  - `ROADMAP_PHASES` array with status, progress, completed/upcoming items
  - `MILESTONES` array
  - `OVERALL_PROGRESS`, `VERSION` constants
- **Screen Renderers** - Each screen type has its own renderer class
  - `IntroScreenRenderer`, `RoadmapScreenRenderer`, `LevelCompleteRenderer`
  - `CampaignCompleteRenderer`, `AdminMenuRenderer`, `OverlayRenderer`
- **GameplayRenderer** - Core gameplay rendering (tiles, player, HUD)
- **DebugRenderer** - Debug overlays (grid, collision shapes, debug panel)

#### Changed
- **CanvasRenderer** is now an orchestrator that delegates to sub-renderers
- **GameCanvas.tsx** uses `UIStore` for all UI interaction state (no more renderer state)
- **RootStore** now includes `UIStore` instance
- Added `useUIStore()` convenience hook
- Services barrel export (`services/index.ts`) now exports from `renderers/`

#### Benefits
- Single responsibility: Each file has one clear purpose
- Testability: Screen renderers can be tested in isolation
- Maintainability: Changes to one screen don't risk breaking others
- State management: UI state follows MobX patterns like rest of app
- Discoverability: New developers can find relevant code easily
- ~1900 lines reduced to ~150 line orchestrator + focused modules

---

### Session: 2026-02-01 (Part 4)

#### Added
- **Developer Debug Tools** - Comprehensive debugging interface for development
  - `window.__EPOCH__` global debug object (dev mode only)
    - Direct store access: `__EPOCH__.player`, `__EPOCH__.game`, `__EPOCH__.level`, etc.
    - Commands: `loadLevel(id)`, `teleport(col, row)`
    - Toggle properties: `god`, `noclip`, `grid`, `debug`
    - Help command: `__EPOCH__.help()` prints available commands
  - God mode (F4) - Invincibility, no hazard or boundary damage
  - Noclip mode (F5) - Fly through walls, WASD for movement
  - Grid overlay (F1) - Shows tile coordinates on every tile
  - Collision shapes (F2) - Draws collision shape outlines with color-coded categories
  - Debug info panel (F3) - Shows player position, velocity, grid coords, god/noclip status
- **Enhanced Input System**
  - Added `up` and `down` input states for noclip vertical movement
  - Arrow keys and WASD now support full directional control in noclip mode
- **Teleport Command**
  - `RootStore.teleport(col, row)` - Instant player repositioning
  - Camera auto-follows after teleport

#### Changed
- `PhysicsService.update()` now accepts optional `InputState` parameter for noclip controls
- `GameStore` extended with debug mode flags:
  - `isGodMode`, `isNoclip`, `showGridOverlay`, `showCollisionShapes`, `showDebugInfo`
  - Toggle methods for each flag
- `CanvasRenderer` extended with debug overlay methods:
  - `drawGridOverlay()`, `drawCollisionShapes()`, `drawDebugInfo()`

#### Documentation
- Added "Developer Tools" section to roadmap with implemented and future tools
- Documented future tool ideas: lint:levels, compare:levels, stats:levels, input recording

---

### Session: 2026-02-01 (Part 3)

#### Fixed
- **Level name redundancy**: Game info was showing "Level 3/6: Level 2: Danger Zone"
  - Removed "Level X:" prefix from all level display names
  - Now displays cleanly as "Level 3/6: Danger Zone"
- **Coin tracking bug**: Coins collected was always showing 0 on campaign complete
  - Root cause: `completeLevel()` was called twice (from PhysicsService and RootStore)
  - Second call returned 0 because level was already marked complete
  - Added `lastCompletionEarnings` field to cache earnings on first call
  - Subsequent calls now return cached value instead of 0

#### Changed
- **Intro screen redesign**: More polished visual appearance
  - Gradient background with subtle grid pattern overlay
  - Corner accent decorations instead of full border
  - Title with glow effect
  - Controls section in a rounded card
  - Admin mode section with highlighted warning box
  - Pulsing glow effect on start prompt
  - Added version number footer
  - Removed roadmap section for cleaner look

---

### Session: 2026-02-01 (Part 2)

#### Added
- **Campaign Progression System** - Full game flow from intro to completion
  - `CampaignStore` - Manages progression state, screen flow, session stats
  - Intro screen with project documentation, roadmap, and controls
  - Level complete screen with stats and continue/replay options
  - Campaign complete screen with full session statistics
  - Per-level breakdown showing deaths and coins collected
  - Automatic level advancement on completion
  - Admin mode flag for development (enables level select, skipping)
- **Ordered Level Progression**
  - `CAMPAIGN_LEVELS` array defines level order
  - Player starts at level 0, progresses through all 6 levels
  - Progress tracking with level unlock system
  - Level index tracking for accurate progression display
- **Session Statistics Tracking**
  - Total deaths, coins collected, play time
  - Per-level stats (deaths, coins, completion status)
  - Formatted play time display

#### Changed
- **RootStore** - Added campaign integration methods:
  - `startCampaign()` - Begin from intro screen
  - `continueToNextLevel()` - Advance after completion
  - `onLevelComplete()` - Trigger campaign flow on goal reach
  - `restartCampaign()` - Return to intro
  - `adminJumpToLevel/adminJumpToLevelById()` - Admin level selection
- **GameCanvas** - Screen state aware controls and rendering
  - Different key bindings per screen state (intro, playing, complete)
  - Admin-only features gated behind `isAdminMode` flag
  - Level progress indicator in game info
- **CanvasRenderer** - New overlay screens:
  - `drawIntroScreen()` - Welcome, documentation, roadmap
  - `drawLevelCompleteScreen()` - Stats with continue prompt
  - `drawCampaignComplete()` - Full stats breakdown with level select

---

### Session: 2026-02-01

#### Added
- **Level Visualizer script** (`npm run viz:level <level-id>`)
  - Outputs ASCII grid representation of any level
  - Shows all tile types with symbols (# solid, = platform, ^ spike, etc.)
  - Marks player spawn with P
  - Includes tile counts and vertical gap analysis
  - Helps verify level layouts are physically possible
- **Cursor rule: level-design-validation.mdc**
  - Documents common level design mistakes and how to avoid them
  - Physics constraints: single jump ~2 tiles, double jump ~4 tiles max
  - Validation checklist for level changes
  - Wall height math reference
- **Cursor commands: /clean-logs, /document**
  - `/clean-logs` - Find and remove debug console.log statements
  - `/document` - Update all docs to reflect current codebase state

#### Changed
- **Level renaming**: Renumbered test levels for clearer progression
  - `level_0_shapes` → `level_1_shapes` (Shape Shifter)
  - `level_0_hazards` → `level_2_hazards` (Danger Zone)
  - `level_0_coins` → `level_3_coins` (Coin Collector)
  - `level_0_powerup` → `level_4_powerup` (Sky High)
  - New `level_5_gauntlet` (The Gauntlet - all features combined)
  - `level_0_basic` kept as tutorial level

#### Fixed
- **Critical**: Player could fall off the map and get stuck forever
  - Added `checkBoundaries()` to PhysicsService
  - Detects when player falls below level height (in pixels)
  - Triggers `onPlayerDeath()` to respawn at checkpoint or start
  - Follows same death flow as hazard collision
- **Level 4 (Sky High)**: Tower section was impossible to complete
  - Platform spacing was 5 tiles (320px), but max double-jump height is ~270px
  - Reduced tower platform spacing to 4 tiles (256px), now achievable with good timing
  - Added extra platform at row 16 for smoother climb
  - Shortened left tower wall to allow ground-level entry (was blocking access)
  - Shortened right tower wall to allow exit to goal (was trapping player at top)
- **Level 5 (The Gauntlet)**: Multiple sections were impossible
  - Hazard Corridor: Widened gap between walls (5→8 tiles), reduced spike coverage
  - Hazard Corridor: Shortened walls to allow ground entry (was blocking row 18)
  - Vertical Tower: Removed hazards blocking platform access, widened platforms
  - Final Section: Adjusted to connect properly from tower exit

### Session: 2026-01-31 (Part 2)

#### Added
- Admin level selector (press ` to toggle)
  - Full-screen overlay showing all available levels
  - Click to load, backtick or ESC to close
  - Highlights current level
  - Hover effect on menu items
  - `GameStore.isAdminMenuOpen`, `toggleAdminMenu()`, `closeAdminMenu()`
  - `CanvasRenderer.drawAdminMenu()`, `getLevelAtPosition()`, `updateHoverPosition()`
- Cursor command: `/code-review` - Comprehensive code review with auto-fix for critical issues
- Cursor command: `/review` - Quick TypeScript type check and ESLint validation

#### Fixed
- **Critical**: Half blocks, slopes showing as green GOAL tiles
  - `LevelStore.convertLegacyTile()` was incorrectly converting new TileTypeId values
  - New levels (TileTypeId format) no longer go through legacy conversion
  - Only legacy LevelData format levels are converted
- **Physics**: Slope collision now properly calculates surface Y position
  - Player no longer bounces oddly on triangular slopes
  - Added `getSlopeSurfaceY()` helper for proper slope landing
  - Supports SLOPE_UP_RIGHT, SLOPE_UP_LEFT, SLOPE_DOWN_RIGHT, SLOPE_DOWN_LEFT

#### Changed
- Level 1 (Shape Shifter): Replaced slopes/ramps with stairs (flat platforms)
- Level 5 (Gauntlet): Replaced slope climb with stair steps
- Triangle/slope shapes removed from gameplay until physics are refined

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
