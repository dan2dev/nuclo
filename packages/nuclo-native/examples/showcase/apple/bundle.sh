#!/bin/sh
set -eu

# Xcode launched from Finder may not inherit the shell's PATH.
export PATH="$PATH:$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin"
if ! command -v bun >/dev/null; then
  echo "error: Install Bun to build the Nuclo Showcase bundle." >&2
  exit 1
fi

cd "$NUCLO_NATIVE_DIR"
bundle="$DERIVED_FILE_DIR/showcase"
resources="$TARGET_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"
mkdir -p "$resources"
bun build examples/showcase/app.ts --outfile "$bundle/app.js" --format iife
bun -e 'import { bytecode } from "./scripts/hermes"; await bytecode(process.argv[1])' -- "$bundle/app.js"
cp "$bundle/app.js" "$bundle/app.hbc" "$resources/"
rsync -a --delete examples/showcase/assets/ "$resources/assets/"
rsync -a --delete fonts/ "$resources/fonts/"
