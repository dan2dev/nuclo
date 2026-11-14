/**
 * Every nuclo feature in one app, compiled to Swift and Kotlin by `nuclo-native-ts build`.
 *
 *   Home   counter with update(), scoped update('cart'), variants(), onMount/onDestroy timer
 *   Todos  list() with add / toggle / filter / delete, a confirm modal via into('modal'), toasts
 *   Feed   async fetch with loading / error / data branches of when(), push to a detail screen
 */
import {
  type Params,
  type Style,
  button,
  clearInterval,
  console,
  createRouter,
  css,
  cx,
  delay,
  div,
  fetch,
  h2,
  h3,
  input,
  into,
  list,
  p,
  region,
  render,
  scope,
  setInterval,
  setTimeout,
  small,
  span,
  strong,
  update,
  variants,
  when,
} from "../../src/index.ts";

// ---------------------------------------------------------------------------
// State: plain variables, arrays and objects, mutated freely, then update().
// ---------------------------------------------------------------------------

interface Todo {
  id: number;
  title: string;
  done: boolean;
  notes?: string;
}

interface Toast {
  id: number;
  text: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

type Filter = "all" | "active" | "done";
type LoadState = "idle" | "loading" | "error" | "ready";

let count = 0;
let cartItems = 0;
let seconds = 0;
let showClock = true;

let nextId = 3;
let draft = "";
let filter: Filter = "all";
const todos: Todo[] = [
  { id: 1, title: "Write the app in TypeScript", done: true },
  { id: 2, title: "Ship it as Swift and Kotlin", done: false, notes: "No JS engine in the bundle." },
];
let confirming: Todo | null = null;
const toasts: Toast[] = [];

let feedState: LoadState = "idle";
let feedError = "";
let posts: Post[] = [];
let progress = 0;

// ---------------------------------------------------------------------------
// Styles: inline Style objects, css() classes and a typed variants() recipe.
// ---------------------------------------------------------------------------

const screen: Style = { padding: 20, gap: 16, backgroundColor: "#f8fafc" };
const row: Style = { flexDirection: "row", alignItems: "center", gap: 8 };

const card = css({
  padding: 16,
  gap: 10,
  backgroundColor: "#ffffff",
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#e2e8f0",
});
const muted = css({ color: "#64748b", fontSize: 13 });
const title = css({ fontSize: 15, fontWeight: "bold", color: "#0f172a" });

const btn = variants({
  base: { paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderRadius: 10, fontWeight: "bold" },
  variants: {
    intent: {
      primary: { backgroundColor: "#4f46e5", color: "#ffffff" },
      ghost: { backgroundColor: "#eef2ff", color: "#4338ca" },
      danger: { backgroundColor: "#fee2e2", color: "#b91c1c" },
    },
    size: {
      sm: { fontSize: 13 },
      lg: { fontSize: 17, paddingTop: 14, paddingBottom: 14 },
    },
    block: {
      true: { flex: 1 },
    },
  },
  defaultVariants: { intent: "primary", size: "sm" },
  compoundVariants: [{ intent: "danger", size: "lg", css: { borderWidth: 2, borderColor: "#b91c1c" } }],
});

const chip = variants({
  base: { paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12, borderRadius: 999, fontSize: 13 },
  variants: {
    active: {
      true: { backgroundColor: "#0f172a", color: "#ffffff" },
      false: { backgroundColor: "#e2e8f0", color: "#334155" },
    },
  },
});

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

function toast(text: string) {
  nextId += 1;
  const item: Toast = { id: nextId, text };
  toasts.push(item);
  update();
  setTimeout(() => {
    const index = toasts.indexOf(item);
    if (index >= 0) toasts.splice(index, 1);
    update();
  }, 2500);
}

function addTodo() {
  const text = draft.trim();
  if (text.length === 0) return;
  nextId += 1;
  todos.push({ id: nextId, title: text, done: false });
  draft = "";
  toast(`Added “${text}”`);
}

function visibleTodos(): Todo[] {
  return todos.filter((todo) => filter === "all" || (filter === "done" ? todo.done : !todo.done));
}

function remaining(): number {
  return todos.filter((todo) => !todo.done).length;
}

function deleteConfirmed() {
  const todo = confirming;
  if (todo !== null) {
    todos.splice(todos.indexOf(todo), 1);
    toast(`Deleted “${todo.title}”`);
  }
  confirming = null;
  update();
}

async function loadPosts(fail: boolean) {
  feedState = "loading";
  progress = 0;
  update();
  try {
    for (let step = 1; step <= 4; step++) {
      await delay(120);
      progress = step / 4;
      update("feed-progress");
    }
    const url = fail ? "https://jsonplaceholder.typicode.com/missing" : "https://jsonplaceholder.typicode.com/posts?_limit=12";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    posts = await res.json<Post[]>();
    feedState = "ready";
  } catch (e) {
    feedError = String(e);
    feedState = "error";
  }
  update();
}

// ---------------------------------------------------------------------------
// Home: update(), scope(), variants(), lifecycle
// ---------------------------------------------------------------------------

const LiveClock = () =>
  p(() => `Mounted ${seconds}s ago`, title, {
    onMount: () => {
      seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        update();
      }, 1000);
      return () => clearInterval(timer);
    },
    onDestroy: () => console.log("Clock destroyed, interval cleared"),
  });

