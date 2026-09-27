import { createHash } from "node:crypto";
import { Page } from "nuclo-pages";
import { getCount, increment } from "../server/counter";

// Only load and the actions use these: the browser build drops them.
const PAGE_SECRET = "PAGE_ONLY_SECRET";
const tag = () => createHash("sha1").update(PAGE_SECRET).digest("hex").slice(0, 4);

export default Page({
  load: async () => ({ ...(await getCount()), tag: tag() }),
  actions: {
    bump: async (by: number) => increment(by),
  },
  render: ({ data, actions }) =>
    div(p({ id: "count" }, `${data.count} ${data.sig} ${data.tag}`), button({ id: "inc", onClick: () => actions.bump(1) }, "+1")),
});
