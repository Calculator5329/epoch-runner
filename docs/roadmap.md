# Epoch Runner - Roadmap

## MVP: One Playable Test Level
*Priority: Immediate*

Goal: Single hardcoded level with player movement, collision, and win state.

- [x] **Phase 1: Constants & Types**
  - [x] Create `TILE_SIZE`, physics constants
  - [x] Define `CollisionType` enum

- [x] **Phase 2: Game Loop**
  - [x] `GameLoopService` with RAF and deltaTime
  - [x] `GameStore` with `isRunning`, `levelComplete`

- [x] **Phase 3: Level & Rendering**
  - [x] `LevelStore` with hardcoded 16x12 test level
  - [x] `CanvasRenderer` draws tiles as colored rectangles

- [x] **Phase 4: Player & Input**
  - [x] `InputService` with keyboard events
  - [x] `PlayerStore` with position/velocity
  - [x] Render player, wire horizontal movement

- [x] **Phase 5: Physics & Collision**
  - [x] `PhysicsService` with gravity
  - [x] Ground, wall, ceiling collision detection
  - [x] Jump mechanic (only when grounded)

- [x] **Phase 6: Goal & Win**
  - [x] Detect goal tile overlap
  - [x] Show "Level Complete" overlay

## Code-Based Level Builder
*Priority: Immediate - Completed*

- [x] **Camera System**
  - [x] CameraStore with position, deadzone, bounds clamping
  - [x] CameraService with smooth follow
  - [x] CanvasRenderer updated for camera offset

- [x] **Level Definition System**
  - [x] LevelDefinition and LevelJSON interfaces
  - [x] Helper functions (platform, wall, goal, rect, stairs, etc.)
  - [x] LevelRegistry for managing levels

- [x] **Level Loading & Saving**
  - [x] LevelLoaderService for loading from registry or JSON
  - [x] JSON export (Ctrl+S to download)
  - [x] JSON import (Ctrl+O to load file)

- [x] **Test Level**
  - [x] 40x15 level_test for camera scrolling verification

## Gameplay Systems
*Priority: Immediate - Completed*

- [x] **Collision Shape System**
  - [x] TileTypeId enum with categorized tile types
  - [x] CollisionShape definitions (rect, polygon)
  - [x] Predefined shapes (full, half, quarter, slopes, spikes)
  - [x] AABB vs shape collision detection (CollisionUtils)
  - [x] PhysicsService updated for shape-based collision

- [x] **Hazards & Lives**
  - [x] Hazard tile types (spikes up/down/left/right, hazard block)
  - [x] Lives system (default 3, configurable per level)
  - [x] Death on hazard contact
  - [x] Game over state when lives = 0

- [x] **Checkpoints**
  - [x] Checkpoint tile type
  - [x] Mid-level respawn at checkpoint
  - [x] Reset coins on death (not on game over)

- [x] **Coin Economy**
  - [x] Coin tile type and collection
  - [x] coinsThisAttempt (reset on death)
  - [x] totalCoins (persistent wallet)
  - [x] Replay multiplier (0.9^n for completed levels)
  - [x] HUD display for lives and coins

- [x] **Power-ups & Jump Progression**
  - [x] Progressive jump unlocks (single jump for levels 0-3, double jump for levels 4+)
  - [x] Triple jump power-up (10 second duration, 3 jumps)
  - [x] jumpsRemaining system with baseMaxJumps per level
  - [x] Visual indicator for active power-up

- [x] **One-Way Platforms**
  - [x] Platform tile types
  - [x] Pass-through from below, land from above

- [x] **Core Test Levels (Progression)**
  - [x] level_0_basic - Basic platforming, tutorial (single jump)
  - [x] level_1_shapes - Half/quarter blocks, slopes disabled (single jump)
  - [x] level_2_hazards - Spikes and hazard gauntlet (single jump)
  - [x] level_3_coins - Coin collection, checkpoints (single jump)
  - [x] level_4_powerup - Triple jump challenges (double jump unlocked!)
  - [x] level_5_gauntlet - All features combined, final test (double jump)

---

