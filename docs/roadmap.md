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

- [x] **Power-ups**
  - [x] Double jump power-up (10 second duration)
  - [x] jumpsRemaining system (1 normal, 2 with powerup)
  - [x] Visual indicator for active power-up

- [x] **One-Way Platforms**
  - [x] Platform tile types
  - [x] Pass-through from below, land from above

- [x] **Core Test Levels (Progression)**
  - [x] level_0_basic - Basic platforming (tutorial)
  - [x] level_1_shapes - Half/quarter blocks (slopes disabled)
  - [x] level_2_hazards - Spikes and hazard gauntlet
  - [x] level_3_coins - Coin collection, checkpoints
  - [x] level_4_powerup - Double jump challenges
  - [x] level_5_gauntlet - All features combined (final test)

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
*Priority: High*

- [ ] **JSON Schema Definition**
  - [ ] Level manifest schema (metadata, layers, entities)
  - [ ] Tile definition schema (ID, collision type, sprite coords)
  - [ ] Entity schema (spawn points, enemies, collectibles)
  - [ ] Theme schema (spritesheet mapping, color palettes)

- [ ] **Builder React UI**
  - [ ] Grid canvas with tile painting
  - [ ] Layer toggle (collision, background, entity)
  - [ ] Tile palette from loaded spritesheet
  - [ ] JSON export/import functionality

- [ ] **Firebase Integration**
  - [ ] Set up Firebase project and Realtime DB
  - [ ] Level CRUD operations (save, load, list)
  - [ ] Asset metadata storage

## Phase 3: Asset Pipeline
*Priority: High*

- [ ] **Spritesheet System**
  - [ ] Define spritesheet format (power-of-two, 32x32 or 64x64 tiles)
  - [ ] Metadata manifest (Tile ID → sprite coordinates)
  - [ ] Theme injection system (swap spritesheets by themeID)

- [ ] **Asset Management**
  - [ ] Sprite loader service
  - [ ] Animation frame sequencing
  - [ ] Transparent PNG handling (prevent tile bleeding)

## Phase 4: Campaign & Progression
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

## Phase 5: In-Game GUI Level Builder
*Priority: Low (Post-MVP)*

- [ ] **Player-Facing Editor**
  - [ ] Simplified tile painting interface
  - [ ] Basic entity placement (start, goal, enemies)
  - [ ] Level testing within editor
  - [ ] Save to player's custom level library

---

## Out of Scope (Phase 1)

These features are architecturally supported but deferred:

- Custom particle editors
- Complex logic wiring (switches, gates)
- Advanced enemy AI scripting
- Multiplayer/co-op
- Mobile touch controls

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
