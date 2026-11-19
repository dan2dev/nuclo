#!/bin/sh
# Builds the macOS app on a Mac (the iOS runtime on AppKit, through runtime/macos/UIKitShim.swift) and opens it.
#   NUCLO_PATH=/lab scripts/macos.sh   opens the app at a screen
set -e
cd "$(dirname "$0")/.."
OUT=build/macos
APP=build/macos-app/nuclo.app
bun scripts/build.ts macos
TARGET=$(uname -m)-apple-macos14.0
SWIFTC="xcrun swiftc -O -target $TARGET -swift-version 5 -suppress-warnings"
rm -rf "$APP" build/macos-lib && mkdir -p "$APP/Contents/MacOS" build/macos-lib
$SWIFTC -parse-as-library -emit-module -emit-library -static -module-name Nuclo \
  -emit-module-path build/macos-lib/Nuclo.swiftmodule -o build/macos-lib/libNuclo.a "$OUT"/nuclo/*.swift
$SWIFTC -parse-as-library -module-name NucloApp -I build/macos-lib -L build/macos-lib -lNuclo -lsqlite3 \
  -o "$APP/Contents/MacOS/NucloApp" "$OUT"/app/*.swift
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>dev.nuclo.nativens.macos</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>nuclo</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>0.1</string>
<key>LSMinimumSystemVersion</key><string>14.0</string>
<key>NSPrincipalClass</key><string>NSApplication</string>
<key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --sign - "$APP" >/dev/null 2>&1
NUCLO_PATH=${NUCLO_PATH:-/} "$APP/Contents/MacOS/NucloApp"
