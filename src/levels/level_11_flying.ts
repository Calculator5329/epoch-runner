/**
 * Level 11: Sky Patrol
 * 
 * Introduces flying enemies that patrol horizontally in mid-air.
 * Players must dodge aerial threats and time jumps carefully.
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
  flyingEnemy,
  flyingEnemyRow,
  entities,
} from './helpers'

export const level_11_flying = createLevel({
  id: 'level_11_flying',
  name: 'Sky Patrol',
  description: 'Dodge flying enemies patrolling in mid-air',
  width: 45,
  height: 18,
  startingLives: 3,

  tiles: [
    // Starting area - safe ground
    ...ground(0, 5, 17),
    ...wall(0, 13, 5),
    
    // Section 1: Single flying enemy introduction
    ...platform(8, 16, 4),
    
    // Section 2: Multiple flying enemies at different heights
    ...platform(15, 16, 4),
    ...platform(15, 11, 4),
    
    // Section 3: Flying enemy corridor - requires precise timing
    ...platform(25, 16, 3),
    ...platform(30, 16, 3),
    ...platform(35, 16, 3),
    
    // Goal area
    ...platform(40, 14, 5),
    goal(42, 13),
    
    // Checkpoints
    checkpoint(16, 15),
    checkpoint(36, 15),
    
    // Coins for optional collection
    ...coins(10, 14, 3),
    ...coins(17, 9, 3),
    ...coins(27, 13, 3),
  ],

  entities: entities(
    // Section 1: Single flying enemy to learn the mechanic
    flyingEnemy(10, 15, 'right'),
    
    // Section 2: Vertical stack of flying enemies
    flyingEnemy(17, 14, 'left'),
    flyingEnemy(17, 10, 'right'),
    flyingEnemy(17, 6, 'left'),
    
    // Section 3: Horizontal gauntlet
    ...flyingEnemyRow(26, 14, 3, 5, 'left'),
    flyingEnemy(32, 12, 'right'),
    flyingEnemy(28, 10, 'left'),
  ),

  playerSpawn: { col: 2, row: 15 },
})
