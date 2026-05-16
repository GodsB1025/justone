#!/usr/bin/env node
// Cross-platform JustOne installer.
//
// Works the same on Windows (cmd / PowerShell / Git Bash / VS Code terminal),
// macOS, and Linux. The only requirement is Node 18+.
//
// Usage:
//   node install.mjs               # install to default location
//   node install.mjs --target DIR  # install to a custom location
//   node install.mjs --dry-run     # show what would be done without writing
//   node install.mjs --uninstall   # remove previously-installed files
//
// Env overrides:
//   CLAUDE_DIR=/path  Install root (default: ~/.claude)

import {
  access,
  cp,
  mkdir,
  readdir,
  rm,
  stat,
} from 'node:fs/promises'
import { homedir, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const srcDir = join(__dirname, 'claude')

function parseArgs(argv) {
  const out = { target: null, dryRun: false, uninstall: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--target' || a === '-t') {
      out.target = argv[++i]
    } else if (a === '--dry-run' || a === '-n') {
      out.dryRun = true
    } else if (a === '--uninstall') {
      out.uninstall = true
    } else if (a === '--help' || a === '-h') {
      console.log(usage())
      process.exit(0)
    } else {
      console.error(`unknown flag: ${a}`)
      console.error(usage())
      process.exit(2)
    }
  }
  return out
}

function usage() {
  return `usage: node install.mjs [--target DIR] [--dry-run] [--uninstall]

  --target DIR    Install root (default: $CLAUDE_DIR or ~/.claude)
  --dry-run       Show what would change without writing
  --uninstall     Remove previously-installed files

Examples:
  node install.mjs
  node install.mjs --target /custom/path
  node install.mjs --dry-run
  node install.mjs --uninstall`
}

function log(msg, kind = 'info') {
  const prefix = { info: '▸', ok: '✓', warn: '⚠', err: '✗' }[kind] ?? '·'
  const stream = kind === 'err' ? process.stderr : process.stdout
  stream.write(`${prefix} ${msg}\n`)
}

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function installFiles(targetRoot, dryRun) {
  const targetCommands = join(targetRoot, 'commands')
  const targetSkills = join(targetRoot, 'skills')
  const targetSkillJustone = join(targetSkills, 'justone')

  const planned = [
    {
      kind: 'mkdir',
      path: targetCommands,
    },
    {
      kind: 'mkdir',
      path: targetSkills,
    },
    {
      kind: 'copy',
      src: join(srcDir, 'commands', 'justone.md'),
      dst: join(targetCommands, 'justone.md'),
    },
    {
      kind: 'copy',
      src: join(srcDir, 'commands', 'justone-publish.md'),
      dst: join(targetCommands, 'justone-publish.md'),
    },
    {
      kind: 'remove',
      path: targetSkillJustone,
      reason: 'replace stale skill directory',
    },
    {
      kind: 'copy-recursive',
      src: join(srcDir, 'skills', 'justone'),
      dst: targetSkillJustone,
    },
    {
      // Stamp the version into the installed skill dir so update.mjs can
      // compare local vs remote. Source is at the plugin repo root (../VERSION).
      kind: 'copy',
      src: join(srcDir, '..', 'VERSION'),
      dst: join(targetSkillJustone, 'VERSION'),
      optional: true,
    },
  ]

  for (const step of planned) {
    if (step.kind === 'mkdir') {
      const already = await exists(step.path)
      if (already) {
        log(`mkdir (exists) ${step.path}`, 'info')
      } else {
        log(`mkdir          ${step.path}`, 'info')
        if (!dryRun) await mkdir(step.path, { recursive: true })
      }
    } else if (step.kind === 'remove') {
      const there = await exists(step.path)
      if (there) {
        log(`remove         ${step.path}  (${step.reason})`, 'info')
        if (!dryRun) await rm(step.path, { recursive: true, force: true })
      }
    } else if (step.kind === 'copy') {
      const srcExists = await exists(step.src)
      if (!srcExists) {
        if (step.optional) {
          log(`skip   (no ${step.src}) — optional`, 'info')
          continue
        }
        log(`missing source: ${step.src}`, 'err')
        process.exit(1)
      }
      log(`copy   ${step.src}\n         → ${step.dst}`, 'info')
      if (!dryRun) await cp(step.src, step.dst, { force: true })
    } else if (step.kind === 'copy-recursive') {
      const srcExists = await exists(step.src)
      if (!srcExists) {
        log(`missing source: ${step.src}`, 'err')
        process.exit(1)
      }
      log(`copy   ${step.src}\n         → ${step.dst}`, 'info')
      if (!dryRun) await cp(step.src, step.dst, { recursive: true, force: true })
    }
  }
}

async function uninstallFiles(targetRoot, dryRun) {
  const candidates = [
    join(targetRoot, 'commands', 'justone.md'),
    join(targetRoot, 'commands', 'justone-publish.md'),
    join(targetRoot, 'skills', 'justone'),
  ]
  for (const p of candidates) {
    if (await exists(p)) {
      log(`remove ${p}`, 'info')
      if (!dryRun) await rm(p, { recursive: true, force: true })
    } else {
      log(`skip   ${p} (not present)`, 'info')
    }
  }
}

async function main() {
  const args = parseArgs(process.argv)

  if (Number(process.versions.node.split('.')[0]) < 18) {
    log(`node ${process.versions.node} is too old. need >= 18.`, 'err')
    process.exit(1)
  }

  const targetRoot = resolve(
    args.target ?? process.env.CLAUDE_DIR ?? join(homedir(), '.claude'),
  )

  log(`platform:    ${platform()}`, 'info')
  log(`node:        ${process.versions.node}`, 'info')
  log(`target root: ${targetRoot}`, 'info')
  log(`source dir:  ${srcDir}`, 'info')
  if (args.dryRun) log('mode: DRY RUN — no files will be written.', 'warn')
  console.log()

  if (!(await exists(srcDir))) {
    log(`source not found: ${srcDir}`, 'err')
    log('run install.mjs from the packages/commands directory.', 'err')
    process.exit(1)
  }

  if (args.uninstall) {
    await uninstallFiles(targetRoot, args.dryRun)
    console.log()
    log('uninstall complete.', 'ok')
    return
  }

  await installFiles(targetRoot, args.dryRun)

  console.log()
  log('install complete.', 'ok')
  console.log()
  console.log('Try it:')
  console.log('  1. Open Claude Code in a new empty folder.')
  console.log('  2. Type:  /justone <your prompt>')
  console.log('  3. When the build finishes:  /justone-publish')
  console.log()
  console.log('Set a CLI token first by visiting https://justone-app.vercel.app/submit')
  console.log('(or for local dev: http://localhost:3000/submit).')
}

main().catch((e) => {
  log(e?.stack ?? String(e), 'err')
  process.exit(1)
})
