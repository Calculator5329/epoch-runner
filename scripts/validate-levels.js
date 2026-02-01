#!/usr/bin/env node
/**
 * Validate all registered levels
 * 
 * Usage: npm run validate:levels
 */

import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// We need to use tsx or ts-node to run TypeScript
// This script creates a temporary validation runner

const validationCode = `
import { getAllLevels, validateLevel } from './src/levels/index'

console.log('\\n🔍 Validating registered levels...\\n')

const levels = getAllLevels()
let hasErrors = false

for (const level of levels) {
  const errors = validateLevel(level)
  
  if (errors.length > 0) {
    console.log(\`❌ \${level.id} (\${level.name})\`)
    errors.forEach(err => console.log(\`   - \${err}\`))
    hasErrors = true
  } else {
    console.log(\`✅ \${level.id} (\${level.name})\`)
  }
}

console.log('')

if (hasErrors) {
  console.log('⚠️  Some levels have validation errors')
  process.exit(1)
} else {
  console.log(\`✅ All \${levels.length} levels valid\`)
}
`

import fs from 'fs'
const tempFile = path.join(ROOT, '.validate-levels-temp.ts')

try {
  fs.writeFileSync(tempFile, validationCode, 'utf-8')
  
  // Try to run with tsx (preferred) or fallback to ts-node
  try {
    execSync(`npx tsx ${tempFile}`, { stdio: 'inherit', cwd: ROOT })
  } catch {
    // tsx might not be installed, try ts-node
    try {
      execSync(`npx ts-node --esm ${tempFile}`, { stdio: 'inherit', cwd: ROOT })
    } catch {
      console.error('❌ Could not run TypeScript. Install tsx: npm i -D tsx')
      process.exit(1)
    }
  }
} finally {
  // Clean up temp file
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile)
  }
}
