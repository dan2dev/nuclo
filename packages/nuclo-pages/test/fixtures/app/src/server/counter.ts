import { createHash } from "node:crypto";

const SECRET = "SERVER_ONLY_SECRET";
let count = 0;
const sign = (n: number) => createHash("sha1").update(`${SECRET}${n}`).digest("hex").slice(0, 6);

export const getCount = $server(async () => ({ count, sig: sign(count) }));

export const increment = $server(async (by: number) => {
  count += by;
  return count;
});
