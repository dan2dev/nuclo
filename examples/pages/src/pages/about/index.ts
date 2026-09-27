import { styles } from "../../styles";

export const prerender = true;

export const head = () => ({ title: "About · Nuclo Pages" });

export default function About() {
  let clicks = 0;
  return section(
    h1("About"),
    p("Pages are plain Nuclo views. State lives in the view, and update() refreshes it."),
    a(styles.navLink, { href: "/about/life" }, "Life at Nuclo"),
    button(styles.button, { onClick: () => (clicks++, update()) }, () => `Clicked ${clicks} times`),
  );
}
