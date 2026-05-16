---
description: Publish a completed JustOne build — create a public GitHub repo, push, and register on the gallery.
---

The user has invoked **`/justone-publish`**. This pushes their just-built project to GitHub and registers it on the JustOne gallery.

## Required steps, in order

1. **Load the contract.** Read `~/.claude/skills/justone/SKILL.md` if you haven't already this session.
2. **Pre-flight + manifest check.** Run:
   ```bash
   node ~/.claude/skills/justone/scripts/verify-environment.mjs --check-manifest
   ```
   Stop on any failure and report the cause to the user (e.g. missing manifest, missing gh auth, missing token).
3. **Write a sane `.gitignore`** if one doesn't exist. Cover: `node_modules`, `dist`, `.next`, `.vercel`, `.env`, `.env.*`, `*.log`, `.DS_Store`, `Thumbs.db`, secrets like `*.pem`, `*.key`, `id_rsa*`.
4. **Initialize git + create the public repo + push.** Pick a slug-friendly repo name based on `manifest.title` (e.g. `justone-alarm-app`). If that name already exists on the user's GitHub, append a short random suffix.
   ```bash
   git init -q
   git add .
   git commit -q -m "Create with /justone"
   gh repo create <repo-name> --public --source=. --push
   ```
   If `gh repo create` fails for name collision, retry with a `-xxxx` suffix.
5. **(Optional) Generate `justone/thumbnail.png`.** For v0.1 this is best-effort — if the project is web and trivial to start, you may run `npm install && npm run dev` briefly and use Playwright to screenshot `localhost:<port>`. Otherwise skip and the gallery will use a manifest-based card. Don't block publish on this.
6. **Update the manifest if a thumbnail was generated.** Set `thumbnailPath` or `screenshotPath` accordingly, then `git add` + `git commit -m "Add thumbnail"` + `git push`.
7. **Upload to the gallery.** Run:
   ```bash
   node ~/.claude/skills/justone/scripts/upload-submission.mjs
   ```
   This reads `~/.justone/credentials` (the `jo_pat_*` token) and POSTs to the gallery. If the response is `200/201` with a gallery URL, you're done.
8. **Report the result to the user.** Show the gallery URL prominently:
   > ✓ Published. View at: https://justone-app.vercel.app/s/your-slug

## Error handling

- `invalid_credentials` from upload → tell user to visit `https://justone-app.vercel.app/submit` and issue a new token.
- `repo_not_owned` → the repo wasn't created under the user's GitHub account. Check `gh auth status`.
- `manifest_hash_mismatch` → someone edited `manifest.prompt` after the lock. Cannot publish — start fresh in a new folder.
- `repo_must_be_public` → ensure `gh repo create` used `--public` flag.

## What NOT to do

- Don't push without a `.gitignore`.
- Don't include `.env`, keys, or credentials in the commit.
- Don't modify `manifest.prompt`, `manifest.promptHash`, or `manifest.promptLockedAt` — these are immutable.
- Don't rerun `gh repo create` if it succeeded once.
