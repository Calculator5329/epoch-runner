---
description: Show available level building helper functions
---

Display a quick reference of all level building helpers from `src/levels/helpers.ts`:

## Basic Solid Tiles

```typescript
platform(col, row, length)            // Horizontal solid row
wall(col, row, height)                // Vertical solid column
rect(col, row, width, height, type?)  // Filled rectangle
hollowRect(col, row, w, h, type?)     // Rectangle outline
```

## Partial Blocks (Shape System)

```typescript
halfBlockLeft(col, row)               // Left half of tile
halfBlockRight(col, row)              // Right half of tile
halfBlockTop(col, row)                // Top half of tile
halfBlockBottom(col, row)             // Bottom half of tile
quarterBlock(col, row, 'tl'|'tr'|'bl'|'br')  // Quarter tile
```

## Slopes

```typescript
slopeUpRight(col, row)                // Single slope tile (up-right)
slopeUpLeft(col, row)                 // Single slope tile (up-left)
rampUpRight(col, row, length)         // Multi-tile ramp with fill
rampUpLeft(col, row, length)          // Multi-tile ramp with fill
stairsUpRight(col, row, steps, stepWidth?, stepHeight?)
stairsUpLeft(col, row, steps, stepWidth?, stepHeight?)
```

## One-Way Platforms

```typescript
oneWayPlatform(col, row, length)      // Pass-through from below
```

## Hazards

```typescript
hazard(col, row)                      // Full hazard block
spikesUp(col, row, length)            // Row of upward spikes
spikesDown(col, row, length)          // Row of downward spikes
spikesLeft(col, row, height)          // Column of left spikes
spikesRight(col, row, height)         // Column of right spikes
```

## Pickups & Power-ups

```typescript
coin(col, row)                        // Single coin
coins([{col, row}, ...])              // Multiple coins at positions
coinRow(col, row, length)             // Horizontal row of coins
coinArc(col, peakRow, length, height?)  // Arc of coins (jump path)
doubleJump(col, row)                  // Double jump power-up
```

## Triggers

```typescript
goal(col, row)                        // Level completion tile
checkpoint(col, row)                  // Mid-level respawn point
```

## Level Shortcuts

```typescript
ground(width, row)                    // Full-width floor
walls(height, width)                  // Left + right boundary walls
ceiling(width)                        // Full-width ceiling at row 0
border(width, height)                 // Full rectangle border
```

## Composition

```typescript
tiles(...arrays)                      // Merge placement arrays
createLevel(id, name, w, h, spawn, placements, options?)
```

## Options for createLevel

```typescript
{
  description?: string
  author?: string
  startingLives?: number  // Default 3
  parTime?: number        // Seconds
  themeId?: string        // Future use
}
```

## Grid Info

- `collision[row][col]` - Row-major order
- `TILE_SIZE = 64` pixels
- Row 0 = top, higher rows = down
- Col 0 = left, higher cols = right
