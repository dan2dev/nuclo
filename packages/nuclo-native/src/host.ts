/**
 * The bridge between JS and a native host, as globals: the host defines the
 * first three, JS defines the last two (dom.ts, device.ts). Only strings,
 * numbers and booleans cross it, so any JS engine can bridge it.
 */
declare global {
  /** Applies one batch of ops (dom.ts, "Ops"), as JSON. */
  var __nuclo_host: ((json: string) => void) | undefined;
  /** A text's, button's or image's content size, "w h", at most `maxWidth` wide (-1: unconstrained). */
  var __nuclo_measure: ((id: number, maxWidth: number) => string) | undefined;
  /** Device data (device.ts) as JSON, "" when the device has none; "frames" for check.ts. */
  var __nuclo_device: ((name: string) => string) | undefined;
  /** A native event on a node: click, input, change, scroll, resize, pop, select. */
  var __nuclo_event: (id: number, type: string, value?: string | number | boolean) => void;
  /** Device data changed: the host passes the new JSON, or "". */
  var __nuclo_device_changed: (name: string, json: string) => void;
}

export {};
