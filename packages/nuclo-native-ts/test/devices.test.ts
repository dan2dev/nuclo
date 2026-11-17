/**
 * The language corpus on real devices, opt-in: NUCLO_DEVICE_TESTS=ios,android bun test test/devices.test.ts.
 * test/devices/App.ts (examples/language/App.ts's screen, printing every check with console.log once the promise logs
 * are done) is built for the iOS Simulator (swiftc, an .app installed on a booted simulator, stdout read through
 * `simctl launch --console-pty`) and for Android (a release build of a copy of hosts/android, installed on the
 * device adb sees, read from logcat), and each must print exactly what bun prints for all.ts.
 * NUCLO_IOS_SIMULATOR picks a simulator (name or UDID, default the booted one); ANDROID_SERIAL picks the adb device.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import * as path from "node:path";
import { differences } from "./parity/differences.ts";

const ROOT = path.resolve(import.meta.dir, "..");
const APP = path.join(import.meta.dir, "devices/App.ts");
const REFERENCE = path.join(import.meta.dir, "parity/reference.ts");
const CACHE = path.join(tmpdir(), "nuclo-device-cache");
const BUNDLE = "dev.nuclo.nativets.devtest";
const DONE = "## __done__";
const TIMEOUT = 60_000;
const chosen = process.env.NUCLO_DEVICE_TESTS?.split(",").filter(Boolean) ?? [];
const SIMULATOR = process.env.NUCLO_IOS_SIMULATOR ?? "booted";
const JAVA_HOME = process.env.JAVA_HOME ?? [path.join(homedir(), ".sdkman/candidates/java/current")].find(existsSync);
const ANDROID_HOME = process.env.ANDROID_HOME ?? [path.join(homedir(), "Library/Android/sdk"), path.join(homedir(), "Android/Sdk")].find(existsSync);

async function program(cmd: string[], what: string, options: { cwd?: string; env?: Record<string, string> } = {}): Promise<string> {
  const proc = Bun.spawn(cmd, { cwd: options.cwd, env: { ...process.env, ...options.env }, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  if (code !== 0) throw new Error(`${what} failed (exit ${code}):\n${(stderr || stdout).split("\n").filter((l) => !/^w: /.test(l)).slice(0, 40).join("\n")}`);
  return stdout;
}

/** The dump the app printed: from its first `## ` line to the end marker. */
function dumped(text: string): string | undefined {
  const lines = text.replace(/\r/g, "").split("\n");
  const end = lines.indexOf(DONE);
  if (end < 0) return undefined;
  const start = lines.findIndex((l) => l.startsWith("## "));
  return lines.slice(start, end).join("\n");
}

/** Runs `cmd` until its output has the end marker (or TIMEOUT), then stops it; the dump it printed. */
async function readUntilDone(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
  const timer = setTimeout(() => proc.kill(), TIMEOUT);
  const decoder = new TextDecoder();
  let text = "";
  for await (const chunk of proc.stdout) {
    text += decoder.decode(chunk, { stream: true });
    if (text.includes(DONE)) break;
  }
  clearTimeout(timer);
  proc.kill();
  const out = dumped(text);
  if (out === undefined) throw new Error(`no "${DONE}" from ${cmd.join(" ")} within ${TIMEOUT / 1000} s; it printed:\n${text.slice(-2000)}`);
  return out;
}

