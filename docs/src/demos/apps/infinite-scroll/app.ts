// app.ts: the feed. Every page lands in the same plain array with push(), so
// the rows already on screen are left alone and only the new ones are built.
// The sentinel at the end creates its IntersectionObserver in on("mount"),
// returns the cleanup from the same place, and asks for the next page
// whenever it scrolls into view.
import "nuclo";
import { fetchPage, TOTAL, type Post } from "./api.ts";
import { s } from "./styles.ts";

let posts: Post[] = [];
let next: number | null = 0; // the cursor of the next page; null once the feed is complete
let loading = false;
let error: string | null = null;
let lookAgain = () => {}; // set by the sentinel: checks again whether it is in view

async function loadMore() {
  if (loading || error !== null || next === null) return;
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
  lookAgain(); // a short page can leave the sentinel in view: then load the next one too
}

function retry() {
  error = null;
  loadMore();
}

function startOver() {
  posts = [];
  next = 0;
  error = null;
  update();
  lookAgain();
}

const ago = (minutes: number) => (minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`);

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
        { root: el.parentElement, rootMargin: "240px" }, // start a page early, before the end is reached
      );
      observer.observe(el);
      lookAgain = () => { observer.unobserve(el); observer.observe(el); };
      return () => observer.disconnect();
    }),
    when(() => loading, Skeleton(), Skeleton(), Skeleton())
      .when(() => error !== null, div(s.error, span(() => error ?? ""), button(s.btn, "Retry", { onClick: retry })))
      .when(() => next === null, p(s.end, `That is all ${TOTAL} posts.`)),
  );
}

export function InfiniteFeed() {
  return div(
    s.app,
    header(
      s.head,
      strong(() => `${posts.length} of ${TOTAL} posts`),
      span(s.state, () => (next === null ? "complete" : loading ? "loading…" : error !== null ? "failed" : "scroll for more")),
      button(s.btn, "Start over", { disabled: () => loading, onClick: startOver }),
    ),
    div(s.feed, list(() => posts, PostView), Sentinel()),
  );
}
