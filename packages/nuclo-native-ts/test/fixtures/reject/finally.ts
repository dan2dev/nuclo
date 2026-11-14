// expect: Unsupported: `finally`
import { console, delay } from "../../../src/index.ts";
export async function run() {
  try {
    await delay(1);
  } finally {
    console.log("done");
  }
}
