import { ErrorPage } from "nuclo-pages";
import { styles } from "../styles";

// Shown for unknown URLs (404) and errors thrown by load().
export default ErrorPage({
  render: ({ status, message }) => section(h1(String(status)), p(styles.muted, message), a({ href: "/" }, "Back home")),
});
