# Jeff's Feature Ideas - Incremental Improvements

Quick wins and medium features that build on existing systems without major refactoring.

---

## 🚀 Quick Wins (1-2 hours each)

### 1. Flying Enemies
**What:** Aerial enemies that patrol horizontally at fixed Y positions
**Why:** More enemy variety, vertical threat
**Builds on:** Existing patrol enemy system
**Changes:**
- Add `ENEMY_FLYING` entity definition
- Modify `EntityService.update()` to skip gravity for flying type
- Add to entity helper functions
- Create test level showcasing flying enemies

---

### 2. Jumping Enemies
**What:** Ground enemies that hop periodically
**Why:** Less predictable than patrol, fun to dodge
**Builds on:** Patrol enemy + player jump mechanics
**Changes:**
- Add `ENEMY_JUMPING` entity definition
- Add jump timer to entity data
- Apply jump velocity on timer expire
- Create test level

---

### 3. Switches & Doors System
**What:** Pressure plates and switches that open/close doors
**Why:** Puzzle elements, gated progression
**Builds on:** Checkpoint trigger system
**New files:**
- `src/core/types/triggers.ts` - Switch/door definitions
- `src/stores/TriggerStore.ts` - Active switch states
- Add door rendering to GameplayRenderer
- Level helpers: `pressurePlate()`, `switch()`, `door()`

---

### 4. Circular Moving Platforms
**What:** Platforms that move in circular/elliptical paths
**Why:** More dynamic platform challenges
**Builds on:** Existing moving platform system
**Changes:**
- Add `'circular'` pattern to MovingPlatformSpawn
- Implement circle math in MovingPlatformService
- Add `circularPlatform()` helper
- Update Level 10 or create new demo

---

### 5. Screen Shake Effect
**What:** Camera shake on landing, enemy stomp, death
**Why:** Juice! Makes actions feel impactful
**Builds on:** Existing camera system
**Changes:**
- Add `shakeIntensity` and `shakeDuration` to CameraStore
- Add `shake(intensity, duration)` method
- Update CameraService to apply shake offset
- Trigger on: hard landing, enemy stomp, death, explosions (future)

---

### 6. Particle Effects System
**What:** Simple particle emitter for jumps, coin collection, death
**Why:** Visual polish without sprite work
**New files:**
- `src/core/types/particles.ts`
- `src/stores/ParticleStore.ts`
- `src/services/ParticleService.ts`
- Render particles in GameplayRenderer
**Effects:** Jump dust, coin sparkles, death puff, power-up glow

---

### 7. Level Stats NPM Script
**What:** `npm run stats:levels` shows summary of all levels
**Why:** Helps balance difficulty, find outliers
**Output:**
```
Level 0: Basic (16x12) - 0 coins, 3 lives, 0 enemies
Level 1: Shapes (20x15) - 5 coins, 3 lives, 0 enemies
...
Total: 10 levels, 87 coins, 8 unique enemies
```

---

### 8. Parallax Background Layers
**What:** Multi-layer backgrounds that scroll at different speeds
**Why:** Depth perception, visual richness
**Builds on:** Existing background rendering
**Changes:**
- Support multiple background layers in AssetStore
- Add `parallaxFactor` per layer
- Render layers back-to-front in GameplayRenderer

---

### 9. Coyote Time
**What:** Grace period to jump after walking off a ledge
**Why:** More forgiving platforming feel
**Builds on:** Player grounded state
**Changes:**
- Add `coyoteTimeRemaining` to PlayerStore
- Decrement on update when airborne
- Allow jump if coyoteTime > 0

---

### 10. Jump Buffering
**What:** Remember jump input for a few frames before landing
**Why:** Responsive controls even with imperfect timing
**Builds on:** Input system
**Changes:**
- Add `jumpBufferTime` to PlayerStore
- Track time since jump pressed
- Consume buffer on landing

---

## 🔨 Medium Features (2-4 hours each)

### 11. Boss Enemy System
**What:** Multi-hit enemies with health bars
**Why:** Level climax moments, requires strategy
**New features:**
- Health bar rendering above boss
- Multiple hit detection (track hits)
- Boss-specific behaviors (phases, attacks)
- Victory trigger when boss defeated

---