## Phase 1: Engine Foundation (Post-MVP)
*Priority: High*

- [ ] **Engine Core**
  - [x] Set up MobX store architecture (GameStore, PlayerStore)
  - [x] Implement Canvas `requestAnimationFrame` loop
  - [x] Create basic game loop with delta time handling
  - [x] Set up layer separation (UI → Store → Service)

- [ ] **Grid & Collision System**
  - [x] Define grid constants (unit size, layer types)
  - [x] Implement tile rendering from 2D array
  - [x] Build O(1) collision detection via coordinate mapping
  - [ ] Create collision layer parser (for JSON levels)

- [ ] **Physics Engine**
  - [x] MobX observables for velocity (vx, vy) and position
  - [x] Gravity system with configurable constants
  - [x] Ground detection and response
  - [x] Basic player movement (left, right, jump)

## Phase 2: Level Builder (Admin/Code)
*Priority: High - Core Implemented*

- [ ] **JSON Schema Definition**
  - [ ] Level manifest schema (metadata, layers, entities)
  - [ ] Tile definition schema (ID, collision type, sprite coords)
  - [ ] Entity schema (spawn points, enemies, collectibles)
  - [ ] Theme schema (spritesheet mapping, color palettes)

- [x] **Builder React UI**
  - [x] EditorStore with mode, tool, grid state, undo/redo
  - [x] Grid canvas with tile painting (click and drag)
  - [x] Tile palette organized by category (Solid, Platform, Hazard, Pickup, Trigger)
  - [x] Tool modes: Paint, Erase, Fill, Eyedropper, Spawn placement
  - [x] JSON export/import functionality (Ctrl+S/Ctrl+O)
  - [x] Camera panning for large levels
  - [x] Grid overlay with level bounds
  - [x] Keyboard shortcuts for tools (P/X/F/I/S)
  - [x] Undo/Redo system (Ctrl+Z/Ctrl+Y)
  - [x] Test level in-game (T key)
  - [x] Mode toggle from game (E key, admin only)
  - [ ] Layer toggle (collision, background, entity) - future

- [ ] **Firebase Integration**
  - [ ] Set up Firebase project and Realtime DB
  - [ ] Level CRUD operations (save, load, list)
  - [ ] Asset metadata storage

## Phase 3: Custom Level Pack System
*Priority: High - Core Implemented*

Comprehensive system for creating shareable level packs with custom assets.

- [x] **Phase 3.1: Asset Infrastructure**
  - [x] Add JSZip dependency for zip file handling
  - [x] Create `AssetStore` for managing loaded assets (blob URLs, metadata)
  - [x] Create `LevelPackService` for zip creation/extraction
  - [x] Define pack manifest format (level.json + asset references)

- [x] **Phase 3.2: Sprite Rendering System**
  - [x] Modify `GameplayRenderer` for sprite-based tile rendering
  - [x] Support fallback to procedural rendering when sprites missing
  - [x] Pre-load sprites as HTMLImageElement for efficient canvas drawing
  - [x] Handle sprite scaling to TILE_SIZE

- [ ] **Phase 3.3: Custom Hitbox System** *(Deferred - needs refinement)*
  - [x] Create `HitboxService` with marching squares algorithm
  - [x] Auto-generate collision polygons from sprite alpha channel
  - [x] Polygon simplification (Ramer-Douglas-Peucker)
  - [ ] Custom polygon override support in hitboxes.json
  - [ ] Integrate polygon collision with `PhysicsService` (reverted due to stability)
  - [ ] Hitbox editor UI with vertex manipulation

- [x] **Phase 3.4: Audio System**
  - [x] Create `AudioService` for music and SFX playback
  - [x] Background music with looping and volume control
  - [x] SFX pool for concurrent sound effects
  - [x] Integration points: jump, coin, death, goal triggers

- [x] **Phase 3.5: Editor Asset UI**
  - [x] Create `AssetUploadPanel` component
  - [x] File picker for sprites/audio
  - [x] Preview thumbnails and audio test buttons
  - [ ] Hitbox editor overlay per sprite (deferred)

