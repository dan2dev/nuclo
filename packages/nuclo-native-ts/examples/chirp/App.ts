/**
 * Chirp: a small social app on a faked server (api.ts): 100,000 people and a million posts, loaded a page at a
 * time as you scroll (each route's onEndReached). Posts with photos and videos, topics, threads you can reply to,
 * profiles and friends (a friend's profile lists their friends, so the stack goes as deep as you tap), a people
 * search, and forms for a new post, your profile and the network the server answers on.
 *
 * The port of nuclo-native's examples/chirp, styled with nuclo-core's createCss theme (ui.ts). Differences: a
 * video shows its poster (there is no player natively), and every loaded row exists (no windowed()).
 */
import { type Node, createRouter, div, render } from "../../src/index.ts";
import { Compose, EditProfile, Settings } from "./forms.ts";
import {
  Alerts,
  Explore,
  Friends,
  Home,
  Likes,
  ProfileScreen,
  ThreadScreen,
  Topic,
  Viewer,
  friendsTitle,
  loadAlerts,
  loadFeed,
  loadLikes,
  loadPeople,
  loadProfile,
  loadTopic,
  userTitle,
  viewerTitle,
} from "./views.ts";

/** Keeps reading and form widths comfortable on a wide window while filling a narrow one. */
const page = (content: Node): Node => div({ style: { width: "100%", maxWidth: 680, alignSelf: "center" } }, content);

export const router = createRouter(
  {
    "/": { view: () => page(Home()), title: "Home", onEndReached: loadFeed },
    "/compose": { view: () => page(Compose()), title: "New post" },
    "/topic/:name": { view: (params) => page(Topic(params)), title: (params) => `#${params.name ?? ""}`, onEndReached: loadTopic },
    "/explore": { view: () => page(Explore()), title: "Explore", onEndReached: loadPeople },
    "/alerts": { view: () => page(Alerts()), title: "Notifications", onEndReached: loadAlerts },
    "/me": { view: () => page(ProfileScreen({ id: "0" })), title: "Profile", onEndReached: () => loadProfile({ id: "0" }) },
    "/me/edit": { view: () => page(EditProfile()), title: "Edit profile" },
    "/me/settings": { view: () => page(Settings()), title: "Settings" },
    "/user/:id": { view: (params) => page(ProfileScreen(params)), title: userTitle, onEndReached: loadProfile },
    "/user/:id/friends": { view: (params) => page(Friends(params)), title: friendsTitle },
    "/post/:id": { view: (params) => page(ThreadScreen(params)), title: "Post" },
    "/post/:id/likes": { view: (params) => page(Likes(params)), title: "Liked by", onEndReached: loadLikes },
    "/media/:id/:index": { view: (params) => page(Viewer(params)), title: viewerTitle },
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

render(router.outlet);
