/**
 * Level 5: The Gauntlet
 * 
 * The ultimate challenge combining ALL mechanics.
 * Features: Shapes, hazards, coins, checkpoints, power-ups, one-way platforms
 */

import { 
  createLevel, 
  tiles, 
  platform, 
  goal,
  wall,
  // Shapes
  halfBlockLeft,
  halfBlockRight,
  // Hazards
  spikesUp,
  spikesDown,
  spikesLeft,
  spikesRight,
  hazard,
  // Coins
  coin,
  coinRow,
  coinArc,
  // Platforms
  oneWayPlatform,
  // Power-ups
  tripleJump,
  // Checkpoints
  checkpoint,
} from './helpers'

export const level_5_gauntlet = createLevel(
  'level_5_gauntlet',
  'The Gauntlet',
  60,  // 60 tiles wide
  20,  // 20 tiles tall
  { col: 2, row: 18 },  // Player spawn
  tiles(
    // Ground floor with gaps
    platform(0, 19, 15),
    platform(20, 19, 15),
    platform(40, 19, 20),
    
    // ===== Section 1: Shape Warm-up =====
    
    // Half block stepping
    halfBlockRight(5, 17),
    platform(6, 17, 2),
    halfBlockLeft(8, 17),
    
    // Coins on shape path
    coinRow(5, 16, 4),
    
    // Stair climb
    platform(10, 17, 1),
    platform(11, 16, 1),
    platform(12, 15, 2),
    coinRow(12, 14, 2),
    
    // ===== Section 2: Spike Pit =====
    
    // First spike pit (3 tiles - clearable with normal jump)
    spikesUp(16, 19, 3),
    
    // Coin arc over pit
    coinArc(16, 14, 3, 2),
    
    // First checkpoint
    checkpoint(21, 18),
    
    // ===== Section 3: Hazard Corridor =====
    
    // Walls shortened to allow ground entry (rows 14-16, open at 17-18)
    wall(23, 14, 3),
    wall(31, 14, 3),
    spikesRight(23, 15, 1),  // Single spike on wall
    spikesLeft(31, 15, 1),
    
    // Navigate through (more room to maneuver)
    oneWayPlatform(25, 17, 4),
    coin(27, 16),
    platform(27, 15, 2),
    
    // Ceiling spikes (moved to fit new layout)
    platform(33, 15, 4),
    spikesDown(34, 15, 2),
    
    // Second checkpoint
    checkpoint(36, 18),
    
    // ===== Section 4: Double Jump Required =====
    // (Heights tuned for double jump ~272px; gap for horizontal double jump)
    
    // Small platform so player can reach double jump before spike pit
    platform(36, 18, 4),
    tripleJump(38, 18),
    
    // High platform (reachable with double jump from ground)
    platform(40, 14, 3),
    coinRow(40, 13, 3),
    
    // Spike gap (double jump to clear)
    spikesUp(40, 19, 4),
    platform(44, 18, 3),
    
    // ===== Section 5: Vertical Challenge =====
    // (~2-tile steps so single jump between each)
    
    checkpoint(48, 18),
    tripleJump(49, 18),
    
    oneWayPlatform(50, 17, 4),
    coin(52, 16),
    
    oneWayPlatform(50, 14, 4),
    coin(52, 13),
    spikesRight(49, 13, 1),
    
    oneWayPlatform(50, 11, 4),
    coin(52, 10),
    
    // ===== Section 6: Final Gauntlet =====
    
    platform(54, 9, 2),
    coin(55, 8),
    
    platform(56, 6, 2),
    
    hazard(58, 6),
    
    coin(56, 5),
    coin(57, 5),
    
    goal(56, 3),
    
    // Boundaries
    wall(0, 0, 19),
    wall(59, 0, 19),
    platform(0, 1, 60),
  ),
  {
    description: 'The ultimate test! Use everything you\'ve learned to conquer the gauntlet.',
    author: 'System',
    startingLives: 7,
    parTime: 120,
  }
)
