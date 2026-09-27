import type { ErrorProps } from "nuclo-pages";

export default function ErrorPage({ status, message }: ErrorProps) {
  return h1({ id: "error" }, `${status} ${message}`);
}
