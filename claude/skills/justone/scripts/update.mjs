#!/usr/bin/env node
// JustOne plugin self-updater.
//
// Usage:
//   node ~/.claude/skills/justone/scripts/update.mjs            # only update if newer
//   node ~/.claude/skills/justone/scripts/update.mjs --force    # reinstall even if same version
//   node ~/.claude/skills/justone/scripts/update.mjs --dry-run  # show what would happen
//
// What it does:
//   1. Reads the installed VERSION at ~/.claude/skills/justone/VERSION (or wherever the
//      currently-running script is located).
//   2. Fetches the latest VERSION from GitHub master branch.
//   3. If newer (or --force), clones the latest source to a temp directory and runs its
//      install.mjs to overwrite the installed plugin.
//   4. Leaves ~/.justone/credentials (your CLI token) untouched.

import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_URL = 'https://github.com/GodsB1025/justone.git'
const VERSION_URL = 'https://raw.githubusercontent.com/GodsB1025/justone/master/VERSION'

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const dryRun = args.has('--dry-run')

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function log(msg, kind = 'info') {
  const prefix = { info: '▸', ok: '✓', warn: '⚠', err: '✗' }[kind] ?? '·'
  const stream = kind === 'err' ? process.stderr : process.stdout
  stream.write(`${prefix} ${msg}\n`)
}

function fail(msg) { log(msg, 'err'); process.exit(1) }

// Tolerant semver compare: returns >0 if a > b, <0 if a < b, 0 if equal.
function compareSemver(a, b) {
  const pa = a.split('.').map((n) => Number.parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => Number.parseInt(n, 10) || 0)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

// Find the installed VERSION file. The skill dir holds it after install.
function findInstalledVersionPath() {
  // This script is typically at ~/.claude/skills/justone/scripts/update.mjs
  // VERSION sits at  ~/.claude/skills/justone/VERSION
  const candidate = resolve(__dirname, '..', 'VERSION')
  if (existsSync(candidate)) return candidate
  return null
}

async function readLocal() {
  const p = findInstalledVersionPath()
  if (!p) return null
  try {
    return (await readFile(p, 'utf8')).trim()
  } catch {
    return null
  }
}

async function readRemote() {
  try {
    const res = await fetch(VERSION_URL, {
      headers: { 'Cache-Control': 'no-cache' },
    })
    if (!res.ok) return null
    return (await res.text()).trim()
  } catch {
    return null
  }
}

function which(cmd) {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`, {
      stdio: 'pipe',
    })
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('▸ JustOne plugin updater')
  console.log()

  const local = await readLocal()
  const remote = await readRemote()

  log(`installed: ${local ?? '(unknown — older than 0.1.1, or never installed)'}`)
  if (!remote) {
    fail('cannot reach github.com to check the latest version. are you online?')
  }
  log(`latest:    ${remote}`)

  const needs =
    !local ||
    force ||
    compareSemver(remote, local) > 0

  if (!needs) {
    console.log()
    log('already up to date.', 'ok')
    return
  }

  if (local && compareSemver(remote, local) <= 0 && !force) {
    log('no upgrade needed.', 'ok')
    return
  }

  console.log()
  log(
    local
      ? `upgrading: ${local} → ${remote}`
      : `installing: ${remote}`,
  )

  if (dryRun) {
    console.log()
    log('dry run — exiting without changes.', 'warn')
    return
  }

  if (!which('git')) {
    fail('git is required for self-update. install it from https://git-scm.com')
  }

  const tmp = await mkdtemp(join(tmpdir(), 'justone-update-'))
  console.log()
  log(`clone to ${tmp}`)
  try {
    execSync(`git clone --depth 1 ${REPO_URL} "${tmp}"`, {
      stdio: 'inherit',
    })
  } catch {
    await rm(tmp, { recursive: true, force: true })
    fail('clone failed. check your network or proxy.')
  }

  console.log()
  log('running installer from fresh checkout')
  try {
    execSync(`node "${join(tmp, 'install.mjs')}"`, { stdio: 'inherit' })
  } catch {
    await rm(tmp, { recursive: true, force: true })
    fail('install step failed. the existing installation may be partially overwritten — re-run with --force.')
  }

  console.log()
  log('cleaning temp')
  await rm(tmp, { recursive: true, force: true })

  console.log()
  log(`updated to v${remote}.`, 'ok')
  console.log()
  console.log('Your CLI token at ~/.justone/credentials was not touched.')
  console.log('Restart Claude Code to pick up any slash-command changes.')
}

main().catch((e) => {
  log(e?.stack ?? String(e), 'err')
  process.exit(1)
})
