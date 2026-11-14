/**
 * Device data on the web: the Battery Status API where the browser has it
 * (Chromium). Elsewhere battery() returns null, like a device without one.
 */
export type { Battery } from "./device";
import type { Battery } from "./device";

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

/** The battery now, or null when the browser cannot tell; `onChange` gets every later reading. */
export function battery(onChange?: (battery: Battery | null) => void): Battery | null {
  const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
  if (!nav.getBattery) return null;
  // The API is async: start unknown, report once read.
  nav.getBattery().then((manager) => {
    const read = () => {
      const seconds = manager.charging ? manager.chargingTime : manager.dischargingTime;
      onChange?.({
        level: manager.level,
        state: manager.charging ? (manager.level >= 1 ? "full" : "charging") : "discharging",
        minutes: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds / 60) : null,
      });
    };
    read();
    for (const type of ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"]) {
      manager.addEventListener(type, read);
    }
  });
  return { level: null, state: "unknown", minutes: null };
}
