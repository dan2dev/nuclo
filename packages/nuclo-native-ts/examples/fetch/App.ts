/**
 * Network requests: text from example.org (it serves HTML only), typed JSON decoding, a JSON POST and a failing request.
 * Every request runs on the same code path on Android, iOS, Linux and the web.
 * On the web example.org fails with "Failed to fetch": it sends no CORS headers, which browsers require.
 */
import { type Style, button, div, h1, h2, list, p, render, small, update, fetch } from "../../src/index.ts";

interface Geo {
  lat: string;
  lng: string;
}
interface Address {
  city: string;
  zipcode: string;
  geo: Geo;
}
interface User {
  id: number;
  name: string;
  email: string;
  address: Address;
}
interface Created {
  id: number;
  title: string;
}

const API = "https://jsonplaceholder.typicode.com";

let page = "idle";
let users: User[] = [];
let usersState = "idle";
let created = "idle";
let failed = "idle";

const card: Style = { padding: 16, gap: 8, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" };

async function loadPage() {
  page = "loading…";
  update();
  try {
    const res = await fetch("https://example.org/");
    const html = await res.text();
    page = `HTTP ${res.status}, ${html.length} characters, ${html.includes("Example Domain") ? "has" : "lacks"} “Example Domain”`;
  } catch (e) {
    page = `error: ${e}`;
  }
  update();
}

async function loadUsers() {
  usersState = "loading";
  update();
  try {
    const res = await fetch(`${API}/users?_limit=5`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    users = await res.json<User[]>();
    usersState = "ready";
  } catch (e) {
    usersState = `error: ${e}`;
  }
  update();
}

async function createPost() {
  created = "sending…";
  update();
  try {
    const res = await fetch(`${API}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"title":"hello from nuclo","userId":1}',
    });
    const body = await res.json<Created>();
    created = `HTTP ${res.status}: id ${body.id}, “${body.title}”`;
  } catch (e) {
    created = `error: ${e}`;
  }
  update();
}

async function loadMissing() {
  failed = "loading…";
  update();
  try {
    const res = await fetch(`${API}/missing`);
    failed = res.ok ? "unexpected success" : `HTTP ${res.status} handled`;
  } catch (e) {
    failed = `error: ${e}`;
  }
  update();
}

const App = () =>
  div(
    { style: { padding: 24, gap: 16, backgroundColor: "#f8fafc" } },
    h1("Fetch"),
    div(
      { style: card },
      h2("Text · example.org"),
      p(() => page),
      button("Fetch page", { onClick: () => loadPage() }),
    ),
    div(
      { style: card },
      h2("JSON · typed decode"),
      p(() => (usersState === "ready" ? `${users.length} users` : usersState)),
      list(() => users, (user) => div(p(() => `${user.name} · ${user.email}`), small(() => `${user.address.city} (${user.address.geo.lat}, ${user.address.geo.lng})`))),
      button("Load users", { onClick: () => loadUsers() }),
    ),
    div(
      { style: card },
      h2("JSON · POST"),
      p(() => created),
      button("Create post", { onClick: () => createPost() }),
    ),
    div(
      { style: card },
      h2("Failure"),
      p(() => failed),
      button("Request a missing URL", { onClick: () => loadMissing() }),
    ),
  );

render(App);
