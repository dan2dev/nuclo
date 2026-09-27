import { beforeEach, describe, expect, it } from "vitest";
import { applyHead, escapeHtml, headToHtml, mergeHead } from "../../src/shared/head";

describe("mergeHead", () => {
  it("lets later titles win and keeps earlier ones when later heads have none", () => {
    expect(mergeHead([{ title: "Site" }, { title: "Post" }]).title).toBe("Post");
    expect(mergeHead([{ title: "Site" }, { meta: { a: "1" } }]).title).toBe("Site");
  });

  it("merges meta by key and concatenates links", () => {
    const head = mergeHead([
      { meta: { description: "site", author: "me" }, link: [{ rel: "icon", href: "/a.png" }] },
      { meta: { description: "post" }, link: [{ rel: "canonical", href: "/p" }] },
    ]);
    expect(head.meta).toEqual({ description: "post", author: "me" });
    expect(head.link).toEqual([
      { rel: "icon", href: "/a.png" },
      { rel: "canonical", href: "/p" },
    ]);
  });

  it("skips missing heads", () => {
    expect(mergeHead([undefined, undefined])).toEqual({ meta: {}, link: [] });
    expect(mergeHead([])).toEqual({ meta: {}, link: [] });
  });

  it("does not mutate its inputs", () => {
    const first = { meta: { a: "1" }, link: [{ rel: "x", href: "y" }] };
    mergeHead([first, { meta: { a: "2" }, link: [{ rel: "z", href: "w" }] }]);
    expect(first).toEqual({ meta: { a: "1" }, link: [{ rel: "x", href: "y" }] });
  });
});

describe("headToHtml", () => {
  it("renders title, meta and links, marking managed tags", () => {
    expect(headToHtml({ title: "Hi", meta: { description: "d" }, link: [{ rel: "canonical", href: "/x" }] })).toBe(
      '<title>Hi</title><meta name="description" content="d" data-nuclo-head><link rel="canonical" href="/x" data-nuclo-head>',
    );
  });

  it("uses property= for Open Graph style keys and name= otherwise", () => {
    const html = headToHtml({ meta: { "og:title": "T", "article:author": "A", "twitter:card": "summary", viewport: "v" } });
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="article:author"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="viewport"');
  });

  it("escapes everything it interpolates", () => {
    const html = headToHtml({
      title: "</title><script>alert(1)</script>",
      meta: { 'x"><script>': '"&<>' },
      link: [{ href: '"><img src=x onerror=alert(1)>' }],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;/title&gt;&lt;script&gt;");
    expect(html).toContain('content="&quot;&amp;&lt;&gt;"');
  });

  it("omits the title when there is none", () => {
    expect(headToHtml({})).toBe("");
    expect(headToHtml({ title: "" })).toBe("<title></title>");
  });

  it("escapeHtml covers & < > \"", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;'");
  });
});

describe("applyHead", () => {
  beforeEach(() => {
    document.head.innerHTML = '<title>Start</title><meta name="keep" content="1"><link rel="stylesheet" href="/app.css">';
  });

  it("sets the title and replaces only managed tags", () => {
    applyHead({ title: "One", meta: { description: "first" }, link: [{ rel: "canonical", href: "/1" }] });
    expect(document.title).toBe("One");
    applyHead({ title: "Two", meta: { description: "second" } });
    expect(document.title).toBe("Two");
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("second");
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    // Tags from the template are never touched.
    expect(document.head.querySelector('meta[name="keep"]')).not.toBeNull();
    expect(document.head.querySelector('link[rel="stylesheet"]')).not.toBeNull();
  });

  it("keeps the current title when the head has none", () => {
    applyHead({ meta: { a: "b" } });
    expect(document.title).toBe("Start");
  });
});
