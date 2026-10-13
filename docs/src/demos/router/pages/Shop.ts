// Shop.ts: a layout page with its own load(). On a cold navigation to
// /shop/:section the layout's loader and the section's loader run in
// parallel, and one router.pending covers both — the previous page stays up
// until the pair resolves. Moving between sections keeps this layout: its
// data, its DOM and the notes input all survive.
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";
import { router } from "../routes.ts";
import { Sidebar } from "../sidebar.ts";
import { s } from "../styles.ts";

export interface ShopData {
  sections: string[];
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const load: DataLoader<ShopData> = async () => {
  await wait(500); // a slow API
  return { sections: ["toys", "books", "music"] };
};

export default function Shop(
  _ctx: RouteContext,
  { data, outlet }: PageProps<ShopData>,
) {
  return div(
    h1("Shop"),
    div(
      s.shop,
      div(
        s.shopMain,
        p(
          "The layout's load() and the section's load() run in parallel. ",
          "One router.pending covers both, and each gets its own data.",
        ),
        ...data.sections.map((section) =>
          a({ href: router.href(`/shop/${section}`) }, section),
        ),
        input({ placeholder: "Notes (kept)" }),
        section(outlet()),
      ),
      Sidebar(),
    ),
  );
}
