import { ErrorPage } from "nuclo-pages";
import { styles } from "../styles";

// Renders 404s and errors thrown by load(), inside the layouts above it.
export default ErrorPage({
  head: ({ status }) => ({ title: `${status} · Nuclo Pages` }),
  render: ({ status, message }) => section(h1(String(status)), p(styles.muted, message), a({ href: "/" }, "Back home")),
});
