import { afterEach, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureAndroidDevice } from "../scripts/android";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

// The fake SDK tools use POSIX shell scripts.
const sdkTest = process.platform === "win32" ? test.skip : test;
function sdk(adb: string, emulator: string) {
  const directory = mkdtempSync(join(tmpdir(), "nuclo-android-"));
  directories.push(directory);
  for (const [tool, script] of [["platform-tools/adb", adb], ["emulator/emulator", emulator]]) {
    const path = join(directory, tool!);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, `#!/bin/sh\ncd "$(dirname "$0")/.."\n${script}\n`);
    chmodSync(path, 0o755);
  }
  return directory;
}

sdkTest("reuses an existing device without starting an emulator", async () => {
  const directory = sdk('printf "List of devices attached\\nemulator-5554\\tdevice\\n"', "touch unexpected-launch; exit 1");
  await ensureAndroidDevice(directory);
  expect(existsSync(join(directory, "unexpected-launch"))).toBe(false);
});

sdkTest("starts a visible emulator and waits for Android to finish booting", async () => {
  const directory = sdk(`
if [ "$1" = devices ]; then printf 'List of devices attached\\n'; exit 0; fi
if [ ! -f checks ]; then echo checked > checks; echo 0; exit 0; fi
echo checked >> checks
if [ -f ready ]; then echo 1; else echo 0; fi`, `
if [ "$1" = -list-avds ]; then printf 'First_Phone\\nSecond_Phone\\n'; exit 0; fi
printf '%s\\n' "$@" > launch-args
while [ ! -f checks ]; do sleep 0.01; done
touch ready
sleep 5`);
  await ensureAndroidDevice(directory);
  expect(readFileSync(join(directory, "launch-args"), "utf8")).toBe("-avd\nFirst_Phone\n");
  expect(readFileSync(join(directory, "checks"), "utf8").trim().split("\n").length).toBeGreaterThan(1);
});

sdkTest("explains how to create an emulator when no AVD exists", async () => {
  const directory = sdk("echo 'List of devices attached'", "exit 0");
  await expect(ensureAndroidDevice(directory)).rejects.toThrow("Android Studio's Device Manager");
});

sdkTest("reports emulator startup failure instead of waiting indefinitely", async () => {
  const directory = sdk(`
if [ "$1" = devices ]; then echo 'List of devices attached'; else exit 1; fi`, `
if [ "$1" = -list-avds ]; then echo Broken_Phone; else exit 1; fi`);
  await expect(ensureAndroidDevice(directory)).rejects.toThrow("exited before booting");
});