const Home = () =>
  div(
    { style: screen },
    div(
      card,
      h2("Counter"),
      p(() => `Count: ${count}`, {
        style: () => ({ fontSize: 30, fontWeight: "bold", color: count < 0 ? "#dc2626" : "#16a34a" }),
      }),
      div(
        { style: row },
        button("−", btn({ intent: "ghost", block: true }), {
          onClick: () => {
            count--;
            update();
          },
        }),
        button("+", btn({ block: true }), {
          onClick: () => {
            count++;
            update();
          },
        }),
        button("Reset", btn({ intent: "danger" }), {
          disabled: () => count === 0,
          onClick: () => {
            count = 0;
            update();
          },
        }),
      ),
      small(() => (count % 2 === 0 ? "Even" : "Odd"), muted),
    ),
    div(
      card,
      h2("Scoped updates"),
      div(
        scope("cart"),
        { style: { gap: 6 } },
        p(() => `In scope "cart": ${cartItems} items`, title),
        button("Add to cart · update('cart')", btn({ intent: "ghost" }), {
          onClick: () => {
            cartItems++;
            update("cart");
          },
        }),
      ),
      small(() => `Outside the scope: ${cartItems} items (waits for a global update)`, muted),
    ),
    div(
      card,
      h2("Lifecycle"),
      button(() => (showClock ? "Destroy clock" : "Mount clock"), btn({ intent: "ghost" }), {
        onClick: () => {
          showClock = !showClock;
          update();
        },
      }),
      when(() => showClock, LiveClock()).else(small("The clock's onDestroy ran and its interval was cleared.", muted)),
    ),
    div(
      card,
      h2("Variants"),
      div({ style: row }, button("Small", btn({ size: "sm" })), button("Large", btn({ size: "lg", intent: "ghost" }))),
      button("Large danger (compound)", btn({ intent: "danger", size: "lg" })),
    ),
  );

// ---------------------------------------------------------------------------
// Todos: list(), into() modal, toasts, a pushed detail screen
// ---------------------------------------------------------------------------

const FilterChip = (value: Filter, text: string) =>
  button(text, {
    className: () => chip({ active: filter === value }),
    onClick: () => {
      filter = value;
      update();
    },
  });

const TodoRow = (todo: Todo) =>
  div(
    card,
    { style: { flexDirection: "row", alignItems: "center", gap: 10 } },
    input({
      type: "checkbox",
      checked: () => todo.done,
      onChange: (e) => {
        todo.done = e.target.checked;
        update();
      },
    }),
    span(() => todo.title, {
      style: () => ({ flex: 1, color: todo.done ? "#94a3b8" : "#0f172a" }),
    }),
    button("Edit", btn({ intent: "ghost" }), { onClick: () => router.go(`/todos/${todo.id}`) }),
    button("✕", btn({ intent: "danger" }), {
      onClick: () => {
        confirming = todo;
        update();
      },
    }),
  );

const ConfirmDialog = () =>
  div(
    {
      style: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "#0f172a88",
        justifyContent: "center",
        padding: 24,
      },
    },
    div(
      card,
      h3("Delete this todo?"),
      p(() => confirming?.title ?? "", muted),
      div(
        { style: row },
        button("Cancel", btn({ intent: "ghost", block: true }), {
          onClick: () => {
            confirming = null;
            update();
          },
        }),
        button("Delete", btn({ intent: "danger", block: true }), { onClick: deleteConfirmed }),
      ),
    ),
  );

