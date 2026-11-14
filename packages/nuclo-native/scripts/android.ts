import { $ } from "bun";
import { spawn } from "node:child_process";
import { join } from "node:path";

/** Reuse connected devices; otherwise boot the first configured AVD with a window. */
export async function ensureAndroidDevice(sdk: string) {
  const adb = join(sdk, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb");
  const devices = await $`${adb} devices`.quiet().text();
  if (devices.trim().split("\n").length > 1) return;

  const emulator = join(sdk, "emulator", process.platform === "win32" ? "emulator.exe" : "emulator");
  const avd = (await $`${emulator} -list-avds`.quiet().text()).trim().split(/\r?\n/)[0];
  if (!avd) throw new Error("No Android virtual device found. Create one in Android Studio's Device Manager, then run again.");

  console.log(`Starting Android emulator: ${avd}`);
  const child = spawn(emulator, ["-avd", avd], { detached: true, stdio: "ignore" });
  let launchError: Error | undefined;
  child.on("error", (error) => { launchError = error; });
  child.unref();

  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Android emulator ${avd} exited before booting. Run ${emulator} -avd ${avd} to see its error.`);
    }
    // adb can be online before Android's package manager is ready.
    const state = await $`${adb} shell getprop sys.boot_completed`.quiet().nothrow();
    if (state.exitCode === 0 && state.text().trim() === "1") return;
    await Bun.sleep(1000);
  }
  throw new Error(`Timed out waiting for Android emulator ${avd} to boot.`);
}
