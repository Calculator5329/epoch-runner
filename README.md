# Epoch Runner

A modular 2D platformer engine where game logic is entirely decoupled from level design. Build once, design infinitely.

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
├── components/           # Shared React components
└── assets/               # Spritesheets, audio, fonts
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
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
