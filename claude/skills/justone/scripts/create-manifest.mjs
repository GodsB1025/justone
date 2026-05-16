#!/usr/bin/env node
// Lock the JustOne prompt by writing ./justone/manifest.json with a sha256 hash.
// Usage: node create-manifest.mjs -- "<the user prompt verbatim>"
//
// Exits non-zero if manifest already exists or prompt is invalid.

import { createHash } from 'node:crypto'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

const HASH_NAMESPACE = 'justone-v1:'
const MANIFEST_VERSION = '1'
const MAX_PROMPT_LEN = 4000

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

const dashIdx = process.argv.indexOf('--')
if (dashIdx < 0) {
  fail('missing "--" separator. usage: node create-manifest.mjs -- "your prompt"')
}
const rest = process.argv.slice(dashIdx + 1).join(' ').trim()
if (!rest) fail('prompt is empty')
if (rest.length > MAX_PROMPT_LEN) {
  fail(`prompt exceeds ${MAX_PROMPT_LEN} chars (${rest.length})`)
}

const cwd = process.cwd()
const manifestDir = resolve(cwd, 'justone')
const manifestPath = resolve(manifestDir, 'manifest.json')

try {
  await access(manifestPath)
  fail(
    `manifest already exists at ${manifestPath}.\n  /justone can only lock once per folder. start in a new folder.`,
  )
} catch {
  // doesn't exist — good
}

const promptHash =
  'sha256:' +
  createHash('sha256').update(HASH_NAMESPACE + rest, 'utf8').digest('hex')

const now = new Date().toISOString()

const manifest = {
  version: MANIFEST_VERSION,
  title: '',
  prompt: rest,
  promptHash,
  promptLockedAt: now,
  agent: 'claude-code',
  agentVersion: process.env.CLAUDE_CODE_VERSION ?? '',
  model: process.env.CLAUDE_CODE_MODEL ?? '',
  permissionMode: process.env.CLAUDE_PERMISSION_MODE ?? 'bypassPermissions',
  projectType: 'other',
  stack: [],
  installCommand: '',
  startCommand: '',
  localUrl: '',
  summary: '',
  thumbnailPath: null,
  screenshotPath: null,
}

await mkdir(manifestDir, { recursive: true })
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

console.log('✓ manifest locked')
console.log(`  path:   ${manifestPath}`)
console.log(`  prompt: ${rest.slice(0, 80)}${rest.length > 80 ? '…' : ''}`)
console.log(`  hash:   ${promptHash}`)
console.log(`  at:     ${now}`)
console.log()
console.log('Next: implement the project. After done, run /justone-publish.')
console.log('Do NOT edit "prompt" or "promptHash" fields in manifest.json.')