### 12. Shooting Enemies
**What:** Enemies that fire projectiles at player
**Why:** Ranged threats, forces movement
**New files:**
- `src/core/types/projectiles.ts`
- `src/stores/ProjectileStore.ts`
- `src/services/ProjectileService.ts`
**Features:**
- Projectile physics (straight line, arc, homing?)
- Collision with player and walls
- Enemy shoot timer and targeting

---

### 13. Input Recording/Playback
**What:** Record player inputs, replay for demos/testing
**Why:** Automated testing, speedrun verification, trailers
**New files:**
- `src/services/InputRecorder.ts`
- Save/load recording to JSON
**UI:** F6 to record, F7 to playback, F8 to stop

---

### 14. Performance Profiler Overlay
**What:** In-game FPS, frame time, memory display
**Why:** Diagnose performance issues
**Changes:**
- Add profiler panel to DebugRenderer
- Track frame times (rolling average)
- Memory usage (if available)
- Toggle with F9

---

### 15. Level Comparison Tool
**What:** `npm run compare:levels <id1> <id2>` side-by-side diff
**Why:** See what changed between versions
**Features:**
- ASCII grid diff with color coding
- Metadata comparison (size, coins, enemies)
- Highlight changed tiles

---

### 16. Automated Level Validation
**What:** `npm run lint:levels` checks for design mistakes
**Why:** Catch impossible jumps, unreachable areas, missing goals
**Checks:**
- Goal reachability (flood fill from spawn)
- Jump distances (max 4 tiles with double jump)
- Spawn not in solid tile
- At least one goal exists

---

### 17. Overworld Level Select
**What:** Visual map showing level progression
**Why:** Better campaign UX, unlock visualization
**New files:**
- `src/features/overworld/OverworldCanvas.tsx`
- `src/services/renderers/screens/OverworldRenderer.ts`
**Features:**
- Node-based map (circles connected by lines)
- Locked/unlocked visual states
- Click to select level
- Show completion stars/coins

---

### 18. Magnet Power-up
**What:** Attracts nearby coins automatically
**Why:** Satisfying collection, less precision needed
**Changes:**
- Add POWERUP_MAGNET tile type
- Add magnetRadius and magnetActive to PlayerStore
- Check coin distance each frame, collect if in range
- Visual indicator (coin paths curving toward player?)

---

### 19. Shield Power-up
**What:** One-hit protection that disappears after blocking damage
**Why:** More forgiving hazard sections
**Changes:**
- Add POWERUP_SHIELD tile type
- Add hasShield to PlayerStore
- Block first hazard/enemy hit, remove shield
- Visual: Bubble around player

---

### 20. Timed Levels
**What:** Optional par time for each level, speedrun mode
**Why:** Replayability, competitive element
**Changes:**
- Add `parTime` to LevelDefinition (already exists!)
- Track current level time in CampaignStore
- Show timer in HUD (optional toggle)
- Award star if completed under par
- Best time tracking per level

---

## 🎯 Prioritization

**Start with these 5 (easiest + most impactful):**
1. **Screen Shake** - Instant juice
2. **Coyote Time + Jump Buffering** - Feel improvement
3. **Flying Enemies** - Quick enemy variety
4. **Level Stats Script** - Useful immediately
5. **Timed Levels** - Already structured, just needs UI

**Then these 3 (solid medium wins):**
6. **Switches & Doors** - New puzzle mechanic
7. **Particle Effects** - Visual polish
8. **Circular Platforms** - Platform variety

**Save for later (more complex but valuable):**
- Boss enemies (needs design)
- Shooting enemies (new system)
- Overworld (UI work)
- Input recording (testing infrastructure)

---

## 🎨 Visual Polish (Optional)

- **Animated Tiles:** Water ripples, lava bubbles
- **Player Animation States:** Idle fidget, landing squash
- **Death Animation:** Fade out instead of instant respawn
- **Coin Counter Animation:** Pop and scale when collecting
- **Level Transition:** Fade to black instead of instant load
- **Victory Flourish:** Confetti or particle burst on level complete

---

## 📝 Notes

All features follow existing patterns:
- Three-layer architecture (UI → Store → Service)
- MobX for state
- Stateless services
- Helper functions for level building
- TypeScript typed
- Works with existing level system

Each can be a standalone PR, merged independently.

Let's ship some features! 🚀
