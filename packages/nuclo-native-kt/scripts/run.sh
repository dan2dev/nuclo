#!/usr/bin/env bash
# usage: scripts/run.sh <web|android|ios|macos|linux|windows> <example>
# Builds and opens the app for a person to look at (no script, no test mode).
source "$(dirname "$0")/lib.sh"

target=${1:?target}
example=${2:?example}

build "$target" "$example"
case "$target" in
  web) open "$(web_dir)/index.html" ;;
  macos) exec "$(host_exe "$example")" ;;
  linux) if [ "$HOST" = Darwin ]; then exec "$(gtk_exe "$example")"; else exec "$(host_exe "$example")"; fi ;;
  ios)
    app=$(ios_app "$example"); ios_boot; open -a /Applications/Xcode.app/Contents/Applications/DeviceHub.app
    xcrun simctl install "$SIM" "$app"; exec xcrun simctl launch --console-pty --terminate-running-process "$SIM" "$IOS_ID" ;; # stays attached: app stdout/stderr here, Ctrl-C quits the app
  android)
    android_boot; adb install -r "$(apk)"; adb shell am start -n "$ANDROID_ID/dev.nuclo.app.MainActivity" ;;
  windows) echo "$ROOT/app/build/bin/mingwX64/debugExecutable/nuclo-$example.exe" ;;
  *) echo "unknown target $target" >&2; exit 2 ;;
esac
