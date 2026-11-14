// expect: Unsupported: async callbacks
import { delay, setTimeout } from "../../../src/index.ts";
setTimeout(async () => {
  await delay(1);
}, 10);
