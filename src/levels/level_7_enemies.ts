/**
 * Level 7: Enemies
 * 
 * Introduces patrol enemies - the first moving hazards!
 * Features: Patrol enemies, stomp mechanic, safe zones
 */

import { 
  createLevel, 
  tiles, 
  platform, 
  goal,
  wall,
  checkpoint,
  patrolEnemy,
  entities,
} from './helpers'

export const level_7_enemies = createLevel(
  'level_7_enemies',
  'Enemy Territory',
  60,  // 60 tiles wide
  15,  // 15 tiles tall
  { col: 2, row: 13 },  // Player spawn
  tiles(
    // ===== Section 1: Meet Your First Enemy =====
    // Long platform with single enemy - safe learning environment
    platform(0, 14, 20),
    
    // First enemy patrols a clear area (player can easily avoid or stomp)
    // Gap before next section
    
    // ===== Section 2: Multiple Enemies =====
    // Platform with two enemies patrolling in opposite directions
    platform(22, 14, 15),
    
    // First checkpoint - safe zone
    checkpoint(38, 13),
    
    // ===== Section 3: Elevated Enemies =====
    // Enemies on different height platforms
    platform(40, 14, 8),      // Ground level
    platform(42, 11, 5),      // Elevated platform (3 tiles clearance)
    platform(50, 14, 10),     // Continue ground
    
    // ===== Section 4: Final Challenge =====
    // Multiple platforms with enemies
    checkpoint(52, 13),
    
    // Goal area
    goal(58, 13),
    
    // Left wall
    wall(0, 0, 14),
  ),
  {
    description: 'New danger! Jump on enemies to defeat them, or get hurt if you touch their sides.',
    author: 'System',
    startingLives: 5,
    parTime: 45,
    entities: entities(
      // Section 1: Single easy enemy
      patrolEnemy(8, 13, 'right'),
      
      // Section 2: Two enemies, opposite directions
      patrolEnemy(24, 13, 'right'),
      patrolEnemy(32, 13, 'left'),
      
      // Section 3: Elevated enemy
      patrolEnemy(43, 10, 'right'),  // On elevated platform
      patrolEnemy(52, 13, 'left'),   // Ground patrol
      
      // Section 4: Final guards
      patrolEnemy(55, 13, 'right'),
    ),
  }
)