- [x] **Phase 3.6: Zip Export/Import**
  - [x] Export editor state + assets to .zip file
  - [x] Import .zip and extract into AssetStore
  - [x] Validation of pack contents
  - [x] File bar with Export Pack/Import Pack buttons

- [ ] **Phase 3.7: Migrate Existing Levels**
  - [ ] Create default sprite set matching procedural style
  - [ ] Build migration script for TypeScript levels
  - [ ] Update level registry to load from zip files
  - [ ] Store level packs in `public/levels/`

**Zip Pack Format:**
```
my-level-pack.zip
├── manifest.json       # Pack metadata
├── level.json          # Level definition
├── sprites/
│   ├── tiles/          # Tile sprites (PNG with transparency)
│   ├── player/         # Player sprites
│   ├── background.png  # Level background
│   └── ui/             # Hearts, coin icon, etc.
├── hitboxes/
│   └── hitboxes.json   # Custom collision polygons
├── audio/
│   ├── music.mp3       # Background music
│   └── sfx/            # Sound effects
└── config/
    └── params.json     # Parameter overrides (future)
```

---

## Phase 4: Asset Pipeline (Legacy - Merged into Phase 3)
*Priority: Merged*

- [x] **Spritesheet System** → Now part of Custom Level Pack System
- [x] **Asset Management** → Now part of Custom Level Pack System

## Phase 5: Campaign & Progression
*Priority: Medium - In Progress*

- [x] **Campaign Flow**
  - [x] CampaignStore for progression state
  - [x] Intro screen with documentation/roadmap
  - [x] Level complete screen with continue option
  - [x] Campaign complete screen with full stats
  - [x] Ordered level progression (6 levels)
  - [x] Admin mode for development/testing

- [ ] **Overworld UI**
  - [ ] Visual level selection screen
  - [ ] "Chronological Odyssey" epoch progression display
  - [ ] Level unlock system based on completion

- [ ] **Player Progress**
  - [ ] Firebase player profile storage
  - [ ] Level completion tracking
  - [ ] Collectible/achievement system (optional)

## Developer Tools
*Priority: Medium - Core Implemented*

- [x] **Debug Console Interface**
  - [x] `window.__EPOCH__` global debug object (dev mode only)
  - [x] Store access (player, game, level, camera, campaign)
  - [x] Helper commands (loadLevel, teleport)
  - [x] Toggle shortcuts (god, noclip, grid, debug)

- [x] **Debug Modes**
  - [x] God mode - invincibility (F4 toggle)
  - [x] Noclip mode - fly through walls (F5 toggle)
  - [x] Grid overlay - show tile coordinates (F1 toggle)
  - [x] Collision shapes - show hitbox outlines (F2 toggle)
  - [x] Debug info panel - position, velocity, state (F3 toggle)

- [x] **Admin Commands**
  - [x] Teleport player to grid position
  - [x] Load any level by ID

- [ ] **Future Tools (NPM Scripts)**
  - [ ] `lint:levels` - Check for level design mistakes (impossible jumps, unreachable goals)
  - [ ] `compare:levels` - Side-by-side diff of two levels
  - [ ] `stats:levels` - Summary of all levels (tile counts, coin count, difficulty)
  - [ ] `playtest:level <id>` - Launch dev server with specific level pre-loaded

- [ ] **Future Tools (In-Game)**
  - [ ] Input recording/playback for testing and demos
  - [ ] Performance profiling overlay (FPS, frame time, memory)
  - [ ] Screenshot generation for level previews

- [ ] **Build & CI Tools**
  - [ ] Pre-commit hooks for level validation
  - [ ] Automated playability testing (pathfinding to verify levels are beatable)
  - [ ] Bundle analysis integration

## Phase 6: In-Game GUI Level Builder
*Priority: Low (Post-MVP)*

- [ ] **Player-Facing Editor**
  - [ ] Simplified tile painting interface
  - [ ] Basic entity placement (start, goal, enemies)
  - [ ] Level testing within editor
  - [ ] Save to player's custom level library

---

## Phase 7: Parameter Override System (Future)
*Priority: Low*

Allow level packs to customize game behavior without code changes.

