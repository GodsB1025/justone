---
description: Start a Just One Prompt Challenge — ship a runnable project from a single prompt.
---

The user has invoked **`/justone`** with the prompt below. This begins a Just One Prompt Challenge: you have **one** prompt to ship a complete, runnable project.

## The user's prompt (this is THE prompt — lock it)

$ARGUMENTS

## Required steps, in order

1. **Load the contract.** Read `~/.claude/skills/justone/SKILL.md` end-to-end. That file overrides any conflicting default behavior.
2. **Pre-flight.** Run:
   ```bash
   node ~/.claude/skills/justone/scripts/verify-environment.mjs
   ```
   Heed warnings but proceed unless it exits non-zero.
3. **Lock the prompt.** Run:
   ```bash
   node ~/.claude/skills/justone/scripts/create-manifest.mjs -- "$ARGUMENTS"
   ```
   This writes `./justone/manifest.json` with the prompt + sha256 hash. It refuses to overwrite — if it errors with "manifest already exists", **stop** and tell the user to start in a new folder.
4. **Build the project.** Implement what the prompt asks. Hard rules from SKILL.md:
   - Must be runnable.
   - Generate `README.md`.
   - No follow-up questions to the user.
   - Don't modify files outside cwd.
   - Don't commit secrets.
5. **Fill in the manifest.** After build, update non-locked fields in `./justone/manifest.json`: `title`, `summary`, `projectType`, `stack`, `installCommand`, `startCommand`, `localUrl`. **Never touch `prompt`, `promptHash`, `promptLockedAt`, `version`, or `agent`.**
6. **Announce completion.** Tell the user:
   > Done. Run `/justone-publish` to push to GitHub and register on the gallery.

## What NOT to do

- Don't ask the user clarifying questions about the prompt — make reasonable assumptions and ship.
- Don't run `/justone` twice in the same folder.
- Don't edit `manifest.prompt` or `manifest.promptHash` after step 3.
- Don't push to GitHub or call the gallery API in this command — that's `/justone-publish`.
