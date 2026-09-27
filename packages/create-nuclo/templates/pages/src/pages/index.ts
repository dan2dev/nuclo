import type { PageProps } from "nuclo-pages";
import { getCount, increment } from "../server/counter";
import { styles } from "../styles";

// Runs on the server for the first request and in the browser on client navigation.
export const load = async () => ({ count: await getCount() });

export const head = () => ({ title: "Home · Nuclo Pages" });

export default function Home({ data }: PageProps<typeof load>) {
  return section(
    h1("Nuclo Pages"),
    p("Edit ", code("src/pages/index.ts"), ". Pages are files in ", code("src/pages"), "."),
    button(styles.button, { onClick: async () => ((data.count = await increment()), update()) }, () => `Server count: ${data.count}`),
    p(styles.muted, "The count lives on the server: reload the page and it's still there."),
  );
}
