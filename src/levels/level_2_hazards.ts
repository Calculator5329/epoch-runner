/**
 * Level 2: Hazards
 * 
 * Introduces spike pits and checkpoints.
 * Features: Spike pits, elevated platforms, checkpoints
 */

import { 
  createLevel, 
  tiles, 
  platform, 
  goal,
  wall,
  spikesUp,
  checkpoint,
} from './helpers'

export const level_2_hazards = createLevel(
  'level_2_hazards',
  'Danger Zone',
  50,  // 50 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor with gaps
    platform(0, 14, 10),
    platform(13, 14, 12),
    platform(28, 14, 22),
    
    // ===== Section 1: Spike Pits =====
    
    // First spike pit - easy jump
    spikesUp(10, 14, 3),
    
    // Second spike pit - longer
    spikesUp(25, 14, 3),
    
    // ===== Section 2: Spike Jumps =====
    
    // First checkpoint
    checkpoint(30, 13),
    
    // Simple spike jumps - platforms with spike pits between them
    platform(32, 12, 3),   // First platform
    spikesUp(35, 14, 2),   // Spike pit
    platform(37, 11, 3),   // Second platform (slightly higher)
    spikesUp(40, 14, 2),   // Spike pit
    platform(42, 12, 3),   // Third platform
    
    // ===== Goal =====
    
    // Second checkpoint before goal
    checkpoint(45, 13),
    
    // Goal at the end
    goal(48, 13),
    
    // Boundaries
    wall(0, 0, 14),
    // Removed ceiling - was blocking the view
  ),
  {
    description: 'Watch out for spikes! Checkpoints save your progress.',
    author: 'System',
    startingLives: 5,
    parTime: 50,
  }
)
