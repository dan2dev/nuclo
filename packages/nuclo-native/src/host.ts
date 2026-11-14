/**
 * The bridge between JS and a native host, as globals: the host defines the
 * calls into it, JS defines the last two (dom.ts, device.ts). Only strings,
 * numbers and booleans cross it, so any JS engine can bridge it.
 */
declare global {
  /** Applies one batch of ops (dom.ts, "Ops"), as JSON. */
  var __nuclo_host: ((json: string) => void) | undefined;
  /** A text's, button's or image's content size, "w h", at most `maxWidth` wide (-1: unconstrained). */
  var __nuclo_measure: ((id: number, maxWidth: number) => string) | undefined;
  /**
   * Optional: content sizes without a node, so JS asks once per distinct text or image, not once per node.
   * A text's or a button's text's size, "w h", as __nuclo_measure gives it, in the bundled font (or the system's); an
   * image's natural size. A host with these is not asked by node, so its JS can run off its UI thread.
   */
  var __nuclo_text_size: ((text: string, size: number, bold: boolean, system: boolean, maxWidth: number) => string) | undefined;
  var __nuclo_image_size: ((src: string) => string) | undefined;
  /** Device data (device.ts) as JSON, "" when the device has none; "frames" for check.ts. */
  var __nuclo_device: ((name: string) => string) | undefined;
  /**
   * Optional, for engines without setTimeout (timers.ts): the host answers once, at least `ms` later, with
   * __nuclo_event(id, "timer").
   */
  var __nuclo_timer: ((id: number, ms: number) => void) | undefined;
  /** A native event on a node: click, input, change, scroll, resize, pop, select; or a timer's (`timer`). */
  var __nuclo_event: (id: number, type: string, value?: string | number | boolean) => void;
  /** Device data changed: the host passes the new JSON, or "". */
  var __nuclo_device_changed: (name: string, json: string) => void;
}

export {};
