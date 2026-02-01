---
description: Help debug collision or physics issues
---

Help diagnose collision/physics bugs in Epoch Runner.

Common issues to check:

1. **Player falls through floor**
   - Is there a solid tile at the row below spawn?
   - Check `collision[row][col]` is `CollisionType.SOLID`
   - Verify ground() covers the full width

2. **Player stuck in wall**
   - Spawn position might be inside a solid tile
   - Check `playerSpawn` coordinates aren't on a SOLID tile

3. **Can't reach goal**
   - Verify goal tile exists: `goal(col, row)` in tiles()
   - Check goal isn't blocked by solid tiles

4. **Jumping feels wrong**
   - JUMP_VELOCITY = -550 (negative = up)
   - Can only jump when `isGrounded` is true
   - Check ground detection in PhysicsService

5. **Camera not following**
   - CameraService.follow() needs player center position
   - Check viewport bounds are set from level dimensions

Ask the user what specific behavior they're seeing, then inspect the relevant code.