- [ ] **Parameter Config File**
  - [ ] `config/params.json` in level packs
  - [ ] Physics overrides (gravity, jump velocity, move speed)
  - [ ] Player overrides (starting lives, max health)
  - [ ] Hazard behavior (spike damage, etc.)
- [ ] **Parameter Loader**
  - [ ] Load params at level start
  - [ ] Override constants in PhysicsService
  - [ ] Reset to defaults on level exit
- [ ] **Editor UI**
  - [ ] Parameter editing panel
  - [ ] Preset templates (floaty, speedy, hardcore)

---

## Phase 8: Advanced Gameplay Features (Future)
*Priority: Medium*

Additional gameplay mechanics to enhance level variety.

- [ ] **Enemy System** *(Core Implemented)*
  - [x] EntityStore and EntityService for managing entities
  - [x] Patrol enemy - walks back and forth on platforms
  - [x] Stomp-to-kill mechanic (land on enemy from above)
  - [x] Player damage on side/bottom contact
  - [x] Entity spawns in level definitions
  - [ ] Flying enemy - aerial patrol patterns
  - [ ] Jumping enemy - hops periodically
  - [ ] Shooting enemy - fires projectiles
  - [ ] Boss enemy - multi-hit health bar

- [ ] **Moving Platforms**
  - [ ] Horizontal mover - slides left/right between points
  - [ ] Vertical mover - rises/falls between points
  - [ ] Circular path - follows curved trajectory
  - [ ] Player sticks to platform while riding
  - [ ] Platform spawn definitions in level

- [ ] **Switches & Doors**
  - [ ] Pressure plate - activates when stood on
  - [ ] Toggle switch - clicked to change state
  - [ ] Timed switch - activates for limited duration
  - [ ] Door/gate - blocks path until triggered
  - [ ] Linked objects - switch controls multiple doors
  - [ ] Visual feedback for active/inactive states

- [ ] **Additional Powerups**
  - [ ] Speed boost - temporary movement speed increase
  - [ ] Invincibility - temporary immunity to damage
  - [ ] Shield - blocks one hit then disappears
  - [ ] Magnet - attracts nearby coins
  - [ ] Slow fall - reduced gravity for easier platforming

---

## Architecture Re-Org (Completed)
*Priority: High - Completed*

Restructured codebase for extensibility, modding support, and better organization.

- [x] **Phase A1: Dynamic Registries**
  - [x] LevelRegistry for runtime level registration
  - [x] EntityRegistry for entity definitions
  - [x] TileRegistry for tile types
  - [x] AssetResolverService for asset ID → URL mapping

- [x] **Phase A2: Configuration-Driven Systems**
  - [x] Campaign configuration module (campaignConfig.ts)
  - [x] Campaign registry for multiple campaigns
  - [x] PackOverrideService for physics/gameplay overrides
  - [x] Extended pack manifest format

- [x] **Phase A3: Editor and Metadata**
  - [x] Dynamic tile/entity palettes using registries
  - [x] LevelMetadataService for statistics and filtering
  - [x] Extended LevelDefinition with metadata
  - [x] Validation pipeline with pluggable rules

- [x] **Phase A4: Theme System**
  - [x] Theme type definitions (palette, assets, effects)
  - [x] Theme registry for dynamic themes
  - [x] ThemeService for loading and applying themes

---

## Out of Scope (Phase 1)

These features are architecturally supported but deferred:

- Custom particle editors
- Advanced enemy AI scripting (pathfinding, player-seeking)
- Multiplayer/co-op
- Mobile touch controls
- Procedural level generation

---

## Milestones

| Milestone | Definition of Done |
|-----------|-------------------|
| **M1: First Frame** | Canvas renders a static grid from hardcoded 2D array |
| **M2: Movement** | Player can move and jump with collision response |
| **M3: Level Load** | Game loads level from JSON, renders correctly |
| **M4: Builder Alpha** | Can paint tiles and export valid level JSON |
| **M5: Firebase Live** | Levels persist to Firebase, load on refresh |
| **M6: Campaign Flow** | Overworld → Level → Complete → Next Level works |
