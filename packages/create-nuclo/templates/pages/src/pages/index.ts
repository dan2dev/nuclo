import { Page } from "nuclo-pages";
import { getCount, increment } from "../server/counter";
import { styles } from "../styles";

export default Page({
  // load and actions only run on the server; the browser calls them over the network.
  load: () => ({ count: getCount() }),
  head: () => ({ title: "Home · Nuclo Pages" }),
  // After an action, load runs again and the page re-renders with the new data.
  actions: { increment: () => increment() },
  render: ({ data, actions }) =>
    section(
      h1("Nuclo Pages"),
      p("Edit ", code("src/pages/index.ts"), ". Pages are files in ", code("src/pages"), "."),
      button(styles.button, { onClick: () => actions.increment() }, `Server count: ${data.count}`),
      p(styles.muted, "The count lives on the server: reload the page and it's still there."),
    ),
});
