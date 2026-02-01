---
description: Show available level building helper functions
---

Display a quick reference of all level building helpers from `src/levels/helpers.ts`:

```typescript
// Grid creation
createEmptyGrid(width, height)        // Empty collision grid
buildGrid(width, height, fn)          // Custom tile function

// Tile placements (return TilePlacement[])
platform(col, row, length)            // Horizontal solid tiles
wall(col, row, height)                // Vertical solid tiles  
goal(col, row)                        // Single goal tile
rect(col, row, width, height, type?)  // Filled rectangle
hollowRect(col, row, w, h, type?)     // Rectangle outline
stairsUpRight(col, row, steps, stepWidth?, stepHeight?)
stairsUpLeft(col, row, steps, stepWidth?, stepHeight?)

// Level shortcuts
ground(width, row)                    // Full-width floor
walls(height, width)                  // Left + right walls
ceiling(width)                        // Full-width ceiling at row 0
border(width, height)                 // Full border outline

// Composition
tiles(...placementArrays)             // Merge multiple arrays
createLevel(id, name, w, h, spawn, placements, options?)
```

Grid coordinates: `collision[row][col]` (row-major)
TILE_SIZE = 64 pixels
