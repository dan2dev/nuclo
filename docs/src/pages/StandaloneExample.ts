import "nuclo";
import type { DataLoader, PageProps } from "nuclo-router";
import { APP_EXAMPLES, type AppExample } from "./examples/app-demos.ts";

const standalone = css("app-standalone", {
  position: "fixed", inset: "0", width: "100vw", height: "100dvh",
  display: "flex", flexDirection: "column", overflow: "hidden",
  "& > *": { width: "100%", maxWidth: "none", minHeight: "0", flex: "1" },
  "& > .os-app": { borderRadius: "0" },
});

export const load: DataLoader<AppExample | null> = (ctx) =>
  APP_EXAMPLES.find((example) => example.id === (ctx.pattern === "/desktop" ? "desktop" : ctx.params.id)) ?? null;

export default function StandaloneExample(_ctx: unknown, { data: example }: PageProps<AppExample | null>) {
  return div(standalone, { role: "main", "aria-label": example ? `${example.title} standalone` : "App not found" },
    example ? example.preview() : div(h1("App not found"), a({ href: "/examples" }, "Browse examples")),
  );
}
