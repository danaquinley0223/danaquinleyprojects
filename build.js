// Build script for the personal site.
//
// Cloudflare Pages runs `npm run build`, which calls this file.
// It:
//   1. Wipes dist/
//   2. Copies the homepage and the static cancun-2026 hub in as-is
//   3. Installs deps and builds the cocktail-bar React app with the
//      /cocktail-bar/ base path, then copies its dist into ./dist/cocktail-bar/
//
// Result: dist/ has the entire site ready to serve.

import { spawnSync } from 'node:child_process'
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const DIST = join(ROOT, 'dist')

function run(cmd, opts = {}) {
  console.log(`\n→ ${cmd}`)
  const [prog, ...args] = cmd.split(/\s+/)
  const result = spawnSync(prog, args, { stdio: 'inherit', ...opts })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('Cleaning dist/')
rmSync(DIST, { recursive: true, force: true })
mkdirSync(DIST, { recursive: true })

console.log('Copying homepage')
cpSync(join(ROOT, 'index.html'), join(DIST, 'index.html'))

console.log('Copying cancun-2026/')
cpSync(join(ROOT, 'cancun-2026'), join(DIST, 'cancun-2026'), { recursive: true })

console.log('Building cocktail-bar')
const cocktailDir = join(ROOT, 'cocktail-bar')
if (!existsSync(join(cocktailDir, 'node_modules'))) {
  run('npm install', { cwd: cocktailDir })
}
run('npm run build', {
  cwd: cocktailDir,
  env: { ...process.env, BASE_PATH: '/cocktail-bar/' },
})
cpSync(join(cocktailDir, 'dist'), join(DIST, 'cocktail-bar'), { recursive: true })

console.log('Building nightstand')
const nightstandDir = join(ROOT, 'nightstand')
if (!existsSync(join(nightstandDir, 'node_modules'))) {
  run('npm install', { cwd: nightstandDir })
}
run('npm run build', {
  cwd: nightstandDir,
  env: { ...process.env, BASE_PATH: '/nightstand/' },
})
cpSync(join(nightstandDir, 'dist'), join(DIST, 'nightstand'), { recursive: true })

console.log('Copying Cloudflare Pages config files')
const publicDir = join(ROOT, 'public')
if (existsSync(publicDir)) {
  cpSync(publicDir, DIST, { recursive: true })
}

console.log('\n✓ Build complete — dist/ is ready to deploy.')
