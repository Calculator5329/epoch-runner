# Epoch Runner - Technical Specification

## Architecture Overview

### Three-Layer Separation

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│  • React components (presentation only)                         │
│  • Observes stores, dispatches actions                          │
│  • No business logic                                            │
├─────────────────────────────────────────────────────────────────┤
│                        STORE LAYER                              │
│  • MobX stores (state + business logic)                         │
│  • Orchestrates services                                        │
│  • Never imports UI                                             │
├─────────────────────────────────────────────────────────────────┤
│                       SERVICE LAYER                             │
│  • API calls, persistence, canvas rendering                     │
│  • Stateless, no MobX, no UI awareness                          │
│  • Reusable across features                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Flow

```
UI → Store → Service (one-way only)
```

### Game Loop Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     GameLoopService                             │
│  • Owns requestAnimationFrame                                   │
│  • Calculates deltaTime                                         │
│  • Orchestrates tick order                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
  InputService         PhysicsService        CanvasRenderer
  (consume input)      (update positions)    (draw frame)
        │                     │                     │
        ▼                     ▼                     ▼
   PlayerStore           LevelStore            CameraStore
   (input state)         (collision)           (viewport)
```

**Per-frame tick order:**
1. `InputService.consumeFrame()` → snapshot input state
2. `PlayerStore.applyInput(inputState)` → set intended velocity
3. `PhysicsService.update(deltaTime)` → move entities, resolve collisions
4. `CameraStore.follow(playerPosition, deltaTime)` → smooth camera (future)
5. `CanvasRenderer.draw()` → paint frame

---

## MobX Store Architecture

### Store Responsibilities

| Store | Responsibility |
|-------|----------------|
| `GameStore` | Game loop state, current level, pause/play, timing |
| `PlayerStore` | Position, velocity, health, powerups, input state |
| `LevelStore` | Active level data, tile grid, entity positions |
| `EditorStore` | Builder state, selected tool, layer visibility |
| `CampaignStore` | Level progression, unlocks, player profile |

### Observable State (PlayerStore Example)

```typescript
// Conceptual - actual implementation TBD
class PlayerStore {
  // Position (world coordinates)
  x: number = 0
  y: number = 0
  
  // Velocity (pixels per second)
  vx: number = 0
  vy: number = 0
  
  // State flags
  isGrounded: boolean = false
  isFacingRight: boolean = true
  
  // Input state (from keyboard)
  input: {
    left: boolean
    right: boolean
    jump: boolean
  }
}
```

---

## Grid System

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `TILE_SIZE` | 64px | Base unit for grid calculations |
| `GRID_WIDTH` | Variable | Tiles per row (level-specific) |
| `GRID_HEIGHT` | Variable | Tiles per column (level-specific) |

### Layer Types

| Layer | Z-Index | Purpose |
|-------|---------|---------|
| `BACKGROUND` | 0 | Parallax, decorative (no collision) |
| `COLLISION` | 1 | Solid tiles for physics |
| `ENTITY` | 2 | Spawn points, enemies, collectibles |
| `FOREGROUND` | 3 | Overlays rendered above player |

### Coordinate Systems

```
World Coordinates (pixels):  (x, y) where origin is top-left
Grid Coordinates (tiles):    (col, row) = (floor(x/TILE_SIZE), floor(y/TILE_SIZE))
```

---

## Collision Detection

### O(1) Grid Lookup

```
1. Player position (px, py) in world coordinates
2. Convert to grid: (col, row) = (floor(px/64), floor(py/64))
3. Check collisionLayer[row][col] for tile type
4. Respond based on tile collision properties
```

### Collision Types

| Type | Behavior |
|------|----------|
| `SOLID` | Full block collision on all sides |
| `PLATFORM` | Collision only from above (pass-through below) |
| `HAZARD` | Triggers damage on contact |
| `TRIGGER` | Fires event (checkpoint, door, etc.) |
| `EMPTY` | No collision |

---

## Level JSON Schema

### Level Manifest

```typescript
interface LevelManifest {
  id: string                    // Unique identifier
  name: string                  // Display name
  themeID: string               // References theme spritesheet
  epoch: string                 // "StoneAge" | "Medieval" | "Industrial" | etc.
  
  grid: {
    width: number               // Tiles wide
    height: number              // Tiles tall
    tileSize: number            // Pixels per tile (default 64)
  }
  
  layers: {
    background: number[][]      // Tile IDs (0 = empty)
    collision: number[][]       // Tile IDs with collision data
    entity: EntitySpawn[]       // Entity placement data
  }
  
  playerSpawn: { x: number, y: number }
  goalPosition: { x: number, y: number }
  
