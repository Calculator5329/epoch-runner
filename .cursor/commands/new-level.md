---
description: Create a new level file with boilerplate
---

Create a new level file for Epoch Runner.

Ask the user for:
1. Level name (snake_case, e.g., `tutorial_01`, `cave_escape`)
2. Brief description of the level's theme/challenge

Then:
1. Create the file at `src/levels/{name}.ts` using the level building helpers
2. Include: ground floor, left/right walls, a goal tile, and player spawn
3. Add the import and registration line to `src/levels/index.ts`
4. Suggest 2-3 platform placements based on the theme they described

Use the helpers from `src/levels/helpers.ts`: `createLevel`, `tiles`, `platform`, `wall`, `goal`, `ground`, `rect`, `stairsUpRight`
