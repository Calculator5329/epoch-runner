/**
 * Level Visualizer
 * 
 * Outputs an ASCII grid representation of a level that can be
 * easily read to verify layout and spot impossible sections.
 * 
 * Usage: npx tsx scripts/visualize-level.js <level-id>
 * Example: npx tsx scripts/visualize-level.js level_4_powerup
 */

import { levelRegistry } from '../src/levels/index.ts'
import { TileTypeId } from '../src/core/types/shapes.ts'

// ASCII symbols for each tile type
const TILE_SYMBOLS = {
  [TileTypeId.EMPTY]: '.',
  
  // Solid blocks
  [TileTypeId.SOLID_FULL]: '#',
  [TileTypeId.SOLID_HALF_LEFT]: 'L',
  [TileTypeId.SOLID_HALF_RIGHT]: 'R',
  [TileTypeId.SOLID_HALF_TOP]: 'T',
  [TileTypeId.SOLID_HALF_BOTTOM]: 'B',
  [TileTypeId.SOLID_QUARTER_TL]: '1',
  [TileTypeId.SOLID_QUARTER_TR]: '2',
  [TileTypeId.SOLID_QUARTER_BL]: '3',
  [TileTypeId.SOLID_QUARTER_BR]: '4',
  [TileTypeId.SOLID_SLOPE_UP_RIGHT]: '/',
  [TileTypeId.SOLID_SLOPE_UP_LEFT]: '\\',
  [TileTypeId.SOLID_SLOPE_DOWN_RIGHT]: '\\',
  [TileTypeId.SOLID_SLOPE_DOWN_LEFT]: '/',
  
  // Triggers
  [TileTypeId.GOAL]: 'G',
  [TileTypeId.CHECKPOINT]: 'C',
  
  // Hazards
  [TileTypeId.HAZARD_FULL]: 'X',
  [TileTypeId.HAZARD_SPIKE_UP]: '^',
  [TileTypeId.HAZARD_SPIKE_DOWN]: 'v',
  [TileTypeId.HAZARD_SPIKE_LEFT]: '<',
  [TileTypeId.HAZARD_SPIKE_RIGHT]: '>',
  
  // Pickups
  [TileTypeId.COIN]: 'o',
  [TileTypeId.POWERUP_DOUBLE_JUMP]: '*',
  
  // Platforms (one-way)
  [TileTypeId.PLATFORM_FULL]: '=',
  [TileTypeId.PLATFORM_HALF_LEFT]: '[',
  [TileTypeId.PLATFORM_HALF_RIGHT]: ']',
}

function getSymbol(tileId) {
  return TILE_SYMBOLS[tileId] || '?'
}

