#!/usr/bin/env bash
# Shared by test.sh and run.sh. Everything runs from packages/nuclo-native-kt/.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

HOST=$(uname -s)
SIM=${NUCLO_IOS_SIM:-3BC7191A-883C-42BF-B4F3-F8CAA4504F32} # iPhone 18 Pro Max, iOS 27.2 (name is ambiguous across runtimes)
IOS_ID=dev.nuclo.nativekt
ANDROID_ID=dev.nuclo.nativekt
if [ "$HOST" = Darwin ]; then
  NATIVE=MacosArm64 NATIVE_DIR=macosArm64
  CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
else
  NATIVE=LinuxX64 NATIVE_DIR=linuxX64
  CHROME=${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || echo chromium)}
fi

gradle() { ./gradlew -q "$@"; }

# The executable of the host's Kotlin/Native target (macOS: AppKit; Linux: GTK).
host_exe() { echo "app/build/bin/$NATIVE_DIR/debugExecutable/nuclo-$1.kexe"; }
gtk_exe() { echo "gtk-preview/build/bin/macosArm64/debugExecutable/nuclo-$1.kexe"; }
web_dir() { echo "app/build/dist/js/productionExecutable"; }
apk() { echo "android/build/outputs/apk/debug/android-debug.apk"; }

# Wraps the simulator executable into build/ios/NucloApp.app (an Info.plist and the binary: no Xcode project).
ios_app() {
  local app=build/ios/NucloApp.app
  rm -rf "$app" && mkdir -p "$app"
  cp "app/build/bin/iosSimulatorArm64/debugExecutable/nuclo-$1.kexe" "$app/NucloApp"
  cat > "$app/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>$IOS_ID</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>nuclo-native-kt</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>UIRequiredDeviceCapabilities</key><array><string>arm64</string></array>
<key>UILaunchScreen</key><dict/>
<key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
<key>UISupportedInterfaceOrientations</key><array><string>UIInterfaceOrientationPortrait</string></array>
</dict></plist>
PLIST
  echo "$app"
}

ios_boot() {
  xcrun simctl boot "$SIM" 2>/dev/null || true
  xcrun simctl bootstatus "$SIM" >/dev/null
}

android_boot() {
  if ! adb get-state >/dev/null 2>&1; then
    "$ANDROID_HOME/emulator/emulator" -avd Medium_Phone -no-snapshot-save -no-boot-anim >/dev/null 2>&1 &
    adb wait-for-device
  fi
  until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ]; do sleep 1; done
}

# The build for one target.
build() {
  local target=$1 ex=$2
  case "$target" in
    headless|macos) gradle ":app:linkDebugExecutable$NATIVE" -Pexample="$ex" ;;
    linux) if [ "$HOST" = Darwin ]; then gradle :gtk-preview:linkDebugExecutableMacosArm64 -Pexample="$ex"; else gradle :app:linkDebugExecutableLinuxX64 -Pexample="$ex"; fi ;;
    ios) gradle :app:linkDebugExecutableIosSimulatorArm64 -Pexample="$ex" ;;
    android) gradle :android:assembleDebug -Pexample="$ex" ;;
    web) gradle :app:jsBrowserDistribution -Pexample="$ex" ;;
    windows) gradle :app:linkDebugExecutableMingwX64 -Pexample="$ex" ;;
    *) echo "unknown target $target" >&2; return 2 ;;
  esac
}

urlencode() { bun -e 'console.log(encodeURIComponent(process.argv[1]))' "$1"; }
