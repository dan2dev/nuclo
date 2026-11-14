// Chirp: a small social app. A feed that loads as you scroll until all 5,000 posts are in, posts with photos and
// videos, threads, profiles and friends: a friend's profile lists their friends, so the stack goes as deep as you tap.
import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { color } from "../ui";
import {
  Alerts,
  Explore,
  Friends,
  Home,
  Likes,
  Profile,
  Thread,
  Viewer,
  friendsTitle,
  loadFeed,
  loadUsers,
  userTitle,
  viewerTitle,
} from "./views";

export const router = createRouter(
  {
    "/": { view: Home, title: "Home", onEndReached: loadFeed },
    "/explore": { view: Explore, title: "Explore", onEndReached: loadUsers },
    "/alerts": { view: Alerts, title: "Notifications" },
    "/me": { view: () => Profile({ id: "0" }), title: "Profile" },
    "/user/:id": { view: Profile, title: userTitle },
    "/user/:id/friends": { view: Friends, title: friendsTitle },
    "/post/:id": { view: Thread, title: "Post" },
    "/post/:id/likes": { view: Likes, title: "Liked by" },
    "/media/:id/:index": { view: Viewer, title: viewerTitle },
  },
  {
    tabs: [
      { path: "/", title: "Home", icon: "home" },
      { path: "/explore", title: "Explore", icon: "search" },
      { path: "/alerts", title: "Alerts", icon: "bell" },
      { path: "/me", title: "Profile", icon: "person" },
    ],
  },
);

document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
