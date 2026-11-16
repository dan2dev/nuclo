#!/bin/sh
# Build one example for macOS (the iOS runtime on AppKit, with runtimes/macos/UIKitShim.swift) into an .app and launch it.
# usage: scripts/macos-run.sh [example=full-showcase]
# NUCLO_SHOT=file.png / NUCLO_DUMP=file are passed to the app (a picture / the label frames, two seconds after launch).
set -e
cd "$(dirname "$0")/.."
EX=${1:-full-showcase}
SRC=build/macos/$EX
APP=build/macos-app/$EX/NucloApp.app
rm -rf "$SRC"
bun src/compiler/cli.ts build "examples/$EX/App.ts" --out "build/check/$EX" --target macos
mkdir -p build/macos && cp -R "build/check/$EX/macos" "$SRC"
rm -rf "$APP" && mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
xcrun swiftc -O -target "$(uname -m)-apple-macos13.0" -swift-version 5 -parse-as-library -suppress-warnings -o "$APP/Contents/MacOS/NucloApp" "$SRC"/*.swift
[ -d "$SRC/assets" ] && cp -R "$SRC/assets" "$APP/Contents/Resources/"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>dev.nuclo.nativets.macos.$EX</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>$EX</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>LSMinimumSystemVersion</key><string>13.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSCameraUsageDescription</key><string>Takes photos in the app.</string>
</dict></plist>
PLIST
codesign --force --sign - "$APP" >/dev/null 2>&1
if [ -n "$NUCLO_SHOT$NUCLO_DUMP" ]; then "$APP/Contents/MacOS/NucloApp" & PID=$!; sleep "${NUCLO_WAIT:-4}"; kill $PID; else open "$APP"; fi
