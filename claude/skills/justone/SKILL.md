---
name: justone
description: Runtime contract for the Just One Prompt Challenge. Invoked exclusively via the /justone and /justone-publish slash commands. Do NOT auto-trigger from general conversation — only act on this skill when one of those commands has been issued in the current turn.
---

# JustOne — Runtime Contract

The Just One Prompt Challenge: build a real, runnable project from a **single user prompt** to Claude Code. Once the prompt is locked, no follow-ups, no edits to the prompt, no second invocations. Then publish to GitHub + the JustOne gallery.

This skill is **only** invoked by `/justone <prompt>` and `/justone-publish`. If neither command fired in the current turn, ignore this file.

---

## Workflow phases

### Phase 1 — Lock (triggered by `/justone <prompt>`)

The prompt the user typed after `/justone` becomes the single point of truth. Lock it before doing anything else.

1. Run `node ~/.claude/skills/justone/scripts/verify-environment.mjs`.
   - Exits with helpful error if `gh`, `git`, or Node missing, or if `gh auth` not done.
2. Run `node ~/.claude/skills/justone/scripts/create-manifest.mjs -- "<user prompt verbatim>"`.
   - Writes `./justone/manifest.json` with the prompt + `sha256:` hash + ISO timestamp.
   - Refuses to overwrite an existing manifest — JustOne can only lock once per folder.
3. From this point: **never edit `manifest.prompt` or `manifest.promptHash`**.

### Phase 2 — Build (still inside `/justone`)

Implement the project. Hard requirements:

- Project must run. If a tech stack is implied by the prompt, use it; otherwise pick something appropriate (React + Vite for web, Node for CLI, etc.).
- Generate `README.md` with install + start instructions.
- Update non-locked fields in `manifest.json`:
  - `title` — human-readable name
  - `summary` — 1–2 sentence description
  - `projectType` — one of `web` / `cli` / `library` / `api` / `other`
  - `stack` — array of tech names
  - `installCommand` — e.g. `npm install`
  - `startCommand` — e.g. `npm run dev`
  - `localUrl` — for web projects, e.g. `http://localhost:5173`
- Do NOT make follow-up edits based on user comments. The prompt is locked.
- Do NOT modify files outside the current working directory.
- Do NOT commit secrets. Skip `.env`, `.pem`, `.key`, `node_modules/`, etc.

When the build is complete, tell the user: **"Done. Run `/justone-publish` to push to GitHub and register on the gallery."**

### Phase 3 — Publish (triggered by `/justone-publish`)

1. Run `node ~/.claude/skills/justone/scripts/verify-environment.mjs --check-manifest`.
2. Initialize git, create a public GitHub repo, push:

   ```bash
   git init -q
   echo -e "node_modules\\ndist\\n.env*\\n*.log\\n.DS_Store" > .gitignore
   git add .
   git commit -q -m "Create with /justone"
   gh repo create justone-$(date +%s) --public --source=. --push
   ```

   - If a more descriptive repo name fits the project (e.g. `justone-alarm-app`), use that instead of the timestamp suffix. Don't reuse names — gh will reject duplicates.
3. (Optional) Generate `justone/thumbnail.png` — for web projects, try a Playwright screenshot of the running app; otherwise skip for v0.1.
4. Run `node ~/.claude/skills/justone/scripts/upload-submission.mjs`.
   - Reads `~/.justone/credentials` for the CLI token.
   - POSTs `repoUrl + manifest` to the JustOne API.
   - On success: prints the gallery URL. **Report that URL to the user verbatim.**

---

## Manifest schema (full)

```json
{
  "version": "1",
  "title": "Alarm App",
  "prompt": "알람 앱 만들어줘",
  "promptHash": "sha256:abc123...",
  "promptLockedAt": "2026-05-13T12:34:56+09:00",
  "agent": "claude-code",
  "agentVersion": "2.x",
  "model": "claude-sonnet-4-6",
  "permissionMode": "bypassPermissions",
  "projectType": "web",
  "stack": ["React", "Vite", "TypeScript"],
  "installCommand": "npm install",
  "startCommand": "npm run dev",
  "localUrl": "http://localhost:5173",
  "summary": "Browser-notification alarm app with multi-timer support.",
  "thumbnailPath": "justone/thumbnail.png",
  "screenshotPath": null
}
```

| Field | Lock at phase 1? | Notes |
|---|---|---|
| `version` | ✓ | Always `"1"` for now |
| `prompt` | ✓ | Verbatim, no transform |
| `promptHash` | ✓ | `sha256:` + hex of `"justone-v1:" + prompt` |
| `promptLockedAt` | ✓ | ISO with offset |
| `agent` | ✓ | Always `"claude-code"` for v0.1 |
| `permissionMode` | ✓ | Detect / default to `bypassPermissions` |
| Everything else | filled in phase 2 | |

---

## Hard rules (no exceptions in v0.1)

1. **ONE prompt only.** No interactive follow-ups during build. If the user asks a clarifying question after `/justone` ran, refuse and tell them to start a new folder.
2. **Workspace root is the cwd.** Never write outside it.
3. **No `.env`, `.pem`, `.key`, `id_rsa`, etc.** in the commit.
4. **The prompt hash is computed over `"justone-v1:" + prompt`** with SHA-256. No normalization. No trimming inside the hash input (trim happens before hashing in `create-manifest.mjs`).
5. **Don't run `/justone` twice in the same folder.** `create-manifest.mjs` refuses if `justone/manifest.json` already exists.
6. **Don't make assumptions Claude wouldn't be proud of.** If the prompt is "build something cool" — ship something specific. Don't ask the user.
7. **README.md is mandatory.** Install + run sections at minimum.

---

## Failure modes & recovery

| Symptom | Cause | Recovery |
|---|---|---|
| `manifest already exists` | `/justone` already ran in this folder | Start over in a new folder. Or `rm -rf justone/` if you really intend to retry — but that defeats the point. |
| `gh: command not found` | GitHub CLI missing | Install from cli.github.com, then `gh auth login`. |
| `invalid_credentials` from /api/submissions | CLI token missing / wrong / revoked | Visit `https://justone-app.vercel.app/submit` to issue a new one. Save to `~/.justone/credentials`. |
| `repo_not_owned` | Repo owner ≠ your GitHub login | The repo wasn't created under your account. Check `gh auth status`. |
| `manifest_hash_mismatch` | `prompt` field in manifest was edited after lock | Don't do that. Restart in a new folder. |

---

## What this skill does NOT do

- It does not auto-summarize, auto-test, or auto-deploy. Those are out of scope for v0.1.
- It does not chat. Once `/justone <prompt>` fires, build silently until done, then announce completion.
- It does not modify global state outside `./` and `~/.justone/credentials` (read-only).