const ios = {
  missing: () => process.platform !== "darwin" || Bun.spawnSync(["xcrun", "--find", "simctl"]).exitCode !== 0
    ? "needs macOS with Xcode"
    : SIMULATOR === "booted" && !Bun.spawnSync(["xcrun", "simctl", "list", "devices", "booted"]).stdout.toString().includes("(Booted)")
      ? "no booted simulator (xcrun simctl boot <name>, or NUCLO_IOS_SIMULATOR)"
      : undefined,
  async run(sources: string, dir: string): Promise<string> {
    const app = path.join(dir, "NucloDevTest.app");
    mkdirSync(app, { recursive: true });
    const swift = ["App.swift", "NucloRuntime.swift"].map((f) => path.join(sources, "ios", f));
    const sdk = (await program(["xcrun", "--sdk", "iphonesimulator", "--show-sdk-path"], "xcrun")).trim();
    await program(["xcrun", "--sdk", "iphonesimulator", "swiftc", "-O", "-sdk", sdk, "-target", "arm64-apple-ios15.0-simulator", "-swift-version", "5", "-parse-as-library", "-suppress-warnings", "-o", path.join(app, "NucloApp"), ...swift], "swiftc (iOS Simulator)");
    writeFileSync(
      path.join(app, "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleIdentifier</key><string>${BUNDLE}</string>
<key>CFBundleExecutable</key><string>NucloApp</string>
<key>CFBundleName</key><string>nuclo-devtest</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>CFBundleVersion</key><string>1</string>
<key>CFBundleShortVersionString</key><string>1.0</string>
<key>UILaunchScreen</key><dict/>
<key>UIDeviceFamily</key><array><integer>1</integer><integer>2</integer></array>
</dict></plist>
`,
    );
    if (SIMULATOR !== "booted") {
      Bun.spawnSync(["xcrun", "simctl", "boot", SIMULATOR]);
      await program(["xcrun", "simctl", "bootstatus", SIMULATOR], "simctl bootstatus");
    }
    await program(["xcrun", "simctl", "install", SIMULATOR, app], "simctl install");
    // The app's stdout (a pseudo-terminal: \r\n); the app keeps running, so it is stopped after the end marker.
    const out = await readUntilDone(["xcrun", "simctl", "launch", "--console-pty", "--terminate-running-process", SIMULATOR, BUNDLE]);
    Bun.spawnSync(["xcrun", "simctl", "terminate", SIMULATOR, BUNDLE]);
    return out;
  },
};

const adb = (...args: string[]) => [ANDROID_HOME ? path.join(ANDROID_HOME, "platform-tools/adb") : "adb", ...args];

const android = {
  missing: () => !ANDROID_HOME
    ? "needs the Android SDK (ANDROID_HOME)"
    : !JAVA_HOME && Bun.spawnSync(["sh", "-c", "command -v java"]).exitCode !== 0
      ? "needs a JDK 17+ (JAVA_HOME)"
      : Bun.spawnSync(adb("get-state")).exitCode !== 0
        ? "no device for adb (start an emulator)"
        : undefined,
  async run(sources: string, _dir: string): Promise<string> {
    // A copy of hosts/android of its own: the shared one's build folder is other tools' (scripts/run.ts, check:android).
    const host = path.join(CACHE, "android-host");
    cpSync(path.join(ROOT, "hosts/android"), host, { recursive: true, filter: (src) => !/[/\\](build|\.gradle|\.kotlin)$/.test(src) });
    // Kotlin's incremental cache from another program reports every runtime function as declared twice.
    for (const stale of ["app/build/kotlin", "app/build/intermediates/built_in_kotlinc", "app/build/tmp/kotlin-classes"]) rmSync(path.join(host, stale), { recursive: true, force: true });
    const env: Record<string, string> = { ANDROID_HOME: ANDROID_HOME!, ...(JAVA_HOME ? { JAVA_HOME } : {}) };
    await program(["./gradlew", "assembleRelease", "--offline", "-q", "-x", "lintVitalRelease", `-PnucloSources=${path.join(sources, "android")}`, "-PnucloAppIdSuffix=devtest", "-PnucloAppLabel=nuclo-devtest"], "gradle (hosts/android)", { cwd: host, env });
    await program(adb("install", "-r", path.join(host, "app/build/outputs/apk/release/app-release.apk")), "adb install");
    // A bigger log buffer (about 2,500 lines are printed at once); the screen on, so the activity resumes.
    Bun.spawnSync(adb("logcat", "-G", "16M"));
    Bun.spawnSync(adb("shell", "input", "keyevent", "KEYCODE_WAKEUP"));
    Bun.spawnSync(adb("shell", "am", "force-stop", BUNDLE));
    await program(adb("logcat", "-c"), "adb logcat -c");
    try {
      await program(adb("shell", "am", "start", "-n", `${BUNDLE}/dev.nuclo.app.MainActivity`), "adb am start");
      // Only this process's lines (every nuclo app logs as "nuclo", and the emulator may be shared), streamed rather
      // than dumped so another tool's `logcat -c` can't empty the buffer under it.
      // ponytail: one Log.i per line, logcat cuts a message at about 4 KB; no check prints a line that long.
      let pid = "";
      for (let i = 0; i < 50 && !pid; i++, await Bun.sleep(100)) pid = Bun.spawnSync(adb("shell", "pidof", BUNDLE)).stdout.toString().trim();
      if (!pid) throw new Error(`${BUNDLE} did not start`);
      return await readUntilDone(adb("logcat", "-v", "raw", `--pid=${pid}`, "-s", "nuclo:I"));
    } finally {
      Bun.spawnSync(adb("shell", "am", "force-stop", BUNDLE));
    }
  },
};

describe("the language corpus on devices", () => {
  let reference: Promise<string>;
  let sources: Promise<string>;
  const dirs: string[] = [];

  beforeAll(() => {
    if (chosen.length === 0) return;
    mkdirSync(CACHE, { recursive: true });
    const dir = mkdtempSync(path.join(tmpdir(), "nuclo-devices-"));
    dirs.push(dir);
    reference = program(["bun", REFERENCE], "bun all.ts");
    sources = program(["bun", path.join(ROOT, "src/compiler/cli.ts"), "build", APP, "--out", dir, "--target", "ios,android"], "nuclo build").then(() => dir);
  });
  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });

  const TARGETS = { ios, android };
  for (const [name, target] of Object.entries(TARGETS)) {
    const skip = !chosen.includes(name) ? "set NUCLO_DEVICE_TESTS=ios,android" : target.missing();
    if (skip) {
      test.skip(`${name} (skipped: ${skip})`, () => {});
      continue;
    }
    test(name === "ios" ? "iOS Simulator" : "Android", async () => {
      expect(differences(await reference, await target.run(await sources, dirs[0]!))).toBe("");
    }, 600_000);
  }
});
