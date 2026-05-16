#!/usr/bin/env bash
# Install JustOne slash commands + skill into ~/.claude.
#
# Usage: ./install.sh [--target /custom/path]
#
# Overrides:
#   CLAUDE_DIR=/path  — install root (default: ~/.claude)

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SRC_DIR="$SCRIPT_DIR/claude"

TARGET="${CLAUDE_DIR:-$HOME/.claude}"

# --target flag override
while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      TARGET="$2"
      shift 2
      ;;
    *)
      echo "✗ unknown flag: $1" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$SRC_DIR" ]]; then
  echo "✗ source not found: $SRC_DIR" >&2
  exit 1
fi

echo "▸ installing JustOne to $TARGET"

mkdir -p "$TARGET/commands"
mkdir -p "$TARGET/skills"

cp -f "$SRC_DIR/commands/justone.md"          "$TARGET/commands/"
cp -f "$SRC_DIR/commands/justone-publish.md"  "$TARGET/commands/"

# Replace skill dir wholesale to avoid stale scripts
rm -rf "$TARGET/skills/justone"
cp -R  "$SRC_DIR/skills/justone"              "$TARGET/skills/"

# Mark scripts executable (no-op on NTFS)
chmod +x "$TARGET/skills/justone/scripts/"*.mjs 2>/dev/null || true

echo "✓ commands installed:"
echo "    $TARGET/commands/justone.md"
echo "    $TARGET/commands/justone-publish.md"
echo "✓ skill installed:"
echo "    $TARGET/skills/justone/"
echo
echo "Try it: open Claude Code in a new empty folder, then type /justone <prompt>"