  metadata: {
    author: string
    created: timestamp
    difficulty: "easy" | "medium" | "hard"
  }
}
```

### Tile Definition

```typescript
interface TileDefinition {
  id: number                    // Unique tile ID
  name: string                  // Human-readable name
  collisionType: CollisionType  // SOLID | PLATFORM | HAZARD | etc.
  sprite: {
    sheet: string               // Spritesheet filename
    x: number                   // X position in sheet (pixels)
    y: number                   // Y position in sheet (pixels)
    width: number               // Tile width (usually TILE_SIZE)
    height: number              // Tile height (usually TILE_SIZE)
  }
  animated?: {
    frames: number              // Frame count
    frameRate: number           // FPS
    direction: "horizontal" | "vertical"
  }
}
```

### Entity Schema

```typescript
interface EntitySpawn {
  type: EntityType              // "player" | "enemy" | "collectible" | "trigger"
  id: string                    // Entity definition ID
  position: { x: number, y: number }
  properties?: Record<string, unknown>  // Entity-specific config
}

type EntityType = 
  | "player_spawn"
  | "enemy_patrol"
  | "enemy_static"
  | "collectible_coin"
  | "collectible_powerup"
  | "checkpoint"
  | "goal"
  | "trigger_zone"
```

---

## Theme System

### Theme Definition

```typescript
interface ThemeDefinition {
  id: string                    // "StoneAge" | "Cyberpunk" | etc.
  name: string                  // Display name
  spritesheet: string           // Path to spritesheet PNG
  tileMapping: Record<number, TileSpriteCoords>  // Tile ID → sprite coords
  palette: {
    background: string          // CSS color for canvas clear
    accent: string              // UI accent color
  }
  parallax?: {
    layers: ParallaxLayer[]
  }
}
```

### Theme Injection

Levels reference `themeID`. The renderer:
1. Loads theme definition
2. Maps tile IDs to sprite coordinates from theme's spritesheet
3. Renders using theme's visual assets

**Same level JSON + different theme = different visuals, identical physics.**

---

## Physics Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `TILE_SIZE` | 64 | Pixels per grid unit (global constant) |
| `GRAVITY` | 1500 | Pixels/sec² downward |
| `PLAYER_SPEED` | 300 | Pixels/sec horizontal |
| `JUMP_VELOCITY` | -550 | Initial upward velocity (negative = up) |
| `MAX_FALL_SPEED` | 800 | Terminal velocity |
| `FRICTION` | 0.85 | Ground deceleration multiplier |

## Input System

**Hybrid event-driven with state caching:**
- Events update internal state on keydown/keyup
- Game loop polls state snapshot each frame
- Supports "just pressed" detection for jump buffering

```typescript
interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  jumpJustPressed: boolean  // True for one frame after press
}
```

## Hitbox System

### Current: AABB Collision
Using simple AABB (axis-aligned bounding box) for MVP collision detection.

### Planned: Auto-Generated Polygon Hitboxes

**Generation Algorithm (Marching Squares):**
1. Load sprite into offscreen canvas
2. Extract alpha channel as binary mask (threshold ~10 to ignore anti-aliasing)
3. Run marching squares to find contour points
4. Simplify polygon using Ramer-Douglas-Peucker algorithm
5. Normalize coordinates to 0-1 range relative to sprite bounds

**HitboxService Interface:**
```typescript
interface Polygon {
  points: Array<{ x: number, y: number }>  // Normalized 0-1 coordinates
}

class HitboxService {
  generateFromSprite(image: HTMLImageElement, threshold?: number): Polygon
  simplifyPolygon(polygon: Polygon, tolerance: number): Polygon
  pointInPolygon(point: { x: number, y: number }, polygon: Polygon): boolean
  getBoundingBox(polygon: Polygon): { x: number, y: number, w: number, h: number }
}
```

**Hitbox Override Format** (`hitboxes/hitboxes.json`):
```json
{
  "tiles": {
    "solid": { "type": "auto" },
    "spike_up": { 
      "type": "polygon",
      "points": [
        { "x": 0.5, "y": 0 },
        { "x": 1, "y": 1 },
        { "x": 0, "y": 1 }
      ]
    }
  },
  "player": {
    "type": "rect",
    "x": 0.1, "y": 0, "w": 0.8, "h": 1
  }
}
```

---

## Custom Level Pack System

### Pack Structure

Level packs are zip files containing all assets needed to play a custom level.

```
my-level-pack.zip
├── manifest.json         # Pack metadata + asset mappings
├── level.json            # Level definition (same format as existing)
├── sprites/
│   ├── tiles/            # Tile sprites (solid.png, hazard.png, etc.)
│   ├── player/           # Player sprites (idle.png, run.png, jump.png)
│   ├── background.png    # Level background
│   └── ui/               # Hearts, coin icon, etc.
├── hitboxes/
│   └── hitboxes.json     # Custom collision polygons (optional)
├── audio/
│   ├── music.mp3         # Background music
│   └── sfx/              # jump.mp3, coin.mp3, death.mp3, goal.mp3
└── config/
    └── params.json       # Parameter overrides (future)
```

### Manifest Schema

```typescript
interface PackManifest {
  formatVersion: 1
  name: string
  author?: string
  description?: string
  
  sprites: {
    tiles: Record<string, string>    // TileTypeId name -> relative path
    player?: {
      idle?: string
      run?: string
      jump?: string
    }
    background?: string
    ui?: Record<string, string>
  }
  
  audio?: {
    music?: string
    sfx?: Record<string, string>     // 'jump' | 'coin' | 'death' | 'goal' -> path
  }
  
