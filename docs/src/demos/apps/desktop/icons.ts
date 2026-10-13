import "nuclo";

// One small stroke icon family, shared by the launcher, windows and file browser.
const paths: Record<string, string> = {
  files: "M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  notes: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8M8 17h5",
  calculator: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM8 7h8M8 12h1m6 0h1M8 16h1m6 0h1",
  timer: "M9 2h6m-3 0v3m6 1 2-2M12 9v5l3 2M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z",
  terminal: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3 4 4 4-4 4m6 0h4",
  kanban: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM9 5v14m6-14v14",
  calendar: "M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1ZM8 4v4m8-4v4M3 11h18",
  finance: "M3 3v18h18M8 17V9m4 8V5m4 12v-6",
  settings: "M12 3v3m0 12v3M3 12h3m12 0h3M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  about: "M12 11v6m0-10v.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
  grid: "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  back: "m14 5-7 7 7 7", forward: "m10 5 7 7-7 7", up: "m5 14 7-7 7 7", search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6",
  close: "m6 6 12 12M6 18 18 6", minimize: "M5 12h14", maximize: "M5 5h14v14H5Z", restore: "M8 3h13v13M3 8h13v13H3Z",
};
export function icon(name: string, size = 20) {
  return svgSvg({ viewBox: "0 0 24 24", width: size, height: size, fill: "none", stroke: "currentColor", "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", style: { flexShrink: "0" } }, pathSvg({ d: paths[name] ?? paths.notes }));
}
