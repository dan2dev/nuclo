import type { PageProps } from "nuclo-pages";
import { getCount, increment } from "../server/counter";

export const load = () => getCount();

export default function Counter({ data }: PageProps<typeof load>) {
  return div(
    p({ id: "count" }, () => `${data.count} ${data.sig}`),
    button({ id: "inc", onClick: async () => ((data.count = await increment(1)), update()) }, "+1"),
  );
}
