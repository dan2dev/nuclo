/**
 * Device data from the host: things only the platform knows, like the battery.
 *
 * Host contract (beside the ops in dom.ts):
 *   __nuclo_device(name) → string            JSON, or "" when the device has none. The first call starts watching.
 *   __nuclo_device_changed(name, json)       the host calls it when the value changes; JS answers with a batch.
 *
 * "battery": {"level": 0..1 | null, "state": "charging" | "discharging" | "full" | "unknown", "minutes": number | null}
 *   minutes: to full while charging, to empty while discharging; null when the platform cannot tell.
 *
 * The web build uses device-web.ts instead (package.json `web` condition).
 */
import { flush } from "./dom";

export interface Battery {
  /** 0..1, or null when unknown. */
  level: number | null;
  state: "charging" | "discharging" | "full" | "unknown";
  /** Minutes to full (charging) or to empty (discharging), when the platform knows. */
  minutes: number | null;
}

type Host = Record<string, unknown> & { __nuclo_device?: (name: string) => string };
const g = globalThis as Host;
const listeners = new Map<string, Set<(json: string) => void>>();

g.__nuclo_device_changed = (name: string, json: string) => {
  for (const listener of [...(listeners.get(name) ?? [])]) listener(json);
  flush();
};

function watch<T>(name: string, onChange?: (value: T | null) => void): T | null {
  const parse = (json: string) => (json ? (JSON.parse(json) as T) : null);
  if (onChange) {
    let set = listeners.get(name);
    if (!set) listeners.set(name, (set = new Set()));
    set.add((json) => onChange(parse(json)));
  }
  return parse(typeof g.__nuclo_device === "function" ? String(g.__nuclo_device(name) ?? "") : "");
}

/** The battery now, or null when the device has none; `onChange` gets every later reading. */
export function battery(onChange?: (battery: Battery | null) => void) {
  return watch<Battery>("battery", onChange);
}
