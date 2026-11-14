// Builds an example's bundle, then builds and launches one target: `bun scripts/run.ts <target> [example]`.
// Native hosts: ios macos android linux windows web. GPUI hosts: ios-gpui macos-gpui android-gpui linux-gpui windows-gpui.
// `build` only bundles. Examples are the folders in examples/ (showcase by default).
// App builds go to build/<target>; dist/ holds only the bundle (app.js + assets) the hosts load, and for the hosts
// that run Hermes (android, ios, macos) its bytecode, app.hbc.
import { $ } from "bun";
import { existsSync, readdirSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { bytecode, hermes } from "./hermes";

const [target = "", example = "showcase"] = process.argv.slice(2);
const os = platform();
const home = homedir();
const sdk = process.env.ANDROID_HOME ?? join(home, os === "darwin" ? "Library/Android/sdk" : "Android/Sdk");
// The NDK both Android projects pin (ndkVersion in their app/build.gradle.kts).
const ndk = process.env.ANDROID_NDK_HOME ?? join(sdk, "ndk/30.0.16248370");
const libclang = "/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib";
const gpui = "hosts/gpui";

/** The UIKit host's one scene (main.swift: NucloSceneDelegate); gpui-mobile opens its own window, so ios-gpui has none. */
const sceneManifest = `
	<key>UIApplicationSceneManifest</key>
	<dict>
		<key>UIApplicationSupportsMultipleScenes</key><false/>
		<key>UISceneConfigurations</key>
		<dict>
			<key>UIWindowSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneConfigurationName</key><string>Default Configuration</string>
					<key>UISceneDelegateClassName</key><string>NucloSceneDelegate</string>
				</dict>
			</array>
		</dict>
	</dict>`;

const plist = (id: string, exe: string, scenes: boolean) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
	<key>CFBundleIdentifier</key><string>${id}</string>
	<key>CFBundleExecutable</key><string>${exe}</string>
	<key>CFBundleName</key><string>${exe}</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleVersion</key><string>1</string>
	<key>CFBundleShortVersionString</key><string>0.0.0</string>
	<key>UILaunchScreen</key><dict/>${scenes ? sceneManifest : ""}
</dict></plist>
`;

function need(os_: string) {
  if (os !== os_) throw new Error(`${target} builds on ${os_}; this machine is ${os}.`);
}

/** The Swift host's sources, with the Hermes bridge's header for them to call. */
const swift = ["main", "Navigation", "Device", "Engine", "NativeView", "MultilineField"].map((name) => `hosts/apple/${name}.swift`);
const nativeViews = `examples/${example}/NativeViews.swift`;
if (existsSync(nativeViews)) swift.push("-DNUCLO_APP_NATIVE_VIEWS", nativeViews);
const bridge = ["-O", "-swift-version", "6", "-import-objc-header", "hosts/hermes/nuclo_hermes.h", "-lc++", "-framework", "hermesvm"];

/** Compiles the Hermes bridge (hosts/hermes) for an Apple target into `out`. */
async function bridgeObject(target: string, out: string, sdk: string[] = []) {
  await $`xcrun ${sdk} clang++ -std=c++20 -O2 -c -target ${target} -I ${await hermes()}/include hosts/hermes/nuclo_hermes.cpp -o ${out}`;
}

/** Wraps a built app in an .app bundle with the JS bundle, signs it, and runs it on the booted simulator. */
async function simulator(app: string, id: string, exe: string, scenes = false) {
  await $`rm -rf ${app}/assets ${app}/fonts ${app}/app.hbc`;
  await $`cp -R dist/app.js dist/fonts ${app}/`;
  if (existsSync("dist/app.hbc")) await $`cp dist/app.hbc ${app}/`;
  if (existsSync("dist/assets")) await $`cp -R dist/assets ${app}/`;
  await Bun.write(`${app}/Info.plist`, plist(id, exe, scenes));
  if (existsSync(`${app}/Frameworks`)) await $`codesign -s - --force ${app}/Frameworks/hermesvm.framework`.quiet();
  await $`codesign -s - --force ${app}`.quiet();
  await $`xcrun simctl install booted ${app}`;
  await $`xcrun simctl launch booted ${id}`;
}

async function android(project: string, id: string, activity: string) {
  // Each project's Gradle wrapper (Gradle 9.9.1, AGP 9.5): it needs a full JDK 17+ (JAVA_HOME).
  await $`./gradlew assembleDebug`.cwd(project).env({ ...process.env, ANDROID_HOME: sdk });
  await $`adb install -r ${project}/app/build/outputs/apk/debug/app-debug.apk`;
  await $`adb shell am start -n ${id}/${activity}`;
}

const targets: Record<string, () => Promise<unknown>> = {
  async ios() {
    need("darwin");
    const app = "build/ios/NucloApp.app";
    const target = "arm64-apple-ios27.0-simulator";
    const sdk = ["-sdk", "iphonesimulator"];
    // Hermes ships as a framework, embedded in the app.
    const frameworks = `${await hermes()}/Library/Frameworks/universal/hermesvm.xcframework/ios-arm64_x86_64-simulator`;
    await $`mkdir -p ${app}/Frameworks`;
    await $`rm -rf ${app}/Frameworks/hermesvm.framework && cp -R ${frameworks}/hermesvm.framework ${app}/Frameworks/`;
    await bridgeObject(target, "build/ios/nuclo_hermes.o", sdk);
    await $`xcrun ${sdk} swiftc ${bridge} -target ${target} ${swift} build/ios/nuclo_hermes.o -F ${frameworks} -Xlinker -rpath -Xlinker @executable_path/Frameworks -o ${app}/NucloApp`;
    await simulator(app, "dev.nuclo.native", "NucloApp", true);
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
    const target = "arm64-apple-macos27.0";
    const frameworks = join(process.cwd(), await hermes(), "Library/Frameworks/macosx");
    await $`mkdir -p build/macos`;
    await bridgeObject(target, "build/macos/nuclo_hermes.o");
    await $`swiftc ${bridge} -target ${target} ${swift} build/macos/nuclo_hermes.o -F ${frameworks} -Xlinker -rpath -Xlinker ${frameworks} -o build/macos/nuclo-app`;
    await $`build/macos/nuclo-app dist/app.js`;
  },

  async android() {
    // Its CMake build takes JSI's headers and jsi.cpp from the release (hosts/android/app/src/main/cpp).
    await hermes();
    await android("hosts/android", "dev.nuclo.host", ".MainActivity");
  },

  async "android-gpui"() {
    const tools = join(ndk, "toolchains/llvm/prebuilt", os === "darwin" ? "darwin-x86_64" : `${os}-x86_64`);
    const clang = join(tools, "bin/aarch64-linux-android30-clang");
    const env = {
      ...process.env,
      ANDROID_NDK_HOME: ndk,
      ANDROID_NDK_ROOT: ndk,
      CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER: clang,
      CC_aarch64_linux_android: clang,
      AR_aarch64_linux_android: join(tools, "bin/llvm-ar"),
      // Newer NDK headers reject an unversioned target triple.
      BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android: `--sysroot=${join(tools, "sysroot")} --target=aarch64-linux-android30`,
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
// The Hermes hosts load bytecode; a stale one would run instead of the bundle just built.
if (["android", "ios", "macos", "build"].includes(target)) await bytecode("dist/app.js");
else await $`rm -f dist/app.hbc`;
await $`rm -rf dist/assets`;
if (existsSync(`examples/${example}/assets`)) await $`cp -r examples/${example}/assets dist/`;
// The bundled font every host lays text out with (see the style contract).
await $`rm -rf dist/fonts && cp -r fonts dist/fonts`;
await run();
