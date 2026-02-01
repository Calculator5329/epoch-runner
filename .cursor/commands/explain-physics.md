---
description: Explain the physics system and constants
---

Explain the Epoch Runner physics system:

**Constants** (from `src/core/constants/index.ts`):
- TILE_SIZE = 64px (grid unit)
- GRAVITY = 1500 px/sec² (downward acceleration)
- PLAYER_SPEED = 300 px/sec (horizontal movement)
- JUMP_VELOCITY = -550 px/sec (negative = upward)
- MAX_FALL_SPEED = 800 px/sec (terminal velocity)

**Physics Loop** (`PhysicsService.update()`):
1. Apply gravity: `vy += GRAVITY * deltaTime`
2. Cap fall speed at MAX_FALL_SPEED
3. Move horizontally, check wall collision
4. Move vertically, check floor/ceiling collision
5. Check goal tile overlap

**Collision Detection**:
- O(1) grid lookup: `collision[row][col]`
- Player hitbox checked against tiles at corners
- Snap to tile edge on collision

**Coordinate Systems**:
- World: pixels, origin top-left
- Grid: tiles, `col = floor(x/64)`, `row = floor(y/64)`
- Screen: world position minus camera position
