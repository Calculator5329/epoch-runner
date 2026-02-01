/**
 * Level 0 Powerup - Double jump testing
 * 
 * Tests: Double jump power-up, timed power-ups, advanced platforming
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

export const level_0_powerup = createLevel(
  'level_0_powerup',
  'Age 0: Double Jump',
  55,  // 55 tiles wide
  18,  // 18 tiles tall (taller for vertical sections)
  { col: 2, row: 16 },  // Player spawn
  tiles(
    // Ground floor
    ground(55, 17),
    
    // ===== Section 1: Normal Jump Baseline =====
    
    // These jumps are possible without double jump
    platform(5, 14, 3),
    platform(10, 12, 3),
    platform(15, 14, 3),
    
    // Coins to collect normally
    coinRow(5, 13, 3),
    coinRow(10, 11, 3),
    
    // ===== Section 2: First Double Jump =====
    
    // Power-up location
    doubleJump(18, 16),
    
    // Gap that requires double jump
    platform(20, 17, 0),  // End of ground
    spikesUp(20, 17, 5),  // Spike pit
    platform(25, 17, 0),  // Ground resumes
    
    // Platform too high for single jump
    platform(22, 10, 4),
    coinRow(22, 9, 4),
    
    // Checkpoint after first challenge
    checkpoint(28, 16),
    
    // ===== Section 3: Vertical Climb =====
    
    // Tower section requiring double jump
    wall(32, 3, 14),
    wall(38, 3, 14),
    
    // Platforms inside tower
    platform(33, 14, 4),
    platform(33, 10, 4),
    platform(33, 6, 4),
    
    // Coins in tower
    coin(35, 13),
    coin(35, 9),
    coin(35, 5),
    
    // Power-up at base of tower
    doubleJump(35, 16),
    
    // Exit from tower
    platform(38, 4, 5),
    
    // ===== Section 4: Timed Challenge =====
    
    // Checkpoint before timed section
    checkpoint(42, 16),
    
    // Power-up starts the timer
    doubleJump(44, 16),
    
    // Series of high jumps that need double jump
    // Must complete before power-up expires!
    platform(46, 12, 2),
    platform(48, 8, 2),
    platform(50, 4, 2),
    
    // Coins along the path
    coin(46, 11),
    coin(48, 7),
    coin(50, 3),
    
    // Goal at the top
    platform(52, 2, 3),
    goal(53, 1),
  ),
  {
    description: 'Use double jump power-ups to reach new heights!',
    author: 'System',
    startingLives: 5,
    parTime: 90,
  }
)
