#!/bin/sh
# Build a generated iOS folder into a simulator .app and launch it. No Xcode project needed.
# usage: scripts/ios-run.sh [example=full-showcase] [simulator name or UDID=iPhone 17 Pro]
set -e
cd "$(dirname "$0")/.."
EX=${1:-full-showcase}
SIM=${2:-iPhone 17 Pro}
SRC=build/ios/$EX
APP=build/ios-app/$EX/NucloApp.app
BID=dev.nuclo.nativets.ios

[ -d "$SRC" ] || bun scripts/examples.ts ios
rm -rf "$APP" && mkdir -p "$APP"
SDK=$(xcrun --sdk iphonesimulator --show-sdk-path)
xcrun swiftc -O -sdk "$SDK" -target arm64-apple-ios15.0-simulator -swift-version 5 \
  -parse-as-library -o "$APP/NucloApp" "$SRC"/*.swift
cat > "$APP/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>$BID</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>nuclo-native-ts</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>UIRequiredDeviceCapabilities</key><array><string>arm64</string></array>
<key>UILaunchScreen</key><dict/>
<key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>
<key>UISupportedInterfaceOrientations~ipad</key><array><string>UIInterfaceOrientationPortrait</string><string>UIInterfaceOrientationPortraitUpsideDown</string><string>UIInterfaceOrientationLandscapeLeft</string><string>UIInterfaceOrientationLandscapeRight</string></array>
<key>NSCameraUsageDescription</key><string>Takes photos in the app.</string>
</dict></plist>
EOF
xcrun simctl boot "$SIM" 2>/dev/null || true
open -a Simulator 2>/dev/null || true
xcrun simctl bootstatus "$SIM" >/dev/null
xcrun simctl install "$SIM" "$APP"
xcrun simctl launch "$SIM" "$BID"
