/**
 * Level 3: Coins
 * 
 * Introduces currency collection and one-way platforms.
 * Features: Coins, coin paths, one-way platforms, vertical exploration
 */

import { 
  createLevel, 
  tiles, 
  ground, 
  platform, 
  goal,
  wall,
  coin,
  coinRow,
  coinArc,
  oneWayPlatform,
  checkpoint,
} from './helpers'

export const level_3_coins = createLevel(
  'level_3_coins',
  'Treasure Hunt',
  55,  // 55 tiles wide
  18,  // 18 tiles tall (taller for vertical sections)
  { col: 2, row: 16 },  // Player spawn
  tiles(
    // Ground floor
    ground(55, 17),
    
    // ===== Section 1: Ground Coins =====
    
    // Easy coins to start
    coinRow(5, 16, 5),
    
    // ===== Section 2: Platform Coins =====
    // (Platform heights tuned for max jump ~136px / ~2 tiles)
    
    // Coins on platforms
    platform(12, 15, 4),
    coinRow(12, 14, 4),
    
    platform(18, 14, 4),
    platform(18, 12, 4),
    coinRow(18, 11, 4),
    
    // ===== Section 3: Coin Arc =====
    
    // Jump arc with coins
    coinArc(24, 12, 6, 3),
    
    // Checkpoint
    checkpoint(31, 16),
    
    // ===== Section 4: One-Way Platform Tower =====
    // (Each step ~1–2 tiles so single jump can reach)
    
    oneWayPlatform(33, 15, 4),
    coin(35, 14),
    
    oneWayPlatform(35, 13, 4),
    coin(37, 12),
    
    oneWayPlatform(33, 11, 4),
    coin(35, 10),
    
    oneWayPlatform(35, 9, 4),
    coin(37, 8),
    
    // Can drop back down through platforms
    
    // ===== Section 5: Coin Gauntlet =====
    
    // Second checkpoint
    checkpoint(41, 16),
    
    // Dense coin collection
    coinRow(43, 16, 4),
    
    platform(43, 15, 3),
    coinRow(43, 14, 3),
    
    oneWayPlatform(47, 13, 3),
    coinRow(47, 12, 3),
    
    platform(43, 11, 3),
    coinRow(43, 10, 3),
    
    // Final climb to goal
    oneWayPlatform(48, 9, 3),
    coinRow(48, 8, 3),
    
    platform(50, 7, 3),
    coin(51, 6),
    coin(52, 6),
    
    // Goal
    goal(52, 6),
    
    // Boundaries
    wall(0, 0, 17),
    wall(54, 0, 17),
  ),
  {
    description: 'Collect as many coins as you can! One-way platforms let you jump through from below.',
    author: 'System',
    startingLives: 3,
    parTime: 60,
  }
)
