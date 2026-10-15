// app.ts: the feed. Every page lands in the same plain array with push(), but
// only the rows near the viewport are in the DOM: the list() renders
// posts.slice(start, end), and two spacers stand in for everything above and
// below. Rows have one fixed height, so start and end are arithmetic on the
// scroll position. A row that scrolls away is dropped; its post object keeps
// its likes, and the same object gets a fresh row when it comes back.
// The sentinel at the real end asks for the next page before it comes into view.
import "nuclo";
import { fetchPage, type Post } from "./api.ts";
import { s } from "./styles.ts";

const ROW = 120; // px: every row is this tall, margin included
const OVERSCAN = 4; // rows rendered beyond each edge of the viewport

let posts: Post[] = [];
let next = 0; // the cursor of the next page
let loading = false;
let error: string | null = null;
let scrollTop = 0;
let viewport = 0; // the feed's visible height
let lookAgain: (() => void) | null = null; // set by the mounted sentinel: checks again whether it is in view

const start = () => Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN);
const end = () => Math.min(posts.length, Math.ceil((scrollTop + viewport) / ROW) + OVERSCAN);

async function loadMore() {
  if (loading || error !== null) return;
  loading = true;
  update();
  try {
    const page = await fetchPage(next);
    posts.push(...page.items);
    next = page.next;
  } catch (e) {
    error = (e as Error).message;
  }
  loading = false;
  update();
  lookAgain?.(); // a short page can leave the sentinel in view: then load the next one too
}

function retry() {
  error = null;
  loadMore();
}

function startOver() {
  posts = [];
  next = 0;
  error = null;
  scrollTop = 0;
  update();
  lookAgain?.();
}

const ago = (m: number) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`);

function PostView(post: Post) {
  return article(
    s.post,
    div(s.avatar, { style: { backgroundColor: `hsl(${(post.id * 47) % 360} 55% 48%)` } }, post.author[0]),
    div(
      s.body,
      div(s.meta, strong(post.author), span(ago(post.minutesAgo)), span(s.id, `#${post.id + 1}`)),
      p(post.text),
      button(
        s.like,
        { class: () => cx(s.like, post.liked ? s.liked : null).className, "aria-pressed": () => String(post.liked) },
        "♥ ",
        () => String(post.likes),
        { onClick: () => { post.liked = !post.liked; post.likes += post.liked ? 1 : -1; update(); } },
      ),
    ),
  );
}

const Skeleton = () => div(s.skeleton, div(s.bone, s.boneAvatar), div(s.boneLines, div(s.bone), div(s.bone, s.boneShort)));

function Sentinel() {
  return div(
    s.sentinel,
    on("mount", (el) => {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) loadMore(); },
        { root: el.parentElement, rootMargin: "800px" }, // start the next page well before the end is reached
      );
      observer.observe(el);
      lookAgain = () => { observer.unobserve(el); observer.observe(el); };
      return () => { observer.disconnect(); lookAgain = null; }; // left set, it would keep this element alive
    }),
    when(() => loading, Skeleton(), Skeleton(), Skeleton())
      .when(() => error !== null, div(s.error, span(() => error ?? ""), button(s.btn, "Retry", { onClick: retry }))),
  );
}

export function InfiniteFeed() {
  return div(
    s.app,
    header(
      s.head,
      strong(() => `${posts.length} posts`),
      span(s.state, () => `${end() - start()} rows in the DOM · ${loading ? "loading…" : error !== null ? "failed" : "scroll, it never ends"}`),
      button(s.btn, "Start over", { disabled: () => loading, onClick: startOver }),
    ),
    div(
      s.feed,
      on("mount", (el) => {
        // The state outlives the element: a feed built again (the page was left
        // and reopened) resumes where it was, instead of windowing for a scroll
        // position its new element does not have.
        el.scrollTop = scrollTop;
        scrollTop = el.scrollTop;
        const sizes = new ResizeObserver(() => { viewport = el.clientHeight; update(); });
        sizes.observe(el);
        return () => sizes.disconnect();
      }),
      { onScroll: (e) => { scrollTop = e.currentTarget.scrollTop; update(); } },
      div({ style: () => ({ height: `${start() * ROW}px` }) }),
      list(() => posts.slice(start(), end()), PostView),
      div({ style: () => ({ height: `${(posts.length - end()) * ROW}px` }) }),
      Sentinel(),
    ),
  );
}
