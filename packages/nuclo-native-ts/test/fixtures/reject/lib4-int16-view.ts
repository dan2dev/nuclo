// expect: only Uint8Array / Uint8ClampedArray views share an ArrayBuffer's bytes
// code: NUCLO6002
export function words(b: ArrayBuffer): Int16Array {
  return new Int16Array(b);
}
