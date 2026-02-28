---
description: Add a new entity type (enemy, collectible, trigger) to the game
---

Help the user add a new entity type to Epoch Runner.

**Ask the user for:**
1. Entity category: `enemy`, `collectible`, `trigger`, `npc`
2. Entity name (e.g., "goomba", "coin", "checkpoint")
3. Brief behavior description

**Based on the category, guide them through:**

## For Enemies

1. **Add type to `CollisionType` enum** (if needed for tile-based):
   - `src/core/types/index.ts`

2. **Create entity definition** (when EntityStore exists):
```typescript
const enemyGoomba: EntityDefinition = {
  id: 'enemy_goomba',
  type: 'enemy_patrol',
  displayName: 'Goomba',
  width: 48,
  height: 48,
  speed: 100,
  damage: 1,
}
```

3. **Add collision response** in PhysicsService:
```typescript
// In checkEntityCollision or similar
if (isEnemyCollision(entity)) {
  if (isStompFromAbove(player, entity)) {
    // Bounce and destroy enemy
    player.vy = JUMP_VELOCITY / 2
    entityStore.despawn(entity.id)
  } else {
    gameStore.damagePlayer(entity.damage)
  }
}
```

## For Collectibles

1. **Add collision type** if tile-based:
   - `COLLECTIBLE_COIN = 5` in CollisionType enum

2. **Add visual color** in constants:
   - `coin: '#ffd700'` in COLORS

3. **Add collection logic** in PhysicsService:
```typescript
if (level.isCollectibleAt(col, row)) {
  gameStore.addCoins(1)
  level.clearTile(col, row)
}
```

## For Triggers

1. **Add trigger type** if needed:
   - `TRIGGER_CHECKPOINT = 6` in CollisionType enum

2. **Add detection logic**:
```typescript
if (level.isCheckpointAt(col, row)) {
  levelStore.setCheckpoint(player.x, player.y)
  // Optional: visual feedback
}
```

## Level Placement

Show how to place the entity in a level:

```typescript
// For tile-based entities, use existing helpers or create new one:
export function coin(col: number, row: number): TilePlacement[] {
  return [{ col, row, type: CollisionType.COLLECTIBLE_COIN }]
}

// In level definition:
tiles(
  ground(30, 14),
  coin(10, 12),
  coin(12, 12),
  goal(28, 13),
)
```

**Reminder:** If adding a completely new entity system, the EntityStore and EntityService need to be created first. Check if they exist.
