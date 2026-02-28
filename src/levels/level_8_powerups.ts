/**
 * Level 8: Power Surge
 * 
 * The ultimate power-up challenge! Each section requires a specific power-up.
 * Features: Speed boost gauntlet, super jump tower, invincibility corridor
 */

import { 
  createLevel, 
  tiles, 
  platform, 
  goal,
  wall,
  checkpoint,
  coin,
  coinRow,
  spikesUp,
  spikesDown,
  spikesLeft,
  spikesRight,
  speedBoost,
  superJump,
  invincibility,
  patrolEnemy,
  entities,
} from './helpers'

export const level_8_powerups = createLevel(
  'level_8_powerups',
  'Power Surge',
  70,  // 70 tiles wide
  25,  // 25 tiles tall (extra tall for vertical sections)
  { col: 2, row: 23 },  // Player spawn
  tiles(
    // ===== Ground Base =====
    platform(0, 24, 15),   // Starting area
    
    // ===== SECTION 1: SPEED GAUNTLET =====
    // Long spike pit that requires 2x speed to clear with a running jump
    
    // Speed boost power-up
    speedBoost(8, 23),
    
    // Warning: spikes ahead!
    coinRow(10, 22, 3),
    
    // Long spike pit (7 tiles - impossible at normal speed, possible at 2x)
    spikesUp(15, 24, 7),
    
    // Landing platform
    platform(22, 24, 8),
    coinRow(23, 23, 5),
    
    // First checkpoint
    checkpoint(28, 23),
    
    // ===== SECTION 2: SUPER JUMP TOWER =====
    // Vertical climb with platforms too high for normal/double jump
    
    // Super jump power-up at base
    superJump(30, 23),
    
    // Tower entrance
    platform(30, 24, 5),
    
    // Tower walls - open top so player can exit
    wall(29, 10, 12),  // Left wall (rows 10-21) - stops at row 10 so player can exit
    wall(36, 14, 10),  // Right wall (rows 14-23)
    
    // Tower platforms - 4 tiles apart (needs super jump, ~4.8 tile max height)
    // Normal jump = ~2 tiles, Double jump = ~4 tiles, Super jump = ~4.8 tiles
    platform(30, 20, 5),  // First platform (4 tiles up from ground)
    coin(32, 19),
    
    platform(30, 16, 5),  // Second platform (4 tiles up)
    coin(32, 15),
    
    platform(25, 12, 5),  // Third platform (4 tiles up)
    coin(32, 11),
    
    platform(30, 8, 5),   // Top platform (4 tiles up)
    coinRow(31, 7, 3),
    
    // Exit from tower - jump right from top platform (row 8)
    // Exit platform at row 12 gives 4 tiles clearance (rows 8-11)
    platform(35, 12, 4),
    
    // Descent platforms
    platform(40, 15, 4),
    platform(38, 18, 4),
    platform(41, 21, 4),
    platform(42, 24, 10),  // Ground after tower
    
    // Second checkpoint
    checkpoint(45, 23),
    
    // ===== SECTION 3: INVINCIBILITY CORRIDOR =====
    // Dense hazard section that's impossible without invincibility
    
    // Invincibility power-up
    invincibility(48, 23),
    
    // The gauntlet - spikes everywhere!
    platform(50, 24, 15),
    
    // Spike ceiling
    spikesDown(51, 21, 12),
    
    // Spike floor sections (gaps to jump through normally would be suicide)
    spikesUp(52, 24, 3),
    spikesUp(57, 24, 3),
    spikesUp(62, 24, 2),
    
    // Side spikes
    spikesRight(50, 22, 2),
    spikesLeft(64, 22, 2),
    
    // Coins through the danger zone
    coinRow(53, 23, 10),
    
    // Exit platform
    platform(65, 24, 5),
    
    // Third checkpoint
    checkpoint(67, 23),
    
    // ===== GOAL =====
    goal(69, 23),
    
    // Left boundary wall
    wall(0, 0, 24),
  ),
  {
    description: 'Master the power-ups! Speed to cross gaps, jump to reach heights, and become invincible to survive!',
    author: 'System',
    startingLives: 7,  // Extra lives for this challenging level
    parTime: 90,
    entities: entities(
      // Patrol enemy in the spike corridor (need invincibility to pass)
      patrolEnemy(55, 23, 'right'),
      patrolEnemy(60, 23, 'left'),
    ),
  }
)
