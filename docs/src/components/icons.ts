export function GitHubSvg(opts: { size?: number } = {}) {
  const size = opts.size ?? 16;
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "currentColor" },
    pathSvg({ d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" })
  );
}

export function MoonIcon() {
  return svgSvg(
    { width: "15", height: "15", viewBox: "0 0 24 24", fill: "currentColor" },
    pathSvg({ d: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" })
  );
}

export function SunIcon() {
  return svgSvg(
    { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" },
    circleSvg({ cx: "12", cy: "12", r: "5" }),
    lineSvg({ x1: "12", y1: "1", x2: "12", y2: "3" }),
    lineSvg({ x1: "12", y1: "21", x2: "12", y2: "23" }),
    lineSvg({ x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
    lineSvg({ x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
    lineSvg({ x1: "1", y1: "12", x2: "3", y2: "12" }),
    lineSvg({ x1: "21", y1: "12", x2: "23", y2: "12" }),
    lineSvg({ x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
    lineSvg({ x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" }),
  );
}

export function CheckIcon(opts: { size?: number } = {}) {
  const size = opts.size ?? 14;
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round" },
    polylineSvg({ points: "20 6 9 17 4 12" })
  );
}

export function ArrowIcon(opts: { size?: number } = {}) {
  const size = opts.size ?? 14;
  return svgSvg(
    { width: String(size), height: String(size), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" },
    lineSvg({ x1: "5", y1: "12", x2: "19", y2: "12" }),
    polylineSvg({ points: "12 5 19 12 12 19" })
  );
}
