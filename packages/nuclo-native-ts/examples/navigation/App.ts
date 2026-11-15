/**
 * Navigation with the platform's own stacks, tabs and sheets.
 *
 *   Tabs      three stacks, each keeping its screens while another tab is shown
 *   Push      /albums/:id and /albums/:id/tracks/:track take their params from the path
 *   Modal     /player is presented as a sheet over everything, without a navigation bar
 *   replace   the next track replaces the current screen instead of stacking on it
 *   reset     "Library" returns to the first tab's root from anywhere
 *
 * On the web the address is the URL fragment, so a screen can be opened, reloaded and shared.
 */
import { type Params, type Style, createRouter, css, div, h1, h2, input, list, p, render, small, span, strong, update } from "../../src/index.ts";

interface Album {
  id: number;
  title: string;
  artist: string;
  year: number;
  color: string;
  tracks: string[];
}

const albums: Album[] = [
  { id: 1, title: "Blue Hours", artist: "Mira Lowe", year: 2021, color: "#4f46e5", tracks: ["Dawn", "Ferry", "Glasshouse", "Blue Hours", "Last Train"] },
  { id: 2, title: "Salt & Signal", artist: "The Tidewaters", year: 2019, color: "#0d9488", tracks: ["Low Tide", "Signal Fire", "Harbour Lights", "Driftwood"] },
  { id: 3, title: "Paper Cities", artist: "Okafor", year: 2023, color: "#db2777", tracks: ["Blueprint", "Night Bus", "Paper Cities", "Rooftops", "Open Late", "Home"] },
  { id: 4, title: "Slow Machines", artist: "Ansel & June", year: 2017, color: "#ea580c", tracks: ["Warm Up", "Slow Machines", "Copper", "Idle"] },
];

let query = "";
let playingAlbum = 1;
let playingTrack = 0;
let paused = false;

function albumOf(id: string): Album | null {
  return albums.find((album) => String(album.id) === id) ?? null;
}

function matches(): Album[] {
  const needle = query.trim().toLowerCase();
  return albums.filter((album) => needle.length === 0 || album.title.toLowerCase().includes(needle) || album.artist.toLowerCase().includes(needle));
}

