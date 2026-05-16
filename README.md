# JustOne

**Ship a real, runnable project from a single prompt to Claude Code.**
Then auto-publish it to your GitHub and to the [JustOne gallery](https://justone-app.vercel.app).

> 🇰🇷 한국어: [README.ko.md](./README.ko.md)

```
/justone <your prompt>          → agent ships a runnable project (one shot, no follow-ups)
/justone-publish                → creates a public GitHub repo, pushes, and registers on the gallery
```

---

# Quickstart — 5 things you must do, in order

If you can run the last line and see all ✓, you're ready to go.

```bash
# 1. Install required tools (one-time)
node --version       # need ≥ 18
git --version
gh --version
claude --version

# 2. Authenticate GitHub CLI (one-time)
gh auth login        # GitHub.com → HTTPS → web browser

# 3. Install the plugin (run from this repo's root)
node install.mjs

# 4. Get a CLI token and save it locally
#    a) Visit https://justone-app.vercel.app/submit (sign in with GitHub first)
#    b) Click "Issue token" — copy the jo_pat_... shown in the lime box
#    c) Save it (pick the line for your shell):
#       bash/zsh/Linux/macOS:
#         mkdir -p ~/.justone && printf 'jo_pat_PASTE_HERE\n' > ~/.justone/credentials && chmod 600 ~/.justone/credentials
#       Windows PowerShell:
#         $dir = Join-Path $HOME ".justone"; New-Item -ItemType Directory -Path $dir -Force | Out-Null; Set-Content -Path (Join-Path $dir "credentials") -Value "jo_pat_PASTE_HERE" -NoNewline

# 5. Verify everything is wired up
node ~/.claude/skills/justone/scripts/verify-environment.mjs
# Should print ✓ for: node, git, gh, gh authenticated, credentials
```

**If step 5 reports any ✗**, jump to the matching section in [Before you start](#before-you-start) or [One-time setup](#one-time-setup--5-min) below to fix it.

After all ✓ — open Claude Code in a fresh empty folder and type `/justone <your prompt>`. See [Run a challenge](#run-a-challenge-every-build).

---

# Before you start

JustOne is a Claude Code plugin. You need a few things in place once; after that, every challenge is just two slash commands.

## ✅ Required installations

Four things must be installed and reachable on your `PATH`. Run the check column on the right to see what's missing.

| Tool | Why | Verify |
|---|---|---|
| **Node.js 18+** | Runs the install + helper scripts | `node --version` |
| **git** | Initializes your build's repo | `git --version` |
| **GitHub CLI (`gh`)** | Creates the public repo + pushes | `gh --version` |
| **Claude Code** | The agent that does the build | `claude --version` |

### Install commands

<details>
<summary><b>Windows</b> (cmd / PowerShell)</summary>

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
# Claude Code: see https://docs.claude.com/en/docs/claude-code/overview
```
After install, open a **new terminal** so `PATH` refreshes.
</details>

<details>
<summary><b>macOS</b> (Homebrew)</summary>

```bash
brew install node git gh
# Claude Code: see https://docs.claude.com/en/docs/claude-code/overview
```
</details>

<details>
<summary><b>Linux</b> (Debian/Ubuntu)</summary>

```bash
sudo apt update
sudo apt install nodejs git gh
# Verify node ≥ 18: `node --version`. If too old, use nvm: https://github.com/nvm-sh/nvm
# Claude Code: see https://docs.claude.com/en/docs/claude-code/overview
```
For Fedora/RHEL use `dnf install`. For `gh` on other distros see [github.com/cli/cli/install_linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md).
</details>

## ✅ Required accounts

- A **GitHub account** (you'll log in with it and the agent will push to it).
- A **JustOne gallery account** — created automatically the first time you sign in at [justone-app.vercel.app/login](https://justone-app.vercel.app/login) (free, GitHub OAuth, no email needed).

That's the full list of requirements.

---

# One-time setup (≈ 5 min)

Do these once and never again.

### 1. Authenticate the GitHub CLI

```bash
gh auth login
```
Pick **GitHub.com → HTTPS → Login with a web browser**. Default scopes are fine.

Verify:
```bash
gh auth status
# → ✓ Logged in to github.com account YOUR_NAME
```

### 2. Install the JustOne commands

Clone this repo, then from inside the folder run **any one** of these:

| Your shell | Command |
|---|---|
| Anywhere with Node (recommended) | `node install.mjs` |
| bash / zsh / fish / Git Bash | `./install.sh` |
| Windows PowerShell | `.\install.ps1` |
| Windows cmd | `install.bat` |

This copies the slash commands + skill into `~/.claude/`. After install, `/justone` and `/justone-publish` show up in **any** Claude Code session, no matter which folder you start it in.

### 3. Sign in to the gallery and get a CLI token

1. Open [justone-app.vercel.app/login](https://justone-app.vercel.app/login) → **Continue with GitHub**.
2. Go to [justone-app.vercel.app/submit](https://justone-app.vercel.app/submit) → **Issue token**.
3. A `jo_pat_…` token is shown **once** in the lime box. Copy it immediately.
4. Save it to `~/.justone/credentials`:

<details>
<summary><b>bash / zsh / Linux / macOS</b></summary>

```bash
mkdir -p ~/.justone
printf 'jo_pat_PASTE_HERE\n' > ~/.justone/credentials
chmod 600 ~/.justone/credentials
```
</details>

<details>
<summary><b>fish</b></summary>

```fish
mkdir -p ~/.justone
echo 'jo_pat_PASTE_HERE' > ~/.justone/credentials
chmod 600 ~/.justone/credentials
```
</details>

<details>
<summary><b>Windows PowerShell</b></summary>

```powershell
$dir = Join-Path $HOME ".justone"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Set-Content -Path (Join-Path $dir "credentials") -Value "jo_pat_PASTE_HERE" -NoNewline
```
</details>

<details>
<summary><b>Windows cmd</b></summary>

```cmd
if not exist "%USERPROFILE%\.justone" mkdir "%USERPROFILE%\.justone"
> "%USERPROFILE%\.justone\credentials" echo jo_pat_PASTE_HERE
```
</details>

> Token expires after **90 days**. Max **5 active tokens** per user. Revoke any time from `/submit`.

### 4. (Optional but recommended) Verify your environment

After install, you can ask the plugin to confirm everything is wired up:

```bash
node ~/.claude/skills/justone/scripts/verify-environment.mjs
```
You should see ✓ marks for Node, git, gh (authenticated), and credentials. **If any line shows ✗, fix that before continuing.**

---

# Run a challenge (every build)

Once setup is done, every build follows three steps.

### 1. Open Claude Code in a fresh, empty folder

```bash
mkdir my-build && cd my-build
claude --dangerously-skip-permissions
```

> `--dangerously-skip-permissions` is part of the contract — the agent needs to write freely so it can ship in one shot. Use it inside a folder you're OK with the agent modifying.

### 2. Run `/justone` with your prompt

Inside the Claude Code session:
```
/justone Build me an alarm clock app
```
The agent will:
- Lock your prompt into `./justone/manifest.json` with a SHA-256 hash
- Build the project end-to-end **with no follow-up questions**
- Write a `README.md` and fill in manifest metadata

When done, it says:
> Done. Run `/justone-publish` to push to GitHub and register on the gallery.

### 3. Run `/justone-publish`

```
/justone-publish
```
The agent will:
- Add a sane `.gitignore` (skips `.env`, secrets, `node_modules`, etc.)
- `git init`, commit, and `gh repo create --public --source=. --push` to your GitHub
- Submit the manifest + repo URL to the gallery
- Print the gallery URL — e.g. `https://justone-app.vercel.app/s/alarm-app-x7k2`

Your build is now live with a **✓ verified** badge.

---

# Rules to remember

The challenge has a small number of hard rules. Break any of these and the gallery will reject the submission.

| Rule | Why | If you break it |
|---|---|---|
| **One prompt only.** Don't add follow-up corrections after `/justone` runs. | That's the whole challenge. | The build is still valid for you, but it's not the spirit of JustOne. |
| **Don't edit `prompt` or `promptHash`** in `justone/manifest.json` after the lock. | The gallery re-fetches the manifest from your GitHub raw URL and recomputes the hash. | `manifest_hash_mismatch` — start over in a new folder. |
| **Don't run `/justone` twice** in the same folder. | The plugin refuses; the hash is meant to be a one-time commitment. | `manifest already exists` — start in a new folder. |
| **The repo must be public.** `/justone-publish` does this for you, but if you create it manually as private, the API rejects it. | The verified badge depends on public verifiability. | `repo_must_be_public`. |
| **Your `gh` account must match your gallery account.** Same GitHub user. | The API checks repo ownership against your gallery profile. | `repo_owner_mismatch`. |

That's the entire list. Stay within these and `/justone-publish` always works.

---

# Reference

## Configuring the API endpoint

Default: `https://justone-app.vercel.app`. For self-hosted / local-dev gallery, set **before** launching Claude Code:

```bash
# macOS / Linux / Git Bash
export JUSTONE_API_BASE=http://localhost:3000

# Windows PowerShell
$env:JUSTONE_API_BASE = "http://localhost:3000"

# Windows cmd
set JUSTONE_API_BASE=http://localhost:3000
```

## Why hybrid (slash commands + skill)?

- `commands/*.md` — user-typed trigger, visible in the `/` menu.
- `skills/justone/SKILL.md` — runtime contract + rules. Configured **not** to auto-fire; activates only inside one of the slash commands.
- `skills/justone/scripts/*.mjs` — pure Node helpers, no npm deps.

JustOne's whole concept is **the user's deliberate trigger**. Slash command form keeps that contract clean; the skill directory holds the runtime so other agents (Codex later) can target it too.

## Manual script invocation (debugging)

```bash
# Lock the prompt only
node ~/.claude/skills/justone/scripts/create-manifest.mjs -- "my test prompt"

# Environment checks (run anytime, including outside a project)
node ~/.claude/skills/justone/scripts/verify-environment.mjs
node ~/.claude/skills/justone/scripts/verify-environment.mjs --check-manifest

# Upload only — requires manifest, git remote, and credentials
node ~/.claude/skills/justone/scripts/upload-submission.mjs
```

## Where files end up

```
~/.claude/
├─ commands/justone.md
├─ commands/justone-publish.md
└─ skills/justone/
   ├─ SKILL.md
   └─ scripts/{create-manifest,verify-environment,upload-submission}.mjs

~/.justone/
└─ credentials       # your jo_pat_* token, one line
```

## Uninstall

```bash
node install.mjs --uninstall
```
Removes `~/.claude/commands/justone*.md` and `~/.claude/skills/justone/`. Your token at `~/.justone/credentials` is left alone.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/justone` doesn't appear in the slash menu | Plugin not installed at the right root | Re-run `node install.mjs --target $HOME/.claude`, then restart Claude Code |
| `gh: command not found` right after install | New terminal hasn't picked up PATH | Open a fresh terminal. On Windows fall back to `"C:\Program Files\GitHub CLI\gh.exe"` |
| `gh.exe: current directory is not a git repository` (PowerShell) | Spawned `gh` saw a different cwd | Use `Set-Location <dir>; gh repo create ...` (not `Push-Location \| gh`) |
| `manifest already exists` | `/justone` already ran in this folder | Start over in a new folder |
| `invalid_credentials` on publish | Token missing / wrong / expired / revoked | Re-issue at `/submit`, save again, retry |
| `repo_not_owned` / `repo_owner_mismatch` | gh CLI signed in as a different user than your gallery account | `gh auth status` — log in with the same account |
| `repo_must_be_public` | Created the repo privately | `gh repo create <name> --public --source=. --push` again |
| `manifest_hash_mismatch` | Manifest `prompt` was edited after the lock | Don't edit it. Start over in a new folder |
| `rate_limited` | Too many calls (publishing on a loop) | Wait 1 minute |

## License

MIT — see [LICENSE](./LICENSE).