  hitboxes?: string                  // Path to hitboxes.json (default: hitboxes/hitboxes.json)
}
```

### Sprite Requirements

| Asset Type | Recommended Size | Format |
|------------|------------------|--------|
| Tile sprites | 32x32 or 64x64 | PNG with alpha |
| Player sprites | 32x48 or 64x96 | PNG with alpha |
| Background | Level width x height px | PNG or JPG |
| UI elements | Variable | PNG with alpha |

**Guidelines:**
- Use power-of-two dimensions for best rendering performance
- Keep important details away from edges (hitbox may be smaller)
- Transparent pixels = no collision (for auto-hitbox generation)

### AssetStore Schema

```typescript
class AssetStore {
  // Loaded sprite images
  tileSprites: Map<TileTypeId, HTMLImageElement>
  playerSprites: { idle?: HTMLImageElement, run?: HTMLImageElement, jump?: HTMLImageElement }
  background?: HTMLImageElement
  uiSprites: Map<string, HTMLImageElement>
  
  // Loaded audio
  music?: string           // Blob URL
  sfx: Map<string, string> // Blob URLs
  
  // Hitbox data
  hitboxes: Map<string, Polygon>
  
  // Metadata
  packName?: string
  packAuthor?: string
  
  // Methods
  loadFromZip(file: File): Promise<void>
  clear(): void
  hasCustomAssets(): boolean
  getHitbox(key: string): Polygon | null
}
```

### LevelPackService Interface

```typescript
class LevelPackService {
  async createPack(level: LevelDefinition, assets: AssetStore): Promise<Blob>
  async extractPack(file: File): Promise<{ level: LevelDefinition, manifest: PackManifest }>
  validatePack(zip: JSZip): { valid: boolean, errors: string[] }
}
```

---

## Audio System

### AudioService Interface

```typescript
class AudioService {
  // Music control
  private musicElement?: HTMLAudioElement
  loadMusic(url: string): void
  playMusic(loop?: boolean): void
  pauseMusic(): void
  stopMusic(): void
  setMusicVolume(volume: number): void
  
  // SFX control
  private sfxPool: Map<string, HTMLAudioElement[]>
  loadSfx(name: string, url: string): void
  playSfx(name: 'jump' | 'coin' | 'death' | 'goal'): void
  setSfxVolume(volume: number): void
  
  // Global control
  setMasterVolume(volume: number): void
  mute(): void
  unmute(): void
}
```

### SFX Integration Points

| Event | Trigger Location |
|-------|------------------|
| Jump | `PlayerStore.requestJump()` |
| Coin collect | `LevelStore.collectCoin()` |
| Death | `PlayerStore.die()` or `GameStore.onPlayerDeath()` |
| Goal reached | `PhysicsService` or `RootStore.onLevelComplete()` |
| Checkpoint | `PhysicsService` checkpoint detection |

---

## Firebase Structure

```
epoch-runner/
├── levels/
│   ├── {levelId}/
│   │   ├── manifest: LevelManifest
│   │   └── published: boolean
├── themes/
│   ├── {themeId}/
│   │   └── definition: ThemeDefinition
├── players/
│   ├── {playerId}/
│   │   ├── progress: { completedLevels: string[] }
│   │   └── customLevels: string[]  // References to levels/
└── assets/
    └── metadata: { spritesheets: [...], audio: [...] }
```

---

## File Structure

```
src/
├── core/
│   ├── types/
│   │   ├── level.types.ts      # Level, Tile, Entity interfaces
│   │   ├── player.types.ts     # Player state interfaces
│   │   ├── theme.types.ts      # Theme definition interfaces
│   │   └── index.ts            # Re-exports
│   └── constants/
│       ├── physics.ts          # GRAVITY, SPEED, etc.
│       ├── grid.ts             # TILE_SIZE, layer enums
│       └── index.ts
│
├── services/
│   ├── renderer/
│   │   ├── CanvasRenderer.ts   # Main draw loop
│   │   └── SpriteLoader.ts     # Spritesheet management
│   ├── physics/
│   │   └── PhysicsEngine.ts    # Movement, collision response
│   ├── firebase/
│   │   └── FirebaseService.ts  # CRUD operations
│   └── input/
│       └── InputService.ts     # Keyboard state management
│
├── stores/
│   ├── GameStore.ts
│   ├── PlayerStore.ts
│   ├── LevelStore.ts
│   ├── EditorStore.ts
│   ├── CampaignStore.ts
│   └── RootStore.ts            # Store composition
│
├── features/
│   ├── game/
│   │   ├── components/
│   │   │   └── GameCanvas.tsx
│   │   └── hooks/
│   │       └── useGameLoop.ts
│   ├── editor/
│   │   ├── components/
│   │   │   ├── EditorCanvas.tsx
│   │   │   ├── TilePalette.tsx
│   │   │   └── LayerPanel.tsx
│   │   └── hooks/
│   └── campaign/
│       └── components/
│           └── Overworld.tsx
│
├── components/                  # Shared components
│   └── ui/
│
└── assets/
    ├── sprites/
    ├── themes/
    └── audio/
```