const Todos = () =>
  div(
    { style: screen },
    div(
      { style: row },
      input({
        placeholder: "What needs doing?",
        value: () => draft,
        style: { flex: 1, padding: 10, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, backgroundColor: "#ffffff" },
        onInput: (e) => {
          draft = e.target.value;
          update();
        },
        onChange: addTodo,
      }),
      button("Add", btn(), { disabled: () => draft.trim().length === 0, onClick: addTodo }),
    ),
    div({ style: row }, FilterChip("all", "All"), FilterChip("active", "Active"), FilterChip("done", "Done")),
    when(() => visibleTodos().length > 0, list(visibleTodos, (todo) => TodoRow(todo))).else(
      p("Nothing here.", muted, { style: { textAlign: "center", padding: 24 } }),
    ),
    small(() => `${remaining()} of ${todos.length} left`, muted),
    when(() => confirming !== null, into("modal", ConfirmDialog())),
  );

const TodoDetail = (params: Params) => {
  const todo = todos.find((item) => String(item.id) === params.id);
  if (todo === undefined) return div({ style: screen }, p("This todo no longer exists."));
  return div(
    { style: screen },
    div(
      card,
      h3(() => todo.title),
      input({
        value: () => todo.title,
        style: { padding: 10, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10 },
        onInput: (e) => {
          todo.title = e.target.value;
          update();
        },
      }),
      p(() => todo.notes ?? "No notes.", muted),
      div(
        { style: row },
        span("Done", { style: { flex: 1 } }),
        input({
          type: "checkbox",
          checked: () => todo.done,
          onChange: (e) => {
            todo.done = e.target.checked;
            update();
          },
        }),
      ),
      button("Back to the list", btn({ intent: "ghost" }), { onClick: () => router.back() }),
    ),
  );
};

// ---------------------------------------------------------------------------
// Feed: async/await with when() branches for loading, error and data
// ---------------------------------------------------------------------------

const ProgressBar = () =>
  div(
    scope("feed-progress"),
    { style: { height: 6, borderRadius: 3, backgroundColor: "#e2e8f0", flexDirection: "row" } },
    div({ style: () => ({ flex: progress, borderRadius: 3, backgroundColor: "#4f46e5" }) }),
    div({ style: () => ({ flex: 1 - progress }) }),
  );

const PostCard = (post: Post) =>
  div(
    card,
    { onClick: () => router.go(`/feed/${post.id}`) },
    strong(post.title, title),
    p(post.body, muted),
  );

const Feed = () =>
  div(
    {
      style: screen,
      onMount: () => {
        if (feedState === "idle") loadPosts(false);
      },
    },
    div(
      { style: row },
      button("Reload", btn({ block: true }), { onClick: () => loadPosts(false) }),
      button("Simulate error", btn({ intent: "danger", block: true }), { onClick: () => loadPosts(true) }),
    ),
    when(() => feedState === "loading", div(card, p("Loading posts…", muted), ProgressBar()))
      .when(
        () => feedState === "error",
        div(
          card,
          strong("Could not load the feed", title),
          p(() => feedError, muted),
          button("Retry", btn(), { onClick: () => loadPosts(false) }),
        ),
      )
      .when(() => feedState === "ready", list(() => posts, (post) => PostCard(post)))
      .else(p("Nothing loaded yet.", muted)),
  );

const PostDetail = (params: Params) => {
  const post = posts.find((item) => String(item.id) === params.id);
  if (post === undefined) return div({ style: screen }, p("Post not found."));
  return div({ style: screen }, div(card, h2(post.title), p(post.body), small(`Post ${post.id} by user ${post.userId}`, muted)));
};

// ---------------------------------------------------------------------------
// Navigation, overlay and start
// ---------------------------------------------------------------------------

const router = createRouter(
  {
    "/": { view: Home, title: "nuclo-native-ts" },
    "/todos": { view: Todos, title: "Todos" },
    "/todos/:id": { view: TodoDetail, title: (params) => `Todo #${params.id}` },
    "/feed": { view: Feed, title: "Feed" },
    "/feed/:id": PostDetail,
  },
  {
    tabs: [
      { path: "/", title: "Home", icon: "home" },
      { path: "/todos", title: "Todos", icon: "list" },
      { path: "/feed", title: "Feed", icon: "cloud" },
    ],
  },
);

const toastStyle = cx(card, css({ backgroundColor: "#0f172a", borderColor: "#0f172a" }));

/** A layer over the navigation: the modal region, and toasts at the bottom. */
const Overlay = () =>
  div(
    { style: { justifyContent: "flex-end", padding: 16, paddingBottom: 96, gap: 8 } },
    region({ id: "modal" }),
    list(
      () => toasts,
      (item) => div(toastStyle, span(item.text, { style: { color: "#ffffff", fontWeight: "bold" } })),
    ),
  );

render(router.outlet);
render(Overlay);
