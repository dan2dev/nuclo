// Builds an example's bundle, then builds and launches one target: `bun scripts/run.ts <target> [example]`.
// Native hosts: ios macos android linux windows web. GPUI hosts: ios-gpui macos-gpui android-gpui linux-gpui windows-gpui.
// `build` only bundles. Examples are the folders in examples/ (showcase by default).
// App builds go to build/<target>; dist/ holds only the bundle (app.js + assets) the hosts load.
import { $ } from "bun";
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const [target = "", example = "showcase"] = process.argv.slice(2);
const os = platform();
const home = homedir();
const sdk = process.env.ANDROID_HOME ?? join(home, "Library/Android/sdk");
// NDK 27: newer NDKs break bindgen and the QuickJS build.
const ndk = process.env.ANDROID_NDK_HOME ?? join(sdk, "ndk/27.1.12297006");
const libclang = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib";
const gpui = "hosts/gpui";

const plist = (id: string, exe: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
	<key>CFBundleIdentifier</key><string>${id}</string>
	<key>CFBundleExecutable</key><string>${exe}</string>
	<key>CFBundleName</key><string>${exe}</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleVersion</key><string>1</string>
	<key>CFBundleShortVersionString</key><string>0.0.0</string>
	<key>UILaunchScreen</key><dict/>
</dict></plist>
`;

function need(os_: string) {
  if (os !== os_) throw new Error(`${target} builds on ${os_}; this machine is ${os}.`);
}

function gradle() {
  if (Bun.which("gradle")) return "gradle";
  const dists = join(home, ".gradle/wrapper/dists");
  const found = existsSync(dists)
    ? readdirSync(dists).filter((d) => d.startsWith("gradle-")).sort().reverse().flatMap((d) => {
        const dir = join(dists, d);
        return readdirSync(dir).map((hash) => join(dir, hash, d.replace(/-(bin|all)$/, ""), "bin/gradle"));
      })
    : [];
  const gradle = found.find(existsSync);
  if (!gradle) throw new Error("Gradle not found: install it or open the project in Android Studio once.");
  return gradle;
}

/** Wraps a built app in an .app bundle with the JS bundle, signs it, and runs it on the booted simulator. */
async function simulator(app: string, id: string, exe: string) {
  await $`rm -rf ${app}/assets ${app}/fonts`;
  await $`cp -R dist/app.js dist/fonts ${app}/`;
  if (existsSync("dist/assets")) await $`cp -R dist/assets ${app}/`;
  await Bun.write(`${app}/Info.plist`, plist(id, exe));
  await $`codesign -s - --force ${app}`.quiet();
  await $`xcrun simctl install booted ${app}`;
  await $`xcrun simctl launch booted ${id}`;
}

async function android(project: string, id: string, activity: string) {
  await $`${gradle()} assembleDebug`.cwd(project).env({ ...process.env, ANDROID_HOME: sdk });
  await $`adb install -r ${project}/app/build/outputs/apk/debug/app-debug.apk`;
  await $`adb shell am start -n ${id}/${activity}`;
}

const targets: Record<string, () => Promise<unknown>> = {
  async ios() {
    need("darwin");
    const app = "build/ios/NucloApp.app";
    await $`mkdir -p ${app}`;
    await $`xcrun -sdk iphonesimulator swiftc -swift-version 6 -target arm64-apple-ios17.0-simulator hosts/apple/main.swift hosts/apple/Navigation.swift hosts/apple/Device.swift -o ${app}/NucloApp`;
    await simulator(app, "dev.nuclo.native", "NucloApp");
  },

  async "ios-gpui"() {
    need("darwin");
    const app = "build/ios-gpui/NucloGpui.app";
    // The C parts (QuickJS) target the same iOS as the app, not the SDK's.
    const env = { ...process.env, LIBCLANG_PATH: libclang, IPHONEOS_DEPLOYMENT_TARGET: "17.0" };
    await $`cargo rustc --lib --target aarch64-apple-ios-sim --crate-type staticlib`.cwd(gpui).env(env);
    const frameworks = "UIKit Metal MetalKit QuartzCore CoreGraphics CoreText CoreFoundation Foundation Security SystemConfiguration AVFoundation CoreMedia CoreVideo IOSurface ImageIO UniformTypeIdentifiers AudioToolbox"
      .split(" ")
      .flatMap((name) => ["-framework", name]);
    await $`mkdir -p ${app}`;
    await $`xcrun -sdk iphonesimulator clang -fobjc-arc -target arm64-apple-ios17.0-simulator ${gpui}/ios/main.m ${gpui}/target/aarch64-apple-ios-sim/debug/libnuclo_gpui.a ${frameworks} -lc++ -o ${app}/NucloGpui`;
    await simulator(app, "dev.nuclo.gpui", "NucloGpui");
  },

  async macos() {
    need("darwin");
    await $`mkdir -p build/macos`;
    await $`swiftc -swift-version 6 hosts/apple/main.swift hosts/apple/Navigation.swift hosts/apple/Device.swift -o build/macos/nuclo-app`;
    await $`build/macos/nuclo-app dist/app.js`;
  },

  async android() {
    await android("hosts/android", "dev.nuclo.host", ".MainActivity");
  },

  async "android-gpui"() {
    const tools = join(ndk, "toolchains/llvm/prebuilt", os === "darwin" ? "darwin-x86_64" : `${os}-x86_64`);
    const clang = join(tools, "bin/aarch64-linux-android26-clang");
    const env = {
      ...process.env,
      ANDROID_NDK_HOME: ndk,
      ANDROID_NDK_ROOT: ndk,
      CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER: clang,
      CC_aarch64_linux_android: clang,
      AR_aarch64_linux_android: join(tools, "bin/llvm-ar"),
      BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android: `--sysroot=${join(tools, "sysroot")}`,
      ...(os === "darwin" ? { LIBCLANG_PATH: libclang } : {}),
    };
    await $`cargo rustc --lib --target aarch64-linux-android --crate-type cdylib`.cwd(gpui).env(env);
    const libs = `${gpui}/android/app/build/jniLibs/arm64-v8a`;
    await $`mkdir -p ${libs}`;
    await $`${join(tools, "bin/llvm-strip")} -o ${libs}/libnuclo_gpui.so ${gpui}/target/aarch64-linux-android/debug/libnuclo_gpui.so`;
    await android(`${gpui}/android`, "dev.nuclo.gpui", "android.app.NativeActivity");
  },

  async linux() {
    // Homebrew's GTK on macOS needs its libraries on the loader path.
    const env = os === "darwin" ? { ...process.env, DYLD_FALLBACK_LIBRARY_PATH: "/opt/homebrew/lib" } : process.env;
    await $`gjs -m hosts/linux/host.js dist/app.js`.env(env);
  },

  async windows() {
    need("win32");
    await $`dotnet run --project hosts/windows`;
  },

  async build() {},

  async web() {
    await $`bun scripts/build-web.ts ${example}`;
    console.log("http://localhost:4173");
    await $`python3 -m http.server 4173 -d dist-web`;
  },

  async "macos-gpui"() {
    need("darwin");
    await $`cargo run --manifest-path ${gpui}/Cargo.toml -- dist/app.js`;
  },

  async "linux-gpui"() {
    need("linux");
    await $`cargo run --manifest-path ${gpui}/Cargo.toml -- dist/app.js`;
  },

  async "windows-gpui"() {
    need("win32");
    await $`cargo run --manifest-path ${gpui}/Cargo.toml -- dist/app.js`;
  },
};

const examples = readdirSync("examples", { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const run = targets[target];
if (!run || !examples.includes(example)) {
  console.error(`Usage: bun scripts/run.ts <${Object.keys(targets).join("|")}> [${examples.join("|")}]`);
  process.exit(1);
}
await $`bun build examples/${example}/app.ts --outfile dist/app.js --format iife`;
await $`rm -rf dist/assets`;
if (existsSync(`examples/${example}/assets`)) await $`cp -r examples/${example}/assets dist/`;
// The bundled font every host lays text out with (see the style contract).
await $`rm -rf dist/fonts && cp -r fonts dist/fonts`;
await run();
