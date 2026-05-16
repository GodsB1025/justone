# JustOne

**Claude Code 에게 단 한 번의 프롬프트로 실행 가능한 프로젝트를 만들게 하라.**
완성된 결과물은 자동으로 너의 GitHub 와 [JustOne 갤러리](https://justone-app.vercel.app) 에 올라간다.

> 🇬🇧 English: [README.md](./README.md)

```
/justone <프롬프트>              → 에이전트가 한 번에 실행 가능한 프로젝트 ship (추가 질문 없음)
/justone-publish                → public GitHub repo 생성, push, 갤러리 등록
```

---

# Quickstart — 순서대로 5가지

마지막 줄을 실행해서 모두 ✓ 나오면 준비 완료.

```bash
# 1. 필수 도구 설치 (한 번)
node --version       # ≥ 18 필요
git --version
gh --version
claude --version

# 2. GitHub CLI 인증 (한 번)
gh auth login        # GitHub.com → HTTPS → 브라우저

# 3. 플러그인 설치 (이 repo 루트에서)
node install.mjs

# 4. CLI 토큰 발급 + 로컬 저장
#    a) https://justone-app.vercel.app/submit 방문 (먼저 GitHub 로 로그인)
#    b) "Issue token" 클릭 — 라임색 박스의 jo_pat_... 복사
#    c) 너의 셸에 맞게 저장:
#       bash/zsh/Linux/macOS:
#         mkdir -p ~/.justone && printf 'jo_pat_여기에붙여넣기\n' > ~/.justone/credentials && chmod 600 ~/.justone/credentials
#       Windows PowerShell:
#         $dir = Join-Path $HOME ".justone"; New-Item -ItemType Directory -Path $dir -Force | Out-Null; Set-Content -Path (Join-Path $dir "credentials") -Value "jo_pat_여기에붙여넣기" -NoNewline

# 5. 환경 검증
node ~/.claude/skills/justone/scripts/verify-environment.mjs
# 다음 항목이 모두 ✓: node, git, gh, gh authenticated, credentials
```

**5번에서 ✗ 가 하나라도 보이면**, 아래 [시작 전 준비](#시작-전-준비) 와 [첫 셋업](#첫-셋업-약-5분) 섹션에서 해당 항목을 찾아 해결.

모두 ✓ 라면 — 빈 폴더 만들고 Claude Code 켠 후 `/justone <프롬프트>`. 자세한 흐름은 [챌린지 실행](#챌린지-실행-매-빌드) 참조.

---

# 시작 전 준비

JustOne 은 Claude Code 플러그인이야. 처음에 몇 가지 셋업만 하면, 이후 매 챌린지는 슬래시 커맨드 두 개로 끝난다.

## ✅ 필수 설치 항목

총 4가지가 PATH 에 잡혀 있어야 함. 오른쪽 명령으로 빠진 게 있는지 확인.

| 도구 | 용도 | 확인 명령 |
|---|---|---|
| **Node.js 18+** | 설치 + 헬퍼 스크립트 실행 | `node --version` |
| **git** | 빌드 repo 초기화 | `git --version` |
| **GitHub CLI (`gh`)** | public repo 생성 + push | `gh --version` |
| **Claude Code** | 빌드를 수행하는 에이전트 | `claude --version` |

### 플랫폼별 설치 명령

<details>
<summary><b>Windows</b> (cmd / PowerShell)</summary>

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
# Claude Code: https://docs.claude.com/en/docs/claude-code/overview
```
설치 후 **새 터미널** 을 열어야 PATH 가 갱신됨.
</details>

<details>
<summary><b>macOS</b> (Homebrew)</summary>

```bash
brew install node git gh
# Claude Code: https://docs.claude.com/en/docs/claude-code/overview
```
</details>

<details>
<summary><b>Linux</b> (Debian/Ubuntu)</summary>

```bash
sudo apt update
sudo apt install nodejs git gh
# node ≥ 18 확인: `node --version`. 너무 낮으면 nvm 사용: https://github.com/nvm-sh/nvm
# Claude Code: https://docs.claude.com/en/docs/claude-code/overview
```
Fedora/RHEL 은 `dnf install`. 다른 배포판의 `gh` 설치는 [github.com/cli/cli/install_linux](https://github.com/cli/cli/blob/trunk/docs/install_linux.md) 참조.
</details>

## ✅ 필수 계정

- **GitHub 계정** — 로그인 + 에이전트가 코드를 push 할 곳.
- **JustOne 갤러리 계정** — [justone-app.vercel.app/login](https://justone-app.vercel.app/login) 에서 GitHub 으로 처음 로그인하면 자동 생성. 무료, 이메일 불필요.

이게 전부.

---

# 첫 셋업 (약 5분)

한 번만 하면 끝.

### 1. GitHub CLI 인증

```bash
gh auth login
```
**GitHub.com → HTTPS → Login with a web browser** 순서. 기본 scopes 그대로.

확인:
```bash
gh auth status
# → ✓ Logged in to github.com account 너의이름
```

### 2. JustOne 커맨드 설치

이 repo 를 clone 한 뒤 폴더 안에서 **하나만** 실행:

| 사용 중인 셸 | 명령 |
|---|---|
| Node 가 있는 어디든 (권장) | `node install.mjs` |
| bash / zsh / fish / Git Bash | `./install.sh` |
| Windows PowerShell | `.\install.ps1` |
| Windows cmd | `install.bat` |

`~/.claude/` 로 슬래시 커맨드 + 스킬 복사. 설치 후 어느 폴더에서 Claude Code 를 켜든 `/justone` 과 `/justone-publish` 가 슬래시 메뉴에 노출됨.

### 3. 갤러리 로그인 + CLI 토큰 발급

1. [justone-app.vercel.app/login](https://justone-app.vercel.app/login) → **Continue with GitHub**.
2. [justone-app.vercel.app/submit](https://justone-app.vercel.app/submit) → **Issue token**.
3. 라임색 박스에 `jo_pat_…` 토큰이 **한 번만** 노출됨. 즉시 복사.
4. `~/.justone/credentials` 에 저장:

<details>
<summary><b>bash / zsh / Linux / macOS</b></summary>

```bash
mkdir -p ~/.justone
printf 'jo_pat_여기에붙여넣기\n' > ~/.justone/credentials
chmod 600 ~/.justone/credentials
```
</details>

<details>
<summary><b>fish</b></summary>

```fish
mkdir -p ~/.justone
echo 'jo_pat_여기에붙여넣기' > ~/.justone/credentials
chmod 600 ~/.justone/credentials
```
</details>

<details>
<summary><b>Windows PowerShell</b></summary>

```powershell
$dir = Join-Path $HOME ".justone"
New-Item -ItemType Directory -Path $dir -Force | Out-Null
Set-Content -Path (Join-Path $dir "credentials") -Value "jo_pat_여기에붙여넣기" -NoNewline
```
</details>

<details>
<summary><b>Windows cmd</b></summary>

```cmd
if not exist "%USERPROFILE%\.justone" mkdir "%USERPROFILE%\.justone"
> "%USERPROFILE%\.justone\credentials" echo jo_pat_여기에붙여넣기
```
</details>

> 토큰 만료: **90일**. 사용자당 동시 활성 토큰 최대 **5개**. `/submit` 에서 언제든 폐기 가능.

### 4. (선택, 추천) 환경 검증

설치 후 모든 게 제대로 연결됐는지 플러그인이 직접 체크해 줌:

```bash
node ~/.claude/skills/justone/scripts/verify-environment.mjs
```
Node / git / gh (인증 포함) / 토큰 항목에 ✓ 가 떠야 정상. **하나라도 ✗ 면 그것부터 고치고 진행할 것.**

---

# 챌린지 실행 (매 빌드)

셋업이 끝났으면, 매 빌드는 세 단계만 반복.

### 1. 빈 폴더에서 Claude Code 켜기

```bash
mkdir my-build && cd my-build
claude --dangerously-skip-permissions
```

> `--dangerously-skip-permissions` 는 챌린지 컨셉의 일부 — 에이전트가 권한 prompt 없이 한 번에 ship 할 수 있어야 함. 에이전트가 마음껏 파일 쓰기 OK 인 폴더에서만 실행.

### 2. `/justone` 으로 프롬프트 lock + 빌드

Claude Code 세션 안에서:
```
/justone 알람 앱 만들어줘
```
Claude 가 수행:
- `./justone/manifest.json` 에 프롬프트 + SHA-256 해시 lock
- **추가 질문 없이** 프로젝트를 end-to-end 완성
- `README.md` 작성 + manifest 메타데이터 채움

완료 시:
> Done. Run `/justone-publish` to push to GitHub and register on the gallery.

### 3. `/justone-publish` 로 발행

```
/justone-publish
```
Claude 가 수행:
- 안전한 `.gitignore` 작성 (`.env`, 시크릿, `node_modules` 등 제외)
- `git init`, commit, `gh repo create --public --source=. --push`
- 갤러리 API 에 manifest + repo URL POST
- 갤러리 URL 출력 — 예: `https://justone-app.vercel.app/s/alarm-app-x7k2`

너의 빌드가 **✓ verified** 뱃지와 함께 갤러리에 라이브.

---

# 기억할 규칙

챌린지의 hard rule 들. 위반하면 갤러리가 submission 을 거부함.

| 규칙 | 이유 | 위반 시 |
|---|---|---|
| **단 한 번의 프롬프트.** `/justone` 실행 후 추가 보정 금지. | 챌린지의 본질. | 너의 빌드 자체는 동작하지만 JustOne 정신엔 어긋남. |
| **`justone/manifest.json` 의 `prompt` 와 `promptHash` 손대지 말 것.** lock 이후 절대. | 갤러리가 너의 GitHub raw URL 에서 manifest 를 다시 fetch 해 해시를 재계산함. | `manifest_hash_mismatch` — 새 폴더에서 다시 시작. |
| **같은 폴더에서 `/justone` 두 번 금지.** | 플러그인이 거부함. 해시 는 일회성 commitment. | `manifest already exists` — 새 폴더에서. |
| **repo 는 public 이어야 함.** `/justone-publish` 가 알아서 처리하지만, 수동으로 private 만들면 API 거부. | verified 뱃지는 공개 검증 가능성 기반. | `repo_must_be_public`. |
| **`gh` 인증 계정 = 갤러리 로그인 계정.** 같은 GitHub user. | API 가 repo 소유권을 갤러리 프로필과 비교. | `repo_owner_mismatch`. |

이 5개만 지키면 `/justone-publish` 가 항상 성공한다.

---

# 참고

## API 엔드포인트 설정

기본값: `https://justone-app.vercel.app`. 자체 호스팅 / 로컬 dev 면 Claude Code 띄우기 **전에** 설정:

```bash
# macOS / Linux / Git Bash
export JUSTONE_API_BASE=http://localhost:3000

# Windows PowerShell
$env:JUSTONE_API_BASE = "http://localhost:3000"

# Windows cmd
set JUSTONE_API_BASE=http://localhost:3000
```

## 왜 하이브리드 (슬래시 커맨드 + 스킬)?

- `commands/*.md` — 사용자가 직접 입력하는 trigger. `/` 메뉴에 노출.
- `skills/justone/SKILL.md` — 런타임 계약 + 규칙. **자동 발동 안 함** — 슬래시 커맨드 안에서만 활성.
- `skills/justone/scripts/*.mjs` — 순수 Node 헬퍼, npm 의존 없음.

JustOne 의 핵심은 **사용자의 의도적 트리거**. 슬래시 커맨드 형태가 그 컨트랙트를 깔끔하게 유지하고, 스킬 디렉토리는 런타임 자산을 보관해서 나중에 Codex 같은 다른 에이전트도 같은 스킬을 가리킬 수 있음.

## 스크립트 standalone 호출 (디버깅용)

```bash
# 프롬프트 lock 만
node ~/.claude/skills/justone/scripts/create-manifest.mjs -- "내 테스트 프롬프트"

# 환경 검증 (프로젝트 폴더 밖에서도 실행 가능)
node ~/.claude/skills/justone/scripts/verify-environment.mjs
node ~/.claude/skills/justone/scripts/verify-environment.mjs --check-manifest

# 발행만 (manifest + git remote + 토큰 필요)
node ~/.claude/skills/justone/scripts/upload-submission.mjs
```

## 파일 위치

```
~/.claude/
├─ commands/justone.md
├─ commands/justone-publish.md
└─ skills/justone/
   ├─ SKILL.md
   └─ scripts/{create-manifest,verify-environment,upload-submission}.mjs

~/.justone/
└─ credentials       # jo_pat_* 토큰 한 줄
```

## 제거

```bash
node install.mjs --uninstall
```
`~/.claude/commands/justone*.md` 와 `~/.claude/skills/justone/` 만 삭제. `~/.justone/credentials` 의 토큰은 그대로 둠.

## 트러블슈팅

| 증상 | 추정 원인 | 해결 |
|---|---|---|
| `/justone` 이 슬래시 메뉴에 안 보임 | 설치 위치 잘못 | `node install.mjs --target $HOME/.claude` 재실행 후 Claude Code 재시작 |
| 설치 후에도 `gh: command not found` | 새 PATH 가 셸에 안 잡힘 | 새 터미널 열기. Windows 에선 `"C:\Program Files\GitHub CLI\gh.exe"` 절대경로 fallback |
| `gh.exe: current directory is not a git repository` (PowerShell) | spawn 된 gh 가 다른 cwd 봄 | `Set-Location <dir>; gh repo create ...` 으로 (`Push-Location \| gh` 금지) |
| `manifest already exists` | 같은 폴더에서 이미 `/justone` 실행함 | 새 폴더에서 다시 |
| publish 시 `invalid_credentials` | 토큰 없음/만료/폐기 | `/submit` 에서 재발급 후 저장, 재시도 |
| `repo_not_owned` / `repo_owner_mismatch` | gh 인증 계정과 갤러리 로그인 계정 불일치 | `gh auth status` — 같은 계정으로 로그인 |
| `repo_must_be_public` | private 으로 생성 | `gh repo create <name> --public --source=. --push` 다시 |
| `manifest_hash_mismatch` | lock 후 manifest 의 prompt 가 수정됨 | 손대지 말 것. 새 폴더에서 다시 |
| `rate_limited` | 발행 루프 등 호출 과다 | 1 분 대기 |

## 라이센스

MIT — [LICENSE](./LICENSE).
