# Install JustOne slash commands + skill into ~/.claude on Windows.
#
# Usage:
#   .\install.ps1                  → installs to $HOME\.claude
#   .\install.ps1 -Target C:\path  → installs to a custom location

param(
  [string]$Target = ""
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = Join-Path $scriptDir "claude"

if ([string]::IsNullOrEmpty($Target)) {
  if ($env:CLAUDE_DIR) {
    $Target = $env:CLAUDE_DIR
  } else {
    $Target = Join-Path $HOME ".claude"
  }
}

if (-not (Test-Path $srcDir)) {
  Write-Error "source not found: $srcDir"
  exit 1
}

Write-Host "* installing JustOne to $Target"

$commandsDir = Join-Path $Target "commands"
$skillsDir   = Join-Path $Target "skills"
New-Item -ItemType Directory -Path $commandsDir -Force | Out-Null
New-Item -ItemType Directory -Path $skillsDir   -Force | Out-Null

Copy-Item -Path (Join-Path $srcDir "commands\justone.md")         -Destination $commandsDir -Force
Copy-Item -Path (Join-Path $srcDir "commands\justone-publish.md") -Destination $commandsDir -Force

$skillDst = Join-Path $skillsDir "justone"
if (Test-Path $skillDst) {
  Remove-Item -Path $skillDst -Recurse -Force
}
Copy-Item -Path (Join-Path $srcDir "skills\justone") -Destination $skillsDir -Recurse -Force

Write-Host "✓ commands installed:"
Write-Host "    $commandsDir\justone.md"
Write-Host "    $commandsDir\justone-publish.md"
Write-Host "✓ skill installed:"
Write-Host "    $skillDst\"
Write-Host ""
Write-Host "Try it: open Claude Code in a new empty folder, then type /justone <prompt>"
