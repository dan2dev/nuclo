import type { ErrorProps } from "nuclo-pages";
import { styles } from "../styles";

// Shown for unknown URLs (404) and errors thrown by load().
export default function ErrorPage({ status, message }: ErrorProps) {
  return section(h1(String(status)), p(styles.muted, message), a({ href: "/" }, "Back home"));
}
