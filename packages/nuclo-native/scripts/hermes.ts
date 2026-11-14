// The Hermes release the Hermes hosts embed (Android, iOS, macOS), fetched once into build/hermes:
//   include/             JSI's and Hermes's headers, the same on every platform
//   jsi.cpp              JSI's own code: Android's libhermesvm.so expects it in a libjsi.so (hosts/android)
//   bin/hermesc          the bytecode compiler, for macOS
//   Library/Frameworks/  hermesvm.framework for macOS, iOS and the simulator
//   VERSION              the release this is
// Android's libhermesvm.so comes from Maven through Gradle (hosts/android/app/build.gradle.kts), at the same version:
// its CMakeLists.txt checks.
import { $ } from "bun";

export const HERMES = "260318099.0.7";
export const hermesDir = "build/hermes";

/** Fetches the release when it is not there yet; returns its folder. */
export async function hermes() {
  const version = Bun.file(`${hermesDir}/VERSION`);
  if ((await version.exists()) && (await version.text()).trim() === HERMES) return hermesDir;
  const tmp = `${hermesDir}.tmp`;
  await $`rm -rf ${tmp} && mkdir -p ${tmp}`;
  const maven = `https://repo1.maven.org/maven2/com/facebook/hermes/hermes-ios/${HERMES}/hermes-ios-${HERMES}-hermes-ios-release.tar.gz`;
  await $`curl -fsSL ${maven} | tar -xz -C ${tmp} --strip-components 2 ./destroot`;
  await $`curl -fsSL https://raw.githubusercontent.com/facebook/hermes/hermes-v${HERMES}/API/jsi/jsi/jsi.cpp -o ${tmp}/jsi.cpp`;
  await Bun.write(`${tmp}/VERSION`, HERMES);
  await $`rm -rf ${hermesDir} && mv ${tmp} ${hermesDir}`;
  return hermesDir;
}

/**
 * Compiles a bundle to Hermes bytecode next to it (app.js → app.hbc): the hosts load it without parsing anything.
 * Block scoping is a flag: without it hermesc compiles let and const as var, and every closure made in a loop
 * sees the loop's last value.
 * ponytail: hermesc ships in the release for macOS only; elsewhere the hosts compile app.js at launch. The npm
 * package hermes-compiler has it for Linux and Windows.
 */
export async function bytecode(js: string) {
  const out = js.replace(/\.js$/, ".hbc");
  const hermesc = `${await hermes()}/bin/hermesc`;
  if (process.platform !== "darwin") return void (await $`rm -f ${out}`);
  await $`${hermesc} -O -Xes6-block-scoping -Xasync-generators -emit-binary -out ${out} ${js}`;
  return out;
}

/**
 * Builds hosts/hermes/cli.cpp, which runs a bundle in this machine's Hermes with no views (the engine benchmarks):
 * `$(bun scripts/hermes.ts cli) bundle.js`. macOS only, as the release's framework is.
 */
export async function cli() {
  const frameworks = `${process.cwd()}/${await hermes()}/Library/Frameworks/macosx`;
  const out = "build/nuclo-hermes";
  await $`clang++ -std=c++20 -O2 -I ${hermesDir}/include hosts/hermes/nuclo_hermes.cpp hosts/hermes/cli.cpp -F ${frameworks} -framework hermesvm -Wl,-rpath,${frameworks} -o ${out}`;
  return out;
}

if (import.meta.main) console.log(await (process.argv[2] === "cli" ? cli() : hermes()));
