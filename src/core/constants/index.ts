// Grid constants
export const TILE_SIZE = 64

// Viewport dimensions (what player sees - 16x12 tiles = 1024x768 pixels)
export const VIEWPORT_WIDTH = 16 * TILE_SIZE   // 1024
export const VIEWPORT_HEIGHT = 12 * TILE_SIZE  // 768

// Legacy aliases for backward compatibility
export const CANVAS_WIDTH = VIEWPORT_WIDTH
export const CANVAS_HEIGHT = VIEWPORT_HEIGHT

// Camera constants
export const CAMERA_LERP_SPEED = 8      // Higher = snappier follow (1-10 recommended)
export const CAMERA_DEADZONE_X = 80     // Pixels before camera moves horizontally
export const CAMERA_DEADZONE_Y = 60     // Pixels before camera moves vertically

// Physics constants
export const GRAVITY = 1500           // Pixels/sec² downward
export const PLAYER_SPEED = 300       // Pixels/sec horizontal
export const JUMP_VELOCITY = -640     // Initial upward velocity (negative = up)
export const MAX_FALL_SPEED = 800     // Terminal velocity
export const FRICTION = 0.85          // Ground deceleration multiplier

// Player dimensions (smaller than tile for forgiving collision)
export const PLAYER_WIDTH = 48
export const PLAYER_HEIGHT = 56

// Colors (MVP - will be replaced with sprites)
export const COLORS = {
  background: '#16213e',  // Same as empty to prevent seams
  empty: '#16213e',
  solid: '#4a5568',
  platform: '#9f7aea',
  hazard: '#e53e3e',
  coin: '#f6e05e',
  powerup: '#48bb78',  // Green for triple jump power-up
  goal: '#48bb78',
  checkpoint: '#4299e1',
  player: '#4299e1',
  playerOutline: '#2b6cb0',
} as const

// Default lives per level
export const DEFAULT_LIVES = 3

// Power-up durations (seconds)
export const TRIPLE_JUMP_DURATION = 10
