/**
 * Layout check, native: are the views where JS put them? Compares the frames
 * the host actually applied (`__nuclo_device("frames")`: {id: [x, y, w, h]},
 * each relative to its parent) with the frames JS sent.
 *
 * The web build uses check-web.ts: the layout engine against the browser's CSS.
 */
import { deviceScale, sentFrames } from "./dom";

export interface Mismatch {
  id: number;
  expected: number[];
  actual: number[] | null;
}

export interface CheckResult {
  total: number;
  matched: number;
  mismatches: Mismatch[];
  /** What the frames were compared with. */
  against: string;
  /** The largest difference, in units, that still matches. */
  tolerance: number;
}

/** Hosts snap each edge to device pixels from its position on screen, and a frame is relative to its
 * snapped parent: at 1× a box can sit up to one unit off the frame JS sent, at 2× half a unit. */
export function check(tolerance = Math.max(0.5, 1 / deviceScale())): CheckResult {
  const reply = String(globalThis.__nuclo_device?.("frames") ?? "");
  const applied: Record<string, number[]> = reply ? JSON.parse(reply) : {};
  const mismatches: Mismatch[] = [];
  const sent = sentFrames();
  for (const [id, frame] of sent) {
    const actual = applied[id] ?? null;
    if (!actual || actual.some((v, i) => Math.abs(v - frame[i]) > tolerance)) {
      mismatches.push({ id, expected: [...frame], actual });
    }
  }
  // A view JS never placed is a mismatch too; the body (1) is no layout root under the router.
  for (const id of Object.keys(applied).map(Number)) {
    if (id !== 1 && !sent.has(id)) mismatches.push({ id, expected: [], actual: applied[id] });
  }
  const total = sent.size + mismatches.filter((m) => !m.expected.length).length;
  return { total, matched: total - mismatches.length, mismatches, against: "the frames the host applied", tolerance };
}
