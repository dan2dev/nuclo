// expect: Reading.level is UInt8, and JSON may hold any number there
// code: NUCLO6001
import { fetch, type UInt8 } from "../../../src/index.ts";
interface Reading {
  name: string;
  level: UInt8;
}
export async function load(): Promise<string> {
  const res = await fetch("https://example.org/reading.json");
  const r = await res.json<Reading>();
  return r.name;
}
