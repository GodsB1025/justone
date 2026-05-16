#!/usr/bin/env node
// Submit a completed JustOne build to the gallery API.
//
// Reads:
//   - ./justone/manifest.json (cwd)
//   - ~/.justone/credentials   (CLI token)
//   - git remote origin        (repo URL)
//
// Posts to: ${JUSTONE_API_BASE}/api/submissions
// Default JUSTONE_API_BASE: https://justone-app.vercel.app

import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { execSync } from 'node:child_process'

const API_BASE = (process.env.JUSTONE_API_BASE ?? 'https://justone-app.vercel.app').replace(/\/$/, '')
const TOKEN_PATH = join(
  process.env.HOME ?? process.env.USERPROFILE ?? '',
  '.justone',
  'credentials',
)

function fail(msg, code = 1) {
  console.error(`✗ ${msg}`)
  process.exit(code)
}

async function readToken() {
  let raw
  try {
    raw = await readFile(TOKEN_PATH, 'utf8')
  } catch (e) {
    fail(
      `cannot read CLI token at ${TOKEN_PATH}\n  reason: ${e.code ?? e.message}\n  visit ${API_BASE}/submit to issue one.`,
    )
  }
  const tok = raw.split(/\r?\n/)[0]?.trim() ?? ''
  if (!tok.startsWith('jo_pat_')) {
    fail(`token at ${TOKEN_PATH} has invalid format (must start with jo_pat_)`)
  }
  return tok
}

async function readManifest() {
  const path = resolve(process.cwd(), 'justone', 'manifest.json')
  let raw
  try {
    raw = await readFile(path, 'utf8')
  } catch {
    fail(`manifest not found at ${path} — did you run /justone first?`)
  }
  let manifest
  try {
    manifest = JSON.parse(raw)
  } catch (e) {
    fail(`manifest is invalid JSON: ${e.message ?? e}`)
  }
  if (!manifest.prompt || !manifest.promptHash) {
    fail('manifest missing prompt or promptHash — was it edited?')
  }
  return manifest
}

function detectRepoUrl() {
  let remote
  try {
    remote = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim()
  } catch {
    fail(
      'no git remote configured.\n  expected: gh repo create has run and pushed.\n  did /justone-publish skip the git steps?',
    )
  }
  const m = remote.match(/(?:git@github\.com:|https:\/\/github\.com\/)([^/]+)\/(.+?)(?:\.git)?$/)
  if (!m) {
    fail(`remote.origin.url is not a GitHub URL: ${remote}`)
  }
  return `https://github.com/${m[1]}/${m[2]}`
}

const token = await readToken()
const manifest = await readManifest()
const repoUrl = detectRepoUrl()

console.log(`▸ POST ${API_BASE}/api/submissions`)
console.log(`  repo:  ${repoUrl}`)
console.log(`  token: ${token.slice(0, 14)}...`)

const res = await fetch(`${API_BASE}/api/submissions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ repoUrl, manifest }),
})

let body = {}
try {
  body = await res.json()
} catch {
  // empty body — fine
}

if (!res.ok) {
  console.error(`✗ submission failed (${res.status}): ${body.error ?? 'unknown_error'}`)
  if (body.details) {
    console.error('  details:', JSON.stringify(body.details, null, 2))
  }
  process.exit(1)
}

console.log()
console.log('✓ published.')
console.log(`  id:      ${body.id}`)
console.log(`  slug:    ${body.slug}`)
console.log(`  gallery: ${body.url}`)
