/**
 * A standalone app in an iframe, with a small browser chrome: Back, Forward,
 * the app's current path and a link to open it in a tab of its own. The app
 * reports every navigation with postMessage (see demos/router/embed.ts).
 */
import { es } from "./styles.ts";

export const DEMO_BASE = "/demos/router";

function Icon(d: string) {
  return svgSvg(
    { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    pathSvg({ d }),
  );
}

export function DemoFrame(start: string, label: string) {
  let frame: HTMLIFrameElement | undefined;
  let path = start;
  const nav = (step: number) => frame?.contentWindow?.history.go(step);

  return div(
    es.demo,
    on("mount", () => {
      const onMessage = (e: MessageEvent) => {
        if (e.source !== frame?.contentWindow || e.data?.type !== "nuclo-router-demo") return;
        path = e.data.path;
        update();
      };
      addEventListener("message", onMessage);
      return () => removeEventListener("message", onMessage);
    }),
    div(
      es.demoBar,
      button(es.demoBtn, { type: "button", title: "Back", "aria-label": "Back", onClick: () => nav(-1) }, Icon("M15 6l-6 6 6 6")),
      button(es.demoBtn, { type: "button", title: "Forward", "aria-label": "Forward", onClick: () => nav(1) }, Icon("M9 6l6 6-6 6")),
      div(es.demoUrl, { title: "The app's own path, inside its base" }, () => path),
      a(es.demoOpen, { href: `${DEMO_BASE}${start}`, target: "_blank", rel: "noopener", title: "Open the app standalone, with the browser's real history" }, "Open ↗"),
    ),
    iframe(es.demoFrame, {
      src: `${DEMO_BASE}${start}?embed`,
      title: label,
      loading: "lazy",
    }, ((el: HTMLIFrameElement) => { frame = el; }) as any),
  );
}
