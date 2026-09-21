import { execSync } from 'node:child_process'

try {
  execSync('python3 scripts/generate-favicon.py', { stdio: 'inherit' })
} catch (err) {
  console.error('Failed to generate favicon:', err)
  process.exit(1)
}
