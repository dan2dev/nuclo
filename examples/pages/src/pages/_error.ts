import type { ErrorProps } from "nuclo-pages";
import { styles } from "../styles";

export const head = ({ status }: ErrorProps) => ({ title: `${status} · Nuclo Pages` });

// Renders 404s and errors thrown by load(), inside the layouts above it.
export default function ErrorPage({ status, message }: ErrorProps) {
  return section(h1(String(status)), p(styles.muted, message), a({ href: "/" }, "Back home"));
}
