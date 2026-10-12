// The "/" key of the "/profile" section. It is both the /profile page and the
// layout around every child: the active child (person.ts) lands in outlet().
import type { PageProps, RouteContext } from "nuclo-router";
import { s } from "../../ui.ts";
import { router } from "../../routes.ts";

const PEOPLE = ["ana", "bruno", "carla"];

export default function ProfileLayout(_ctx: RouteContext, { outlet }: PageProps) {
  return div(
    s.panel,
    h1(s.h1, "Profiles"),
    nav(
      s.nav,
      ...PEOPLE.map((name) => a({ href: router.href(`/profile/${name}`) }, s.link, name)),
    ),
    outlet(),
  );
}
