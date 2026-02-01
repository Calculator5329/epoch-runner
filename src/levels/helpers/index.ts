/**
 * Level Helpers - Barrel Export
 * 
 * All helper functions for building levels are exported from here.
 * Import from './helpers' or './helpers/index' to get all helpers.
 */

// Grid utilities
export { createEmptyGrid, buildGrid, applyPlacements } from './grid'

// Solid tiles
export {
  platform,
  wall,
  rect,
  hollowRect,
  // Material variants
  brick,
  brickPlatform,
  stone,
  stonePlatform,
  metal,
  metalPlatform,
  wood,
  woodPlatform,
  ice,
  icePlatform,
  grass,
  grassPlatform,
  sand,
  sandPlatform,
  dirt,
  dirtPlatform,
  crystal,
  crystalPlatform,
  lavaRock,
  lavaRockPlatform,
} from './solids'

// Partial blocks and slopes
export {
  halfBlockLeft,
  halfBlockRight,
  halfBlockTop,
  halfBlockBottom,
  quarterBlock,
  slopeUpRight,
  slopeUpLeft,
  rampUpRight,
  rampUpLeft,
  oneWayPlatform,
} from './shapes'

// Hazards
export {
  hazard,
  spikesUp,
  spikesDown,
  spikesLeft,
  spikesRight,
} from './hazards'

// Pickups
export {
  coin,
  coins,
  coinRow,
  coinArc,
  tripleJump,
  speedBoost,
  superJump,
  invincibility,
} from './pickups'

// Triggers
export { goal, checkpoint } from './triggers'

// Stairs
export { stairsUpRight, stairsUpLeft } from './stairs'

// Level building
export {
  createLevel,
  tiles,
  ground,
  walls,
  ceiling,
  border,
  // Entity helpers
  patrolEnemy,
  staticEnemy,
  patrolEnemyRow,
  entities,
} from './building'
