/**
 * Level 10: Platform Rider
 * 
 * Introduces moving platforms - both horizontal and vertical.
 * Player must use momentum and timing to ride platforms safely.
 */

import {
  createLevel,
  ground,
  platform,
  wall,
  goal,
  coin,
  coins,
  checkpoint,
  horizontalPlatform,
  verticalPlatform,
  movingPlatforms,
  hazard,
} from './helpers'

export const level_10_platforms = createLevel({
  id: 'level_10_platforms',
  name: 'Platform Rider',
  description: 'Master moving platforms to reach the goal',
  width: 50,
  height: 20,
  startingLives: 3,

  tiles: [
    // Starting area - safe ground
    ...ground(0, 5, 19),
    ...wall(0, 15, 5),
    
    // Section 1: Horizontal platform over spike pit
    ...hazard(8, 19, 12),
    ...platform(20, 18, 3),
    
    // Section 2: Vertical platform to upper level
    ...platform(25, 18, 3),
    ...platform(25, 10, 3),
    
    // Section 3: Multiple horizontal platforms at different speeds
    ...platform(35, 18, 3),
    ...platform(35, 13, 3),
    ...platform(35, 8, 3),
    
    // Goal area
    ...platform(45, 5, 5),
    goal(47, 4),
    
    // Checkpoints
    checkpoint(21, 17),
    checkpoint(36, 7),
    
    // Coins for optional collection
    ...coins(10, 17, 8),
    ...coins(27, 8, 5, 'vertical'),
    ...coins(40, 11, 4),
  ],

  movingPlatforms: movingPlatforms(
    // Section 1: Horizontal platform over spikes
    // Moves between col 8 and col 17, at row 17
    horizontalPlatform(8, 17, 17, 17, 4, 100, '#9f7aea'),
    
    // Section 2: Vertical platform elevator
    // Moves between row 18 and row 10, at col 28
    verticalPlatform(28, 18, 28, 10, 3, 80, '#4299e1'),
    
    // Section 3: Fast horizontal platform
    horizontalPlatform(30, 12, 40, 12, 3, 150, '#ed64a6'),
    
    // Section 3: Slow horizontal platform (easier timing)
    verticalPlatform(38, 15, 38, 7, 3, 60, '#48bb78'),
  ),

  playerSpawn: { col: 2, row: 17 },
})
