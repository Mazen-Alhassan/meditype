#!/usr/bin/env bash
# Sync design-tool exports into this repo, then optionally commit + push.
#
# Usage:
#   ./sync.sh                      # additive sync from default source
#   ./sync.sh /path/to/folder      # additive sync from custom source
#   ./sync.sh --clean              # mirror sync (deletes local files missing from source)
#   ./sync.sh --clean /path/...    # mirror sync from custom source

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_SRC="$HOME/Downloads/meditype-update"

CLEAN=0
SRC=""
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=1 ;;
    -h|--help)
      sed -n '2,9p' "$0"; exit 0 ;;
    *) SRC="$arg" ;;
  esac
done
SRC="${SRC:-$DEFAULT_SRC}"

if [[ ! -d "$SRC" ]]; then
  echo "✗ Source folder not found: $SRC"
  echo "  Unzip your design export into that folder, or pass a path: ./sync.sh /path/to/folder"
  exit 1
fi

# If the unzipped folder contains exactly one subdirectory and no top-level
# project files, descend into it (handles the common "meditype/..." nested zip).
shopt -s nullglob dotglob
top=( "$SRC"/* )
shopt -u nullglob dotglob
if [[ ${#top[@]} -eq 1 && -d "${top[0]}" && ! -f "$SRC/meditype.html" ]]; then
  SRC="${top[0]}"
fi

echo "→ Syncing from: $SRC"
echo "→ Into:         $REPO_DIR"
[[ $CLEAN -eq 1 ]] && echo "→ Mode:         CLEAN (mirror — local files missing from source will be deleted)" \
                  || echo "→ Mode:         additive (new + changed files only)"
echo

RSYNC_FLAGS=(-av
  --exclude='.git/'
  --exclude='.vercel/'
  --exclude='node_modules/'
  --exclude='screenshots/'
  --exclude='uploads/'
  --exclude='.DS_Store'
  --exclude='sync.sh'
  --exclude='DEPLOY.md'
  --exclude='HANDOFF.md'
  --exclude='storage.jsx'
)
[[ $CLEAN -eq 1 ]] && RSYNC_FLAGS+=(--delete)

rsync "${RSYNC_FLAGS[@]}" "$SRC"/ "$REPO_DIR"/

echo
echo "── git status ──"
cd "$REPO_DIR"
git status --short

if [[ -z "$(git status --porcelain)" ]]; then
  echo
  echo "✓ No changes — nothing to commit."
  exit 0
fi

echo
read -r -p "Commit and push? (y/n) " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  git add .
  git commit -m "design update"
  git push
  echo "✓ Pushed. Vercel will auto-deploy in ~30s."
else
  echo "Skipped. Review changes and commit manually when ready."
fi
