import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { Account } from "./pages/account";
import { Dashboard } from "./pages/dashboard";
import { Gallery, PhotoDetail } from "./pages/gallery";
import { chip, color, heading, muted } from "./ui";

export const router = createRouter({
  "/": Dashboard,
  "/gallery": Gallery,
  "/gallery/:id": PhotoDetail,
  "/account": Account,
});

const tabs = [
  { path: "/", label: "Dashboard" },
  { path: "/gallery", label: "Gallery" },
  { path: "/account", label: "Account" },
];

const isActive = (path: string) => (path === "/" ? router.path === "/" : router.path.startsWith(path));

const App = () =>
  div(
    { style: { padding: 16, gap: 14 } },
    div({ style: { gap: 2 } }, heading("Pulse", 26), muted("A nuclo app on native widgets")),
    div(
      { style: { flexDirection: "row", gap: 8 } },
      ...tabs.map((tab) => chip(tab.label, () => isActive(tab.path), () => router.reset(tab.path))),
    ),
    router.outlet(),
  );

document.body.style.backgroundColor = color.page;
render(App, document.body);
