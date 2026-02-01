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
  tripleJump,
  coin,
  coinRow,
  spikesUp,
  checkpoint,
} from './helpers'

export const level_4_powerup = createLevel(
  'level_4_powerup',
  'Sky High',
  50,  // 50 tiles wide
  20,  // 20 tiles tall (extra tall for vertical challenge)
  { col: 2, row: 18 },  // Player spawn
  tiles(
    // Ground floor
    ground(50, 19),
    
    // ===== Section 1: Normal Jumps First =====
    // (Heights tuned for max jump ~136px / ~2 tiles)
    
    platform(5, 17, 3),
    platform(10, 15, 3),
    coinRow(10, 14, 3),
    
    // ===== Section 2: First Power-up =====
    
    // Power-up introduction
    tripleJump(15, 18),
    
    // Impossible without double jump
    platform(17, 10, 3),
    coinRow(17, 9, 3),
    
    // Return path (reachable after landing from high platform)
    platform(21, 15, 2),
    
    // Checkpoint
    checkpoint(24, 18),
    
    // ===== Section 3: Spike Gap Challenge =====
    
    // Power-up for spike gap
    tripleJump(26, 18),
    
    // Spike pit (gap tuned for double-jump horizontal distance ~5 tiles)
    spikesUp(28, 19, 4),
    
    // Landing platform (close enough to clear with double jump)
    platform(32, 18, 3),
    
    // ===== Section 4: Vertical Tower =====
    
    // Second checkpoint
    checkpoint(37, 18),
    
    // Power-up for tower
    tripleJump(38, 18),
    
    // Tower walls (shortened for entry and exit)
    // Note: Platform spacing needs 3+ tiles for player clearance (~1.4 tiles tall)
    wall(39, 2, 13),   // rows 2-14, leaves rows 15-18 open for entry
    wall(47, 6, 10),   // rows 6-15, leaves rows 2-5 open for exit
    
    // Tower platforms (3-tile gaps = safe clearance for 1.4-tile player)
    platform(40, 17, 5),
    coin(42, 16),
    
    platform(40, 14, 5),  // 3-tile gap from row 17
    coin(42, 13),
    
    platform(40, 11, 5),  // 3-tile gap from row 14
    coin(42, 10),
    
    platform(40, 8, 5),   // 3-tile gap from row 11
    coin(42, 7),
    
    platform(40, 5, 5),   // 3-tile gap from row 8
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
