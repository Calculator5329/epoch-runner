/**
 * Level 0 Shapes - Collision shape testing
 * 
 * Tests: Half blocks, quarter blocks, slopes, partial collision
 */

import { 
  createLevel, 
  tiles, 
  ground, 
  platform, 
  goal,
  wall,
  halfBlockLeft,
  halfBlockRight,
  halfBlockTop,
  halfBlockBottom,
  quarterBlock,
  slopeUpRight,
  slopeUpLeft,
  rampUpRight,
  rampUpLeft,
} from './helpers'

export const level_0_shapes = createLevel(
  'level_0_shapes',
  'Age 0: Shape Testing',
  50,  // 50 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor
    ground(50, 14),
    
    // ===== Section 1: Half Blocks =====
    // Labels would be nice but we don't have text tiles yet
    
    // Half block left (player can stand on left portion)
    halfBlockLeft(6, 12),
    halfBlockLeft(7, 12),
    
    // Half block right
    halfBlockRight(10, 12),
    halfBlockRight(11, 12),
    
    // Half block top/bottom (like ledges)
    platform(14, 11, 2),
    halfBlockBottom(16, 11),
    halfBlockBottom(17, 11),
    
    // ===== Section 2: Quarter Blocks =====
    
    // Corner pieces
    quarterBlock(20, 12, 'bl'),
    quarterBlock(21, 12, 'br'),
    quarterBlock(20, 11, 'tl'),
    quarterBlock(21, 11, 'tr'),
    
    // Staggered quarter blocks
    quarterBlock(24, 12, 'br'),
    quarterBlock(25, 11, 'bl'),
    quarterBlock(26, 10, 'br'),
    quarterBlock(27, 9, 'bl'),
    
    // ===== Section 3: Slopes =====
    
    // Single slopes
    slopeUpRight(30, 12),
    platform(31, 11, 2),
    slopeUpLeft(33, 11),
    
    // Ramp going up-right (filled underneath)
    rampUpRight(36, 12, 4),
    platform(40, 8, 3),
    
    // Ramp going up-left
    rampUpLeft(47, 12, 3),
    
    // Goal on high platform
    platform(45, 6, 3),
    goal(46, 5),
    
    // Walls to prevent shortcuts
    wall(44, 7, 7),
  ),
  {
    description: 'Testing half blocks, quarter blocks, and slopes',
    author: 'System',
    startingLives: 5,  // More lives for testing
    parTime: 45,
  }
)
