#!/bin/sh
# Builds the iOS app on a Mac (Xcode 26 or later) and runs it on the Simulator. No Xcode project needed.
# usage: scripts/ios.sh [simulator name or UDID = "iPhone 17 Pro"]
#   NUCLO_PATH=/lab scripts/ios.sh   opens the app at a screen
set -e
cd "$(dirname "$0")/.."
SIM=${1:-iPhone 17 Pro}
BID=dev.nuclo.nativens
OUT=build/ios
APP=build/ios-app/NucloApp.app
bun scripts/build.ts ios
SDK=$(xcrun --sdk iphonesimulator --show-sdk-path)
TARGET=$(uname -m)-apple-ios17.0-simulator
SWIFTC="xcrun --sdk iphonesimulator swiftc -O -sdk $SDK -target $TARGET -swift-version 5 -suppress-warnings"
rm -rf "$APP" build/ios-lib && mkdir -p "$APP" build/ios-lib
# The runtime of nuclo, a module of its own: its names (Style, list, update...) stay apart from the app's.
$SWIFTC -parse-as-library -emit-module -emit-library -static -module-name Nuclo \
  -emit-module-path build/ios-lib/Nuclo.swiftmodule -o build/ios-lib/libNuclo.a "$OUT"/nuclo/*.swift
$SWIFTC -parse-as-library -module-name NucloApp -I build/ios-lib -L build/ios-lib -lNuclo -lsqlite3 \
  -o "$APP/NucloApp" "$OUT"/app/*.swift
cat > "$APP/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>$BID</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>nuclo</string>
<key>CFBundleDisplayName</key><string>nuclo</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>0.1</string>
<key>UILaunchScreen</key><dict/>
<key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>
<key>UISupportedInterfaceOrientations~ipad</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationPortraitUpsideDown</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>
</dict></plist>
PLIST
xcrun simctl boot "$SIM" 2>/dev/null || true
pgrep -xq Simulator || open -a Simulator 2>/dev/null || true
xcrun simctl bootstatus "$SIM" >/dev/null
xcrun simctl install "$SIM" "$APP"
SIMCTL_CHILD_NUCLO_PATH=${NUCLO_PATH:-/} xcrun simctl launch --terminate-running-process "$SIM" "$BID"
