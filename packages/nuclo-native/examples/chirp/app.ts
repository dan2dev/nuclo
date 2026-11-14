// Chirp: a small social app on a faked server (api.ts): 100,000 people and a million posts, loaded a page at a
// time as you scroll. Posts with photos and videos, topics, threads you can reply to, profiles and friends (a
// friend's profile lists their friends, so the stack goes as deep as you tap), a people search, and forms for a new
// post, your profile and the network the server answers on.
import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { color } from "../ui";
import { Compose, EditProfile, Settings } from "./forms";
import {
  Alerts,
  Explore,
  Friends,
  Home,
  Likes,
  Profile,
  Thread,
  Topic,
  Viewer,
  alerts,
  feed,
  friendsTitle,
  loadLikes,
  loadPeople,
  loadProfile,
  loadTopic,
  userTitle,
  viewerTitle,
} from "./views";

// Keep reading and form widths comfortable on desktop while filling compact screens.
const page = (content: NodeModLike<"div">) =>
  div({ style: { width: "100%", maxWidth: 680, alignSelf: "center" } }, content);

export const router = createRouter(
  {
    "/": { view: () => page(Home()), title: "Home", onEndReached: feed.load },
    "/compose": { view: () => page(Compose()), title: "New post" },
    "/topic/:name": { view: (params) => page(Topic(params)), title: ({ name }) => `#${name}`, onEndReached: loadTopic },
    "/explore": { view: () => page(Explore()), title: "Explore", onEndReached: loadPeople },
    "/alerts": { view: () => page(Alerts()), title: "Notifications", onEndReached: alerts.load },
    "/me": { view: () => page(Profile({ id: "0" })), title: "Profile", onEndReached: loadProfile },
    "/me/edit": { view: () => page(EditProfile()), title: "Edit profile" },
    "/me/settings": { view: () => page(Settings()), title: "Settings" },
    "/user/:id": { view: (params) => page(Profile(params)), title: userTitle, onEndReached: loadProfile },
    "/user/:id/friends": { view: (params) => page(Friends(params)), title: friendsTitle },
    "/post/:id": { view: (params) => page(Thread(params)), title: "Post" },
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

document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
