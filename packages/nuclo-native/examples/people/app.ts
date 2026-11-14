// People: a social network's directory that loads the next page as you scroll near the end.
import "nuclo-native";
import { createRouter } from "nuclo-native/router";
import { color, muted, row } from "../ui";

interface Person {
  id: number;
  name: string;
  handle: string;
  bio: string;
  followers: number;
  following: boolean;
  tint: string;
}

const TOTAL = 50_000;
const PAGE = 20;

const firsts = "Ava Ben Chloe Diego Emma Felix Grace Hugo Iris Jonah Kira Leo Maya Noah Olive Pablo Quinn Rosa Sami Tara".split(" ");
const lasts = "Silva Kim Okafor Novak Haddad Larsen Moreau Tanaka Rossi Patel Weber Costa".split(" ");
const bios = [
  "Coffee, code and long walks.",
  "Film photographer. Mostly 35mm, sometimes medium format.",
  "Building tiny apps that do one thing well.",
  "Trail runner and amateur baker.",
  "Designing for humans since 2014.",
  "Plants, pixels and podcasts.",
  "Learning Japanese one kanji at a time.",
  "Weekend climber, weekday product manager.",
];
const tints = ["#4f46e5", "#0891b2", "#16a34a", "#ea580c", "#db2777", "#7c3aed", "#ca8a04", "#2563eb"];

// ponytail: generated in place of a request, since the bare engines have no fetch or timers. A fetch works the
// same: push the page when it resolves; onEndReached does not fire again until the content grows.
const fetchPeople = (from: number, count: number): Person[] =>
  Array.from({ length: Math.min(count, TOTAL - from) }, (_, k) => {
    const i = from + k;
    const first = firsts[i % firsts.length];
    const last = lasts[Math.floor(i / firsts.length) % lasts.length];
    // Names repeat every 240 people; handles stay unique.
    const round = Math.floor(i / (firsts.length * lasts.length));
    return {
      id: i,
      name: `${first} ${last}`,
      handle: `@${first}.${last}${round ? round + 1 : ""}`.toLowerCase(),
      bio: bios[(i * 3) % bios.length],
      followers: (i * 7919 + 1234) % 48_000,
      following: false,
      tint: tints[i % tints.length],
    };
  });

const people = fetchPeople(0, PAGE);
let following = 0;

// Rows are static: a follow swaps in a new person, and the keyed list rebuilds that one row. A reactive row would
// make every update() re-check every loaded row, which costs more with each page.
function toggleFollow(p: Person) {
  people[p.id] = { ...p, following: !p.following, followers: p.followers + (p.following ? -1 : 1) };
  following += p.following ? -1 : 1;
  update();
}

function loadMore() {
  if (people.length >= TOTAL) return;
  people.push(...fetchPeople(people.length, PAGE));
  update();
}

const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, ",");
const short = (n: number) => (n < 1000 ? String(n) : `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`);

const avatar = (p: Person) =>
  div(
    { style: { width: 44, height: 44, padding: 11, borderRadius: 22, backgroundColor: p.tint, alignItems: "center" } },
    span(p.name[0], { style: { color: "#ffffff", fontSize: 16, fontWeight: "bold" } }),
  );

const followButton = (p: Person) =>
  div(
    {
      style: {
        width: 96,
        padding: 8,
        borderRadius: 16,
        alignItems: "center",
        backgroundColor: p.following ? color.accentSoft : color.accent,
      },
      onClick: () => toggleFollow(p),
    },
    span(p.following ? "Following" : "Follow", {
      style: { color: p.following ? color.accent : "#ffffff", fontSize: 13, fontWeight: "bold" },
    }),
  );

const personRow = (p: Person) =>
  div(
    { style: { ...row, gap: 12, backgroundColor: color.card, borderRadius: 14, padding: 12 } },
    avatar(p),
    div(
      { style: { flex: 1, gap: 2 } },
      span(p.name, { style: { color: color.text, fontSize: 15, fontWeight: "bold" } }),
      muted(`${p.handle} · ${short(p.followers)} followers`, 12),
      muted(p.bio),
    ),
    followButton(p),
  );

const People = () =>
  div(
    { style: { padding: 16, gap: 8 } },
    muted(() => `Showing ${grouped(people.length)} of ${grouped(TOTAL)} · following ${following}`),
    list(() => people, personRow),
    div(
      { style: { padding: 16, alignItems: "center" } },
      muted(() => (people.length < TOTAL ? "Loading more…" : `That's everyone: ${grouped(TOTAL)} people.`)),
    ),
  );

export const router = createRouter({
  "/": { view: People, title: "People", onEndReached: loadMore },
});

document.body.style.backgroundColor = color.page;
render(router.outlet, document.body);
