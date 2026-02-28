/**
 * Roadmap Data - Development progress information
 * 
 * Extracted from CanvasRenderer for maintainability.
 * Update this file when roadmap status changes.
 */

export type PhaseStatus = 'complete' | 'in_progress' | 'pending'

export interface RoadmapPhase {
  name: string
  status: PhaseStatus
  progress: number
  items: string[]
  description: string
  completed: string[]
  upcoming: string[]
}

export interface Milestone {
  name: string
  done: boolean
}

/**
 * Development roadmap phases with detailed progress
 */
export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    name: 'MVP: Core Gameplay',
    status: 'complete',
    progress: 1.0,
    items: ['Physics Engine', 'Collision System', 'Player Controls', 'Level Loading', 'Win/Lose States'],
    description: 'The foundational game engine that powers all gameplay. Includes gravity, movement, and basic level mechanics.',
    completed: [
      'Grid-based physics with 64px tiles',
      'AABB collision detection with shapes',
      'Keyboard input (WASD/Arrows)',
      'JSON level loading system',
      'Goal detection and level complete state',
      'Game over and restart flow',
    ],
    upcoming: [],
  },
  {
    name: 'Gameplay Systems',
    status: 'complete',
    progress: 1.0,
    items: ['Hazards & Lives', 'Checkpoints', 'Coin Economy', 'Power-ups', 'One-Way Platforms'],
    description: 'Core gameplay mechanics that make the game fun and challenging.',
    completed: [
      'Spike hazards (4 directions)',
      'Lives system with respawning',
      'Mid-level checkpoints',
      'Coin collection with wallet',
      'Double-jump power-up (10s duration)',
      'One-way platforms (pass through from below)',
      'Replay coin multiplier system',
    ],
    upcoming: [],
  },
  {
    name: 'Campaign & Progression',
    status: 'in_progress',
    progress: 0.7,
    items: ['Campaign Flow', 'Level Progression', 'Session Stats', 'Overworld UI', 'Cloud Saves'],
    description: 'The meta-game structure that ties levels together into a cohesive experience.',
    completed: [
      'Intro screen with game info',
      'Level complete screen with stats',
      'Campaign complete with breakdown',
      'Ordered level progression (6 levels)',
      'Session statistics tracking',
      'Admin mode for development',
    ],
    upcoming: [
      'Visual overworld/level select UI',
      'Level unlock system',
      'Persistent progress (localStorage)',
      'Cloud saves with Firebase',
    ],
  },
  {
    name: 'Level Builder',
    status: 'pending',
    progress: 0.15,
    items: ['JSON Schema', 'Visual Editor UI', 'Tile Palette', 'Entity Placement', 'Firebase Storage'],
    description: 'A visual editor for creating and sharing custom levels.',
    completed: [
      'JSON export/import (Ctrl+S/O)',
      'Code-based level helpers',
    ],
    upcoming: [
      'Full JSON schema definition',
      'React-based visual editor',
      'Click-to-paint tile placement',
      'Entity palette (enemies, items)',
      'Layer management (collision, decor)',
      'Firebase level storage & sharing',
    ],
  },
  {
    name: 'Asset Pipeline',
    status: 'pending',
    progress: 0.0,
    items: ['Spritesheet System', 'Theme Swapping', 'Animation System', 'Audio Integration'],
    description: 'Visual and audio polish to bring the game to life.',
    completed: [],
    upcoming: [
      'Spritesheet loading & rendering',
      'Theme system (swap visual styles)',
      'Player animation states',
      'Enemy animations',
      'Sound effects integration',
      'Background music system',
    ],
  },
]

/**
 * Development milestones
 */
export const MILESTONES: Milestone[] = [
  { name: 'M1: First Frame', done: true },
  { name: 'M2: Movement', done: true },
  { name: 'M3: Level Load', done: true },
  { name: 'M4: Builder Alpha', done: false },
  { name: 'M5: Firebase Live', done: false },
  { name: 'M6: Campaign Flow', done: true },
]

/**
 * Overall progress percentage (for intro screen)
 */
export const OVERALL_PROGRESS = 0.45

/**
 * Current version string
 */
export const VERSION = 'v0.1.0'
