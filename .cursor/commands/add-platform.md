---
description: Add a platform or obstacle to the current level
---

Help the user add a new platform or obstacle to a level file.

Ask what they want to add:
- Floating platform (horizontal)
- Wall/pillar (vertical)
- Stairs (up-right or up-left)
- Rectangular block
- Gap in the floor

Then ask for the position in grid coordinates (col, row) and size.

Generate the appropriate helper call and show where to add it in the `tiles(...)` call.

Remember:
- Row 0 is TOP, higher rows go DOWN
- Col 0 is LEFT, higher cols go RIGHT
- Player spawn row 13 on a 15-tile-high level means near the bottom