const screen: Style = { padding: 20, gap: 14, backgroundColor: "#f8fafc" };
const muted = css({ color: "#64748b", fontSize: 13 });
const rowCard = css({ flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0", pressed: { backgroundColor: "#eef2ff" } });
const primary = css({ padding: 14, borderRadius: 14, backgroundColor: "#4f46e5", alignItems: "center", pressed: { opacity: 0.7 } });
const secondary = css({ padding: 14, borderRadius: 14, backgroundColor: "#e0e7ff", alignItems: "center", pressed: { opacity: 0.7 } });

const Cover = (album: Album, size: number) =>
  div({ style: { width: size, height: size, borderRadius: size / 5, backgroundColor: album.color, alignItems: "center", justifyContent: "center" } }, span("♪", { style: { color: "#ffffff", fontSize: size / 2.4 } }));

const AlbumRow = (album: Album) =>
  div(
    rowCard,
    { onClick: () => router.go(`/albums/${album.id}`) },
    Cover(album, 56),
    div({ style: { flex: 1, gap: 2 } }, strong(album.title), small(`${album.artist} · ${album.year}`, muted)),
    span("›", { style: { fontSize: 22, color: "#94a3b8" } }),
  );

const Library = () => div({ style: screen }, h1("Library", { style: { fontSize: 28 } }), list(() => albums, (album) => AlbumRow(album)));

const AlbumScreen = (params: Params) => {
  const album = albumOf(params.id ?? "");
  if (album === null) return div({ style: screen }, p("This album is not in the library."));
  return div(
    { style: screen },
    div({ style: { alignItems: "center", gap: 10, paddingTop: 8 } }, Cover(album, 160), h2(album.title), small(`${album.artist} · ${album.year}`, muted)),
    list(
      () => album.tracks,
      (track, index) =>
        div(
          rowCard,
          { onClick: () => router.go(`/albums/${album.id}/tracks/${index}`) },
          span(`${index + 1}`, { style: { width: 24, color: "#94a3b8", textAlign: "center" } }),
          span(track, { style: { flex: 1 } }),
          span("›", { style: { fontSize: 22, color: "#94a3b8" } }),
        ),
    ),
  );
};

const TrackScreen = (params: Params) => {
  const album = albumOf(params.id ?? "");
  const index = parseInt(params.track ?? "0");
  if (album === null) return div({ style: screen }, p("This track is not in the library."));
  const next = (index + 1) % album.tracks.length;
  return div(
    { style: screen },
    div({ style: { alignItems: "center", gap: 10, paddingTop: 8 } }, Cover(album, 120), h2(album.tracks[index] ?? "Unknown track"), small(`${album.title} · track ${index + 1} of ${album.tracks.length}`, muted)),
    div(
      primary,
      {
        onClick: () => {
          playingAlbum = album.id;
          playingTrack = index;
          paused = false;
          router.go("/player");
        },
      },
      span("Play", { style: { color: "#ffffff", fontWeight: "bold" } }),
    ),
    div(secondary, { onClick: () => router.replace(`/albums/${album.id}/tracks/${next}`) }, span("Next track (replace)", { style: { color: "#3730a3", fontWeight: "bold" } })),
    div(secondary, { onClick: () => router.back() }, span("Back to the album", { style: { color: "#3730a3", fontWeight: "bold" } })),
    div(secondary, { onClick: () => router.reset("/") }, span("Library (reset)", { style: { color: "#3730a3", fontWeight: "bold" } })),
    small(() => `You are at ${router.path}`, muted, { style: { textAlign: "center" } }),
  );
};

/** A sheet: presented over the tabs, dismissed by back(). */
const Player = () => {
  const album = albums.find((item) => item.id === playingAlbum) ?? albums[0]!;
  return div(
    { style: { flex: 1, padding: 24, gap: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" } },
    div({ style: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#475569" } }),
    Cover(album, 220),
    h2(() => album.tracks[playingTrack] ?? "", { style: { color: "#ffffff" } }),
    small(album.artist, { style: { color: "#94a3b8" } }),
    div(
      { style: { flexDirection: "row", gap: 12 } },
      div(
        secondary,
        { style: { width: 120 }, onClick: () => { paused = !paused; update(); } },
        span(() => (paused ? "Resume" : "Pause"), { style: { color: "#3730a3", fontWeight: "bold" } }),
      ),
      div(
        secondary,
        { style: { width: 120 }, onClick: () => { playingTrack = (playingTrack + 1) % album.tracks.length; update(); } },
        span("Next", { style: { color: "#3730a3", fontWeight: "bold" } }),
      ),
    ),
    div(primary, { style: { width: 252 }, onClick: () => router.back() }, span("Close", { style: { color: "#ffffff", fontWeight: "bold" } })),
  );
};

const Search = () =>
  div(
    { style: screen },
    input({
      placeholder: "Albums and artists",
      value: () => query,
      style: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#ffffff", focused: { borderColor: "#4f46e5" } },
      onInput: (e) => {
        query = e.target.value;
        update();
      },
    }),
    small(() => `${matches().length} of ${albums.length} albums`, muted),
    list(matches, (album) => AlbumRow(album)),
  );

const Profile = () =>
  div(
    { style: screen },
    h1("Profile", { style: { fontSize: 28 } }),
    p(() => `Now playing: ${albums.find((item) => item.id === playingAlbum)?.title ?? "nothing"}`, muted),
    div(primary, { onClick: () => router.go("/player") }, span("Open the player", { style: { color: "#ffffff", fontWeight: "bold" } })),
    div(secondary, { onClick: () => router.reset("/albums/3") }, span("Jump to “Paper Cities”", { style: { color: "#3730a3", fontWeight: "bold" } })),
  );

const router = createRouter(
  {
    "/": { view: Library, title: "Library" },
    "/albums/:id": { view: AlbumScreen, title: (params) => albumOf(params.id ?? "")?.title ?? "Album" },
    "/albums/:id/tracks/:track": { view: TrackScreen, title: "Track" },
    "/search": { view: Search, title: "Search" },
    "/profile": { view: Profile, title: "Profile" },
    "/player": { view: Player, presentation: "modal", header: false },
  },
  {
    tabs: [
      { path: "/", title: "Library", icon: "home" },
      { path: "/search", title: "Search", icon: "search" },
      { path: "/profile", title: "Profile", icon: "person" },
    ],
  },
);

render(router.outlet);
