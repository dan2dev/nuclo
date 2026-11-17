#!/usr/bin/env bash
# usage: scripts/test.sh <web|android|ios|macos|linux|windows|headless> <example|all>
# Builds the target, runs the example with its test.script in test mode, and compares the dump with the headless one.
source "$(dirname "$0")/lib.sh"

target=${1:?target}
example=${2:?example or all}

if [ "$example" = all ]; then
  status=0
  for dir in examples/*/; do
    [ -f "$dir/App.kt" ] || continue
    "$0" "$target" "$(basename "$dir")" || status=1
  done
  exit $status
fi

SCRIPT=$(cat "examples/$example/test.script" 2>/dev/null || echo "dump;exit")
log="build/test/$target/$example.log"
mkdir -p "build/test/$target" build/test/headless

fail() { echo "FAIL $target $example"; echo "$1"; tail -30 "$log" 2>/dev/null || true; exit 1; }

build "$target" "$example" >"build/test/$target/$example.build.log" 2>&1 || { tail -30 "build/test/$target/$example.build.log"; fail "the build failed"; }

case "$target" in
  headless)
    NUCLO_HEADLESS=1 NUCLO_SCRIPT="$SCRIPT" timeout 90 "$(host_exe "$example")" >"$log" 2>&1 || true ;;
  macos)
    NUCLO_TEST=1 NUCLO_SCRIPT="$SCRIPT" timeout 90 "$(host_exe "$example")" >"$log" 2>&1 || true ;;
  linux)
    if [ "$HOST" = Darwin ]; then exe=$(gtk_exe "$example"); runner=(); else
      exe=$(host_exe "$example"); runner=()
      if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then runner=(xvfb-run -a); fi
    fi
    NUCLO_TEST=1 NUCLO_SCRIPT="$SCRIPT" timeout 90 "${runner[@]+"${runner[@]}"}" "$exe" >"$log" 2>&1 || true ;;
  ios)
    app=$(ios_app "$example")
    ios_boot
    xcrun simctl terminate "$SIM" "$IOS_ID" >/dev/null 2>&1 || true
    xcrun simctl install "$SIM" "$app"
    SIMCTL_CHILD_NUCLO_TEST=1 SIMCTL_CHILD_NUCLO_SCRIPT="$SCRIPT" timeout 90 xcrun simctl launch --console-pty "$SIM" "$IOS_ID" >"$log" 2>&1 || true ;;
  android)
    android_boot
    adb install -r "$(apk)" >/dev/null
    adb logcat -c
    adb shell am force-stop "$ANDROID_ID" || true
    adb shell "am start -n $ANDROID_ID/dev.nuclo.app.MainActivity --es NUCLO_TEST 1 --es NUCLO_SCRIPT '$SCRIPT'" >/dev/null
    for _ in $(seq 1 90); do
      adb logcat -d -v raw -s nuclo:I >"$log" 2>&1 || true
      grep -q '^NUCLO_EXIT' "$log" && break
      grep -q '^NUCLO_SCRIPT_ERROR' "$log" && break
      sleep 1
    done ;;
  web)
    url="file://$PWD/$(web_dir)/index.html?test=1&script=$(urlencode "$SCRIPT")"
    "$CHROME" --headless=new --disable-gpu --window-size=420,780 --virtual-time-budget=10000 --dump-dom "$url" >"build/test/web/$example.dom" 2>/dev/null || true
    # the text of <pre id="nuclo-dump">, undoing the HTML escapes
    bun -e '
      const dom = await Bun.file(process.argv[1]).text()
      const m = dom.match(/<pre id="nuclo-dump"[^>]*>([\s\S]*?)<\/pre>/)
      process.stdout.write(m ? m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : "")
    ' "build/test/web/$example.dom" >"$log" ;;
  windows)
    echo "windows: linked, not run"
    echo "PASS windows $example (linked only; never run)"
    exit 0 ;;
  *) echo "unknown target $target" >&2; exit 2 ;;
esac

tr -d '\r' <"$log" >"$log.tmp" && mv "$log.tmp" "$log"   # simctl's pty adds carriage returns
grep -q '^NUCLO_SCRIPT_ERROR' "$log" && fail "the script failed"
grep -q '^NUCLO_DUMP_END' "$log" || fail "no NUCLO_DUMP_END in the log"
grep -q '^NUCLO_EXIT' "$log" || fail "no NUCLO_EXIT in the log"

dumps=$(grep -c '^NUCLO_DUMP_BEGIN' "$log" || true)
views=$(grep -cE '^(box|text|button|input|checkbox|textarea|image|native)\|' "$log" || true)

if [ "$target" != headless ]; then
  size=$(grep -m1 '^NUCLO_DUMP_BEGIN' "$log" | awk '{print (NF >= 4 ? $4 : $3)}')   # the window's size when the header has it, else the root's
  ref="build/test/headless/$example@$size.log"
  [ "$HOST" = Darwin ] || true
  gradle ":app:linkDebugExecutable$NATIVE" -Pexample="$example" >"build/test/headless/$example.build.log" 2>&1 || fail "the headless build failed"
  NUCLO_HEADLESS=1 NUCLO_SIZE="$size" NUCLO_SCRIPT="$SCRIPT" timeout 90 "$(host_exe "$example")" >"$ref" 2>&1 || true
  flags=()
  if [ "$target" = web ] || [ -d "examples/$example/native" ]; then flags=(--structure); fi
  if ! diff_out=$(bun scripts/compare.ts "$ref" "$log" "${flags[@]+"${flags[@]}"}"); then
    echo "FAIL $target $example"
    echo "$diff_out"
    exit 1
  fi
fi
echo "PASS $target $example ($dumps dumps, $views views)"
