#!/usr/bin/env node
// Pre-flight checks for /justone and /justone-publish.
//
// Without flags:           verifies environment is ready to START a build
// With --check-manifest:   verifies a valid manifest exists (for publish phase)

import { readdir, access, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { execSync } from 'node:child_process'

const args = new Set(process.argv.slice(2))
const checkManifest = args.has('--check-manifest')

let warnings = 0
function ok(msg) {
  console.log(`  ✓ ${msg}`)
}
function warn(msg) {
  console.warn(`  ⚠ ${msg}`)
  warnings++
}
function fail(msg) {
  console.error(`  ✗ ${msg}`)
  process.exit(1)
}

const cwd = process.cwd()
console.log(`▸ cwd: ${cwd}`)
console.log()

if (checkManifest) {
  console.log('▸ checking manifest...')
  const path = resolve(cwd, 'justone', 'manifest.json')
  try {
    await access(path)
  } catch {
    fail(`manifest missing at ${path} — did you run /justone first?`)
  }
  let manifest
  try {
    manifest = JSON.parse(await readFile(path, 'utf8'))
  } catch (e) {
    fail(`manifest is not valid JSON: ${e.message ?? e}`)
  }
  if (!manifest.prompt) fail('manifest.prompt is empty')
  if (!/^sha256:[a-f0-9]{64}$/.test(manifest.promptHash ?? '')) {
    fail('manifest.promptHash is invalid')
  }
  ok(`manifest valid (locked ${manifest.promptLockedAt})`)
} else {
  console.log('▸ checking workspace...')
  const entries = await readdir(cwd)
  const visible = entries.filter((e) => !e.startsWith('.'))
  if (visible.length === 0) {
    ok('folder is empty')
  } else {
    warn(
      `folder is not empty (${visible.length} item${visible.length > 1 ? 's' : ''}: ${visible.slice(0, 5).join(', ')}${visible.length > 5 ? '...' : ''})`,
    )
    warn('/justone will write into this folder. continue only if intentional.')
  }
}

console.log()
console.log('▸ checking tools...')
ok(`node ${process.versions.node}`)

try {
  execSync('git --version', { stdio: 'pipe' })
  ok('git')
} catch {
  fail('git not installed')
}

try {
  execSync('gh --version', { stdio: 'pipe' })
  ok('gh')
} catch {
  fail('gh CLI not installed — see https://cli.github.com')
}

try {
  execSync('gh auth status', { stdio: 'pipe' })
  ok('gh authenticated')
} catch {
  fail('gh not authenticated — run: gh auth login')
}

if (!checkManifest) {
  console.log()
  console.log('▸ checking JustOne credentials (for publish phase)...')
  const credPath = join(
    process.env.HOME ?? process.env.USERPROFILE ?? '',
    '.justone',
    'credentials',
  )
  try {
    const raw = await readFile(credPath, 'utf8')
    const tok = raw.split(/\r?\n/)[0]?.trim() ?? ''
    if (tok.startsWith('jo_pat_')) {
      ok(`credentials present (${tok.slice(0, 14)}...)`)
    } else {
      warn(`${credPath} exists but token format looks wrong — publish will fail`)
    }
  } catch {
    warn(`no token at ${credPath} — visit https://justone-app.vercel.app/submit to issue one`)
    warn('this is OK during /justone; required for /justone-publish')
  }
}

console.log()
if (warnings > 0) {
  console.log(`▸ environment OK with ${warnings} warning(s)`)
} else {
  console.log('▸ environment OK ✓')
}