function visualizeLevel(levelId) {
  const level = levelRegistry[levelId]
  
  if (!level) {
    console.error(`Level not found: ${levelId}`)
    console.log('\nAvailable levels:')
    Object.keys(levelRegistry).forEach(id => console.log(`  - ${id}`))
    process.exit(1)
  }
  
  const { width, height, collision, playerSpawn, name } = level
  
  // collision is already a 2D grid
  const grid = collision
  
  // Header
  console.log('═'.repeat(width + 20))
  console.log(`LEVEL: ${name}`)
  console.log(`ID: ${levelId}`)
  console.log(`SIZE: ${width}x${height} tiles`)
  console.log(`SPAWN: col ${playerSpawn.col}, row ${playerSpawn.row}`)
  console.log('═'.repeat(width + 20))
  console.log()
  
  // Column numbers (tens)
  let tensRow = '     '
  for (let col = 0; col < width; col++) {
    tensRow += col >= 10 ? Math.floor(col / 10).toString() : ' '
  }
  console.log(tensRow)
  
  // Column numbers (ones)
  let onesRow = '     '
  for (let col = 0; col < width; col++) {
    onesRow += (col % 10).toString()
  }
  console.log(onesRow)
  console.log('     ' + '─'.repeat(width))
  
  // Grid rows
  for (let row = 0; row < height; row++) {
    let line = String(row).padStart(3, ' ') + ' |'
    
    for (let col = 0; col < width; col++) {
      // Mark player spawn with 'P'
      if (col === playerSpawn.col && row === playerSpawn.row) {
        line += 'P'
      } else {
        line += getSymbol(grid[row][col])
      }
    }
    
    line += '|'
    console.log(line)
  }
  
  console.log('     ' + '─'.repeat(width))
  console.log()
  
  // Legend
  console.log('LEGEND:')
  console.log('  .  Empty          #  Solid           =  One-way Platform')
  console.log('  P  Player Spawn   G  Goal            C  Checkpoint')
  console.log('  o  Coin           *  Double Jump     X  Hazard')
  console.log('  ^  Spike Up       v  Spike Down      <  Spike Left       >  Spike Right')
  console.log('  L  Half Left      R  Half Right      T  Half Top         B  Half Bottom')
  console.log('  1  Quarter TL     2  Quarter TR      3  Quarter BL       4  Quarter BR')
  console.log('  /  Slope          \\  Slope')
  console.log()
  
  // Analysis
  console.log('═'.repeat(width + 20))
  console.log('ANALYSIS:')
  console.log('═'.repeat(width + 20))
  
  // Count tiles
  const counts = {}
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const type = grid[row][col]
      counts[type] = (counts[type] || 0) + 1
    }
  }
  
  console.log(`Solid tiles: ${counts[TileTypeId.SOLID_FULL] || 0}`)
  console.log(`Coins: ${counts[TileTypeId.COIN] || 0}`)
  console.log(`Checkpoints: ${counts[TileTypeId.CHECKPOINT] || 0}`)
  console.log(`Power-ups: ${counts[TileTypeId.POWERUP_DOUBLE_JUMP] || 0}`)
  console.log(`Hazard tiles: ${
    (counts[TileTypeId.HAZARD_FULL] || 0) +
    (counts[TileTypeId.HAZARD_SPIKE_UP] || 0) +
    (counts[TileTypeId.HAZARD_SPIKE_DOWN] || 0) +
    (counts[TileTypeId.HAZARD_SPIKE_LEFT] || 0) +
    (counts[TileTypeId.HAZARD_SPIKE_RIGHT] || 0)
  }`)
  console.log(`One-way platforms: ${counts[TileTypeId.PLATFORM_FULL] || 0}`)
  
  // Check for vertical gaps that need double jump
  console.log()
  console.log('VERTICAL GAP ANALYSIS (max jump ~2 tiles, double jump ~4 tiles):')
  
  // Find platforms and analyze gaps
  const platformRows = new Set()
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const type = grid[row][col]
      // Check if it's a landable surface
      if (type === TileTypeId.SOLID_FULL || 
          type === TileTypeId.PLATFORM_FULL ||
          type === TileTypeId.SOLID_HALF_TOP ||
          type === TileTypeId.SOLID_HALF_LEFT ||
          type === TileTypeId.SOLID_HALF_RIGHT) {
        platformRows.add(row)
      }
    }
  }
  
  const sortedRows = [...platformRows].sort((a, b) => b - a) // bottom to top
  for (let i = 0; i < sortedRows.length - 1; i++) {
    const gap = sortedRows[i] - sortedRows[i + 1]
    if (gap > 4) {
      console.log(`  ⚠️  WARNING: ${gap}-tile gap between rows ${sortedRows[i]} and ${sortedRows[i + 1]} (may be impossible!)`)
    } else if (gap > 2) {
      console.log(`  ℹ️  ${gap}-tile gap between rows ${sortedRows[i]} and ${sortedRows[i + 1]} (needs double jump)`)
    }
  }
  
  console.log()
}

// Main
const levelId = process.argv[2]

if (!levelId) {
  console.log('Level Visualizer - ASCII grid output for level debugging')
  console.log()
  console.log('Usage: npx tsx scripts/visualize-level.js <level-id>')
  console.log()
  console.log('Available levels:')
  Object.entries(levelRegistry).forEach(([id, level]) => {
    console.log(`  - ${id.padEnd(20)} "${level.name}"`)
  })
  process.exit(0)
}

visualizeLevel(levelId)
