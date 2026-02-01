/**
 * Test Level - A 40x15 level for testing camera scrolling
 * 
 * This is the original small test level, now expanded to test camera movement.
 */

import { createLevel, tiles, ground, platform, goal, stairsUpRight, wall } from './helpers'

export const level_test = createLevel(
  'level_test',
  'Camera Test Level',
  40,  // 40 tiles wide (2560px) - requires horizontal scrolling
  15,  // 15 tiles tall (960px) - slight vertical scrolling
  { col: 2, row: 13 },  // Player spawn near bottom-left
  tiles(
    // Ground floor
    ground(40, 14),
    
    // Starting platforms (left side)
    platform(5, 12, 4),
    platform(11, 10, 4),
    
    // Middle section - some jumps
    platform(17, 12, 3),
    platform(22, 10, 3),
    platform(27, 8, 3),
    
    // Stairs section
    stairsUpRight(30, 12, 6, 2, 1),
    
    // High platform near the end
    platform(32, 6, 4),
    platform(38, 5, 2),
    
    // Goal on the far right
    goal(38, 4),
    
    // Some obstacles
    wall(15, 11, 3),
    wall(25, 9, 5),
  ),
  {
    description: 'A test level for camera scrolling functionality',
    author: 'System',
    parTime: 30,
  }
)
