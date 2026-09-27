import type { Head } from "../../types/index";

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Merges heads root → leaf: the last title wins, meta merges by key, links concatenate. */
export function mergeHead(heads: readonly (Head | undefined | void)[]): Head {
  const merged: Head = { meta: {}, link: [] };
  for (const head of heads) {
    if (!head) continue;
    if (head.title !== undefined) merged.title = head.title;
    Object.assign(merged.meta!, head.meta);
    if (head.link) merged.link!.push(...head.link);
  }
  return merged;
}

const PROPERTY_META = /^(og|article|book|profile|music|video|fb):/;

/** Serializes a head. Managed tags carry `data-nuclo-head` so client navigation can replace them. */
export function headToHtml(head: Head): string {
  let html = head.title === undefined ? "" : `<title>${escapeHtml(head.title)}</title>`;
  for (const [key, content] of Object.entries(head.meta ?? {})) {
    html += `<meta ${PROPERTY_META.test(key) ? "property" : "name"}="${escapeHtml(key)}" content="${escapeHtml(content)}" data-nuclo-head>`;
  }
  for (const attrs of head.link ?? []) {
    const list = Object.entries(attrs).map(([name, value]) => `${name}="${escapeHtml(value)}"`);
    html += `<link ${list.join(" ")} data-nuclo-head>`;
  }
  return html;
}

/** Applies a head after client navigation. Without a title the current one is kept. */
export function applyHead(head: Head): void {
  if (head.title !== undefined) document.title = head.title;
  for (const el of document.head.querySelectorAll("[data-nuclo-head]")) el.remove();
  document.head.insertAdjacentHTML("beforeend", headToHtml({ meta: head.meta, link: head.link }));
}
