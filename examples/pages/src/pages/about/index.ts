import { Page } from "nuclo-pages";
import { serverTime } from "../../server/time";
import { styles } from "../../styles";

export default Page({
  prerender: true,
  head: () => ({ title: "About · Nuclo Pages" }),
  render: () => {
    // View state lives in the view, like any Nuclo component.
    const state = { clicks: 0, time: "" };
    return section(
      h1("About"),
      p("Pages are plain Nuclo views. State lives in the view, and update() refreshes it."),
      a(styles.navLink, { href: "/about/life" }, "Life at Nuclo"),
      button(styles.button, { onClick: () => (state.clicks++, update()) }, () => `Clicked ${state.clicks} times`),
      button(styles.button, { onClick: async () => ((state.time = await serverTime()), update()) }, "Ask the server the time"),
      p(styles.muted, () => state.time),
    );
  },
});
