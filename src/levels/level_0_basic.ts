/**
 * Level 0 Basic - Original test level renamed
 * 
 * A simple platforming test with basic solid blocks.
 * Tests: Basic movement, jumping, platforms, goal
 */

import { createLevel, tiles, ground, platform, goal, stairsUpRight, wall, miniSize } from './helpers'

export const level_0_basic = createLevel(
  'level_0_basic',
  'Basic Platforming',
  40,  // 40 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor
    ground(40, 14),
    
    // Starting platforms
    platform(5, 12, 4),
    platform(11, 10, 4),
    
    // Middle section
    platform(17, 12, 3),
    platform(22, 10, 3),
    platform(27, 8, 3),
    
    // Stairs section
    stairsUpRight(30, 12, 6, 2, 1),
    
    // High platform near end
    platform(32, 6, 4),
    platform(38, 5, 2),
    
    // Goal
    goal(38, 4),
    
    // Obstacles
    wall(15, 11, 3),
    wall(25, 9, 5),
    
    // Powerups
    ...miniSize(10, 11),  // Mini size powerup at column 10, row 11 (on ground level)
  ),
  {
    description: 'Basic platforming test - movement and jumping',
    author: 'System',
    startingLives: 3,
    parTime: 30,
  }
)
