#!/usr/bin/env node
/**
 * Generate a new level file with boilerplate
 * 
 * Usage: npm run new:level <level-name>
 * Example: npm run new:level tutorial_01
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEVELS_DIR = path.join(__dirname, '..', 'src', 'levels')

// Get level name from args
const levelName = process.argv[2]

if (!levelName) {
  console.error('❌ Usage: npm run new:level <level-name>')
  console.error('   Example: npm run new:level tutorial_01')
  process.exit(1)
}

// Validate name (lowercase, underscores, numbers)
if (!/^[a-z][a-z0-9_]*$/.test(levelName)) {
  console.error('❌ Level name must be lowercase with underscores (e.g., tutorial_01)')
  process.exit(1)
}

const filename = `${levelName}.ts`
const filepath = path.join(LEVELS_DIR, filename)

// Check if file exists
if (fs.existsSync(filepath)) {
  console.error(`❌ Level file already exists: ${filename}`)
  process.exit(1)
}

// Generate display name from snake_case
const displayName = levelName
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ')

// Template
const template = `import { createLevel, tiles, platform, wall, goal, ground, border } from './helpers'
import type { LevelDefinition } from './types'

/**
 * ${displayName}
 * 
 * TODO: Describe this level's design and challenge
 */
export const ${levelName}: LevelDefinition = createLevel(
  '${levelName}',
  '${displayName}',
  30, 15,                    // width, height (tiles)
  { col: 2, row: 13 },       // playerSpawn
  tiles(
    // Ground floor
    ground(30, 14),
    
    // Walls
    wall(0, 0, 15),          // left
    wall(29, 0, 15),         // right
    
    // Platforms
    // platform(10, 10, 5),
    
    // Goal
    goal(27, 13),
  ),
  {
    author: 'Developer',
    description: 'TODO: Add description',
    // parTime: 30,
  }
)
`

// Write file
fs.writeFileSync(filepath, template, 'utf-8')
console.log(`✅ Created: src/levels/${filename}`)
console.log('')
console.log('Next steps:')
console.log(`  1. Edit src/levels/${filename} to design your level`)
console.log(`  2. Register it in src/levels/index.ts:`)
console.log(`     import { ${levelName} } from './${levelName}'`)
console.log(`     levelRegistry.register(${levelName})`)
