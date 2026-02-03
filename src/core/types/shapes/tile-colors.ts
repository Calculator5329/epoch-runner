/**
 * MVP colors for tile types
 */
export const TILE_COLORS = {
  empty: '#16213e',
  solid: '#4a5568',
  platform: '#9f7aea',
  hazard: '#e53e3e',
  coin: '#f6e05e',
  powerup: '#48bb78',       // Green for triple jump power-up
  speedBoost: '#f6ad55',    // Orange for speed boost
  superJump: '#9f7aea',     // Purple for super jump
  invincibility: '#ffd700', // Gold for invincibility
  goal: '#48bb78',
  checkpoint: '#4299e1',
  // Custom solid colors (for different sprite themes)
  brick: '#8b4513',     // Saddle brown
  stone: '#708090',     // Slate gray
  metal: '#71797E',     // Steel gray
  wood: '#deb887',      // Burlywood tan
  ice: '#b0e0e6',       // Powder blue
  grass: '#228b22',     // Forest green
  sand: '#f4a460',      // Sandy brown
  dirt: '#8b5a2b',      // Sienna brown
  crystal: '#e066ff',   // Medium orchid
  lavaRock: '#4a0404',  // Dark red/maroon
} as const
