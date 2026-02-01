/**
 * Level 0 Hazards - Spike and hazard testing
 * 
 * Tests: Spikes (all directions), hazard blocks, death/respawn, lives
 */

import { 
  createLevel, 
  tiles, 
  ground, 
  platform, 
  goal,
  wall,
  hazard,
  spikesUp,
  spikesDown,
  spikesLeft,
  spikesRight,
  checkpoint,
} from './helpers'

export const level_0_hazards = createLevel(
  'level_0_hazards',
  'Age 0: Hazard Gauntlet',
  45,  // 45 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor with gaps for spike pits
    platform(0, 14, 8),
    platform(11, 14, 6),
    platform(20, 14, 8),
    platform(31, 14, 14),
    
    // ===== Section 1: Spike Pits =====
    
    // First spike pit (narrow)
    spikesUp(8, 14, 3),
    
    // Second spike pit (wider, requires good jump)
    spikesUp(17, 14, 3),
    
    // ===== Section 2: Spike Walls =====
    
    // First checkpoint before hard section
    checkpoint(22, 13),
    
    // Narrow corridor with wall spikes
    wall(24, 10, 4),
    wall(28, 10, 4),
    spikesRight(24, 11, 2),  // Spikes on left wall
    spikesLeft(28, 11, 2),   // Spikes on right wall
    
    // ===== Section 3: Ceiling Spikes =====
    
    // Low ceiling with spikes
    platform(31, 10, 6),
    spikesDown(32, 10, 4),
    
    // ===== Section 4: Hazard Block Maze =====
    
    // Second checkpoint
    checkpoint(38, 13),
    
    // Hazard blocks to navigate around
    hazard(40, 13),
    hazard(41, 12),
    hazard(40, 11),
    hazard(42, 13),
    hazard(42, 11),
    
    // Platforms to help navigate
    platform(39, 10, 2),
    platform(42, 9, 2),
    
    // Goal
    goal(43, 8),
    
    // Top boundary
    platform(0, 8, 45),
  ),
  {
    description: 'Navigate spike pits, wall spikes, and hazard blocks',
    author: 'System',
    startingLives: 5,
    parTime: 60,
  }
)
