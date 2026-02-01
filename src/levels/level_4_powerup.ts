/**
 * Level 4: Power-ups
 * 
 * Introduces the double jump power-up.
 * Features: Double jump, timed challenges, high platforms
 */

import { 
  createLevel, 
  tiles, 
  ground, 
  platform, 
  goal,
  wall,
  doubleJump,
  coin,
  coinRow,
  spikesUp,
  checkpoint,
  oneWayPlatform,
} from './helpers'

export const level_4_powerup = createLevel(
  'level_4_powerup',
  'Level 4: Sky High',
  50,  // 50 tiles wide
  20,  // 20 tiles tall (extra tall for vertical challenge)
  { col: 2, row: 18 },  // Player spawn
  tiles(
    // Ground floor
    ground(50, 19),
    
    // ===== Section 1: Normal Jumps First =====
    
    // Show what's possible without power-up
    platform(5, 16, 3),
    platform(10, 14, 3),
    coinRow(10, 13, 3),
    
    // ===== Section 2: First Power-up =====
    
    // Power-up introduction
    doubleJump(15, 18),
    
    // Impossible without double jump
    platform(17, 10, 3),
    coinRow(17, 9, 3),
    
    // Return path
    platform(21, 14, 2),
    
    // Checkpoint
    checkpoint(24, 18),
    
    // ===== Section 3: Spike Gap Challenge =====
    
    // Power-up for spike gap
    doubleJump(26, 18),
    
    // Wide spike pit
    spikesUp(28, 19, 6),
    
    // Must double jump to clear
    platform(34, 18, 3),
    
    // ===== Section 4: Vertical Tower =====
    
    // Second checkpoint
    checkpoint(37, 18),
    
    // Power-up for tower
    doubleJump(38, 18),
    
    // Tower walls (shortened for entry and exit)
    wall(39, 2, 15),   // rows 2-16, leaves rows 17-18 open for entry
    wall(47, 6, 13),   // rows 6-18, leaves rows 2-5 open for exit
    
    // Tower platforms (4-tile spacing = achievable with double jump)
    platform(40, 16, 5),
    coin(42, 15),
    
    platform(40, 12, 5),
    coin(42, 11),
    
    platform(40, 8, 5),
    coin(42, 7),
    
    platform(40, 5, 5),
    coin(42, 4),
    
    // Exit from tower
    platform(46, 4, 3),
    
    // Goal
    goal(48, 3),
    
    // Boundaries
    wall(0, 0, 19),
    wall(49, 0, 19),
    platform(0, 1, 50),
  ),
  {
    description: 'Grab the power-up orbs to double jump! The effect is temporary.',
    author: 'System',
    startingLives: 5,
    parTime: 75,
  }
)
