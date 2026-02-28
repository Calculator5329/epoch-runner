/**
 * Level 1: Shapes
 * 
 * Introduces partial collision blocks.
 * Features: Half blocks, quarter blocks, stairs
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
  quarterBlock,
  stairsUpRight,
} from './helpers'

export const level_1_shapes = createLevel(
  'level_1_shapes',
  'Shape Shifter',
  45,  // 45 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // Ground floor
    ground(45, 14),
    
    // ===== Section 1: Half Block Introduction =====
    
    // Step up using half blocks
    halfBlockRight(5, 13),
    platform(6, 13, 2),
    halfBlockLeft(8, 13),
    
    // Elevated half-block path
    halfBlockRight(10, 11),
    halfBlockRight(11, 11),
    platform(12, 11, 3),
    halfBlockLeft(15, 11),
    halfBlockLeft(16, 11),
    
    // ===== Section 2: Quarter Block Stepping Stones =====
    
    // Diagonal quarter block climb
    quarterBlock(18, 12, 'br'),
    quarterBlock(19, 11, 'br'),
    quarterBlock(20, 10, 'br'),
    quarterBlock(21, 9, 'br'),
    platform(22, 9, 2),
    
    // Quarter block descent
    quarterBlock(24, 9, 'bl'),
    quarterBlock(25, 10, 'bl'),
    quarterBlock(26, 11, 'bl'),
    
    // ===== Section 3: Stair Section =====
    
    // Stair climb (5 steps up)
    stairsUpRight(28, 12, 5),
    
    // Flat section at top
    platform(33, 7, 4),
    
    // Stair descent (3 steps down to row 10)
    platform(37, 8, 1),
    platform(38, 9, 1),
    platform(39, 10, 1),
    
    // ===== Section 4: Mixed Finale =====
    
    // Half-block precision jump
    halfBlockTop(40, 10),
    halfBlockTop(41, 8),
    halfBlockTop(42, 6),
    
    // Goal platform
    platform(43, 5, 2),
    goal(43, 4),
    
    // Boundary walls
    wall(0, 0, 14),
    wall(44, 0, 14),
  ),
  {
    description: 'Learn to navigate half blocks, quarter blocks, and stairs!',
    author: 'System',
    startingLives: 3,
    parTime: 40,
  }
)
