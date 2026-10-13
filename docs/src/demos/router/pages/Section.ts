// Section.ts: the child page. Its load() runs beside the layout's on a cold
// navigation, and alone when moving between sections — the layout is kept.
import type { DataLoader, PageProps, RouteContext } from "nuclo-router";

export interface SectionData {
  section: string;
  items: string[];
}

const catalog: Record<string, string[]> = {
  toys: ["Blocks", "Train", "Kite"],
  books: ["Atlas", "Almanac", "Novel"],
  music: ["Drum", "Lyre", "Whistle"],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const load: DataLoader<SectionData> = async (ctx) => {
  await wait(900); // slower than the layout's: watch one pending cover both
  return { section: ctx.params.section, items: catalog[ctx.params.section] ?? [] };
};

export default function Section(
  _ctx: RouteContext,
  { data }: PageProps<SectionData>,
) {
  return article(
    h2(`Section: ${data.section}`),
    p(
      "The layout kept its DOM and its notes while this loader ran; ",
      "the sidebar, with its own router, was loading in parallel.",
    ),
    ul(list(() => data.items, (item) => li(item))),
  );
}
