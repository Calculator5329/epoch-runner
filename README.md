# Epoch Runner

A modular 2D platformer engine where game logic is entirely decoupled from level design. Build once, design infinitely.

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd epoch-runner
npm install

# Run the game
npm run dev
```

Open http://localhost:5173 in your browser. You'll see the test level - use **Arrow Keys** or **WASD** to move and **Space** to jump. Reach the green goal tile to complete the level.

### Controls

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space / W / Arrow Up | Jump |
| R | Restart level |
| Esc | Pause |
| F3 | Toggle debug overlay |
| Ctrl+S | Export level to JSON |
| Ctrl+O | Import level from JSON |

---

## Developer Commands

### NPM Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run typecheck        # Type check without building
npm run typecheck:watch  # Watch mode for type errors

# Level tools
npm run new:level <name>    # Generate new level file
npm run validate:levels     # Validate all registered levels
```

**Example - create a new level:**
```bash
npm run new:level cave_escape
```
This creates `src/levels/cave_escape.ts` with boilerplate. Then register it in `src/levels/index.ts`.

### Cursor Slash Commands

Type `/` in Cursor chat to access these:

| Command | What it does |
|---------|--------------|
| `/new-level` | Interactive level creation wizard |
| `/level-helpers` | Quick reference for level building functions |
| `/add-platform` | Guided platform/obstacle placement |
| `/explain-physics` | Physics system documentation |
| `/debug-collision` | Troubleshooting guide for collision bugs |
| `/add-store` | Create a new MobX store with proper patterns |
| `/add-service` | Create a new stateless service |
| `/add-entity` | Add enemy, collectible, or trigger type |
| `/check-patterns` | Validate code against architecture rules |
| `/project-overview` | Quick project context for agent onboarding |
| `/refactor-component` | Guide for splitting large components |

### Cursor Rules (Auto-Applied)

These rules are automatically applied to relevant files to ensure consistent patterns:

| Rule | Scope | Purpose |
|------|-------|---------|
| `architecture.mdc` | Always | Three-layer separation |
| `file-organization.mdc` | Always | Where to put new code |
| `common-pitfalls.mdc` | Always | AI mistake prevention |
| `store-patterns.mdc` | `stores/**/*.ts` | MobX store conventions |
| `service-patterns.mdc` | `services/**/*.ts` | Stateless service patterns |
| `level-building.mdc` | `levels/**/*.ts` | Level definition patterns |
| `grid-physics.mdc` | Physics files | Coordinate systems |
| `naming-conventions.mdc` | All `src/` | Naming standards |
| `react-components.mdc` | React files | Component patterns |
| `entity-patterns.mdc` | Entity files | Enemy/collectible patterns |
| `events-signals.mdc` | Events (future) | Decoupled communication |
| `testing-patterns.mdc` | Test files | Test conventions |

---

## Vision

Epoch Runner prioritizes **Level Builder architecture**, shifting development from "coding levels" to "designing levels." The narrative, **The Chronological Odyssey**, leverages this modularity to transition players from primitive eras to deep-space sci-fi through visual "Epoch-Hopping."

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| UI & Tooling | React 19 + TypeScript | Component architecture, Level Builder interface |
| Rendering | HTML5 Canvas | Game loop, sprite rendering, physics visualization |
| State | MobX | High-frequency updates, real-time sync between editor and game |
| Backend | Firebase Realtime DB | Level JSON storage, asset metadata, player progress |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│   React Components • Level Builder GUI • HUD Overlays   │
└────────────────────────┬────────────────────────────────┘
                         │ observes
┌────────────────────────▼────────────────────────────────┐
│                    Store Layer                          │
│   GameStore • LevelStore • PlayerStore • EditorStore    │
└────────────────────────┬────────────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────────────┐
│                   Service Layer                         │
│   CanvasRenderer • PhysicsEngine • FirebaseService      │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── core/                 # Shared types, constants, utilities
│   ├── types/            # TypeScript interfaces & schemas
│   └── constants/        # Grid sizes, physics defaults
├── services/             # Stateless services (API, rendering, physics)
├── stores/               # MobX stores (game state, editor state)
├── features/             # Feature modules
│   ├── game/             # Canvas game loop, player controller
│   ├── editor/           # Level Builder UI
│   └── campaign/         # Overworld, level selection
├── levels/               # Level definitions and helpers
├── components/           # Shared React components
└── assets/               # Spritesheets, audio, fonts
```

## Documentation

- [Roadmap](./docs/roadmap.md) - Implementation phases and milestones
- [Tech Spec](./docs/tech_spec.md) - Architecture decisions and schemas
- [Changelog](./docs/changelog.md) - Development history

## Core Concepts

### Data-Driven Levels
Levels are JSON manifests parsed by an agnostic game loop. Swap `themeID: "StoneAge"` for `themeID: "Cyberpunk"` and the visuals change while physics remain identical.

### Grid System
- **Unit-Based**: Fixed grid (1 unit = 64px default)
- **Multi-Layer Rendering**: Collision (logic), Background (parallax), Entity (spawns)
- **O(1) Collision**: Coordinate-to-grid mapping for efficient lookups

### Dual-Access Level Builder
1. **Code-First** (Priority): JSON/code-driven templates for rapid campaign development
2. **In-Game GUI**: Player-facing editor unlocked post-campaign

## License

MIT
