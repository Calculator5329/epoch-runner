/**
 * Level 0 Coins - Currency collection testing
 * 
 * Tests: Coin pickups, coin economy, checkpoints
 */

import { 
  createLevel, 
  tiles, 
  ground, 
  platform, 
  goal,
  coin,
  coinRow,
  coinArc,
  checkpoint,
  spikesUp,
  oneWayPlatform,
} from './helpers'

export const level_0_coins = createLevel(
  'level_0_coins',
  'Age 0: Coin Collection',
  50,  // 50 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor
    ground(50, 14),
    
    // ===== Section 1: Basic Coin Row =====
    
    // Simple coins on ground
    coinRow(5, 13, 5),
    
    // ===== Section 2: Floating Coins =====
    
    // Coins above platform
    platform(12, 11, 4),
    coinRow(12, 10, 4),
    
    // ===== Section 3: Coin Arc (Jump Path) =====
    
    // Arc of coins showing jump trajectory
    coinArc(18, 10, 5, 3),
    
    // Small gap with coins above
    platform(24, 14, 0),  // Gap starts here
    spikesUp(24, 14, 2),  // Spikes in gap
    platform(26, 14, 0),  // Gap ends
    
    // First checkpoint
    checkpoint(28, 13),
    
    // ===== Section 4: Vertical Coin Climb =====
    
    // One-way platforms with coins
    oneWayPlatform(30, 11, 3),
    coin(31, 10),
    
    oneWayPlatform(32, 8, 3),
    coin(33, 7),
    
    oneWayPlatform(30, 5, 3),
    coin(31, 4),
    
    // ===== Section 5: Coin Gauntlet =====
    
    // Second checkpoint
    checkpoint(36, 13),
    
    // Dense coin section
    coinRow(38, 13, 3),
    platform(38, 11, 3),
    coinRow(38, 10, 3),
    platform(42, 9, 3),
    coinRow(42, 8, 3),
    
    // Goal with final coins
    coin(46, 6),
    coin(47, 6),
    coin(48, 6),
    platform(45, 7, 4),
    goal(47, 6),
  ),
  {
    description: 'Collect coins! Each coin adds to your wallet.',
    author: 'System',
    startingLives: 3,
    parTime: 45,
  }
)
