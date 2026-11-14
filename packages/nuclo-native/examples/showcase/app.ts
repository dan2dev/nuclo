import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { Account } from "./pages/account";
import { Dashboard } from "./pages/dashboard";
import { Gallery, PhotoDetail, photoTitle } from "./pages/gallery";
import { color } from "../ui";

export const router = createRouter(
  {
    "/": { view: Dashboard, title: "Pulse" },
    "/gallery": { view: Gallery, title: "Gallery" },
    "/gallery/:id": { view: PhotoDetail, title: ({ id }) => photoTitle(id) },
    "/account": { view: Account, title: "Account" },
  },
  {
    tabs: [
      { path: "/", title: "Dashboard", icon: "chart" },
      { path: "/gallery", title: "Gallery", icon: "photo" },
      { path: "/account", title: "Account", icon: "person" },
    ],
  },
);

// The page colour behind every screen.
document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
