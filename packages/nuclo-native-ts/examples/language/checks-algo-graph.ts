// Algorithms corpus: graphs (BFS, DFS, Dijkstra with a binary heap, A*, topological sort, union-find, MST, cycles).

type Graph = Map<string, string[]>;

function buildGraph(edges: [string, string][], directed = false): Graph {
  const g: Graph = new Map();
  for (const [a, b] of edges) {
    if (!g.has(a)) g.set(a, []);
    if (!g.has(b)) g.set(b, []);
    g.get(a)!.push(b);
    if (!directed) g.get(b)!.push(a);
  }
  return g;
}

function bfs(g: Graph, start: string): { order: string[]; dist: Map<string, number> } {
  const dist = new Map<string, number>([[start, 0]]);
  const order: string[] = [];
  const queue: string[] = [start];
  let head = 0;
  while (head < queue.length) {
    const node = queue[head++]!;
    order.push(node);
    for (const next of g.get(node) ?? []) {
      if (dist.has(next)) continue;
      dist.set(next, dist.get(node)! + 1);
      queue.push(next);
    }
  }
  return { order, dist };
}

function dfsRecursive(g: Graph, start: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const visit = (n: string): void => {
    if (seen.has(n)) return;
    seen.add(n);
    out.push(n);
    for (const m of g.get(n) ?? []) visit(m);
  };
  visit(start);
  return out;
}

function dfsIterative(g: Graph, start: string): string[] {
  const seen = new Set<string>();
  const stack = [start];
  const out: string[] = [];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
    const neighbors = g.get(n) ?? [];
    for (let i = neighbors.length - 1; i >= 0; i--) if (!seen.has(neighbors[i]!)) stack.push(neighbors[i]!);
  }
  return out;
}

function shortestPath(g: Graph, from: string, to: string): string[] | null {
  const prev = new Map<string, string>();
  const seen = new Set([from]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) {
      const path = [to];
      let at = to;
      while (prev.has(at)) {
        at = prev.get(at)!;
        path.unshift(at);
      }
      return path;
    }
    for (const nb of g.get(cur) ?? []) {
      if (!seen.has(nb)) {
        seen.add(nb);
        prev.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  return null;
}

function components(g: Graph): string[][] {
  const seen = new Set<string>();
  const result: string[][] = [];
  for (const node of [...g.keys()].sort()) {
    if (seen.has(node)) continue;
    const comp = dfsIterative(g, node);
    comp.forEach((n) => seen.add(n));
    result.push(comp.sort());
  }
  return result;
}

export function traversals(): string[] {
  const g = buildGraph([
    ["a", "b"], ["a", "c"], ["b", "d"], ["c", "d"], ["d", "e"], ["f", "g"], ["e", "h"], ["c", "h"],
  ]);
  const { order, dist } = bfs(g, "a");
  const path = shortestPath(g, "a", "h");
  const none = shortestPath(g, "a", "g");
  return [
    `bfs ${order.join(" ")}`,
    `dist ${[...dist].map(([k, v]) => `${k}=${v}`).join(" ")}`,
    `dfs rec ${dfsRecursive(g, "a").join(" ")}`,
    `dfs iter ${dfsIterative(g, "a").join(" ")}`,
    `path ${path?.join("->") ?? "none"} / ${none?.join("->") ?? "none"}`,
    `components ${components(g).map((c) => `{${c.join(",")}}`).join(" ")}`,
    `degrees ${[...g.entries()].map(([k, v]) => `${k}:${v.length}`).join(" ")}`,
  ];
}

// ───── Weighted graphs: binary heap, Dijkstra, A*, Prim ─────

class MinHeap<T> {
  private items: T[] = [];
  constructor(private readonly less: (a: T, b: T) => boolean) {}

  get size(): number {
    return this.items.length;
  }

  push(item: T): void {
    const a = this.items;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(a[i]!, a[parent]!)) break;
      [a[i], a[parent]] = [a[parent]!, a[i]!];
      i = parent;
    }
  }

  pop(): T | undefined {
    const a = this.items;
    if (a.length === 0) return undefined;
    const top = a[0]!;
    const last = a.pop()!;
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.less(a[l]!, a[m]!)) m = l;
        if (r < a.length && this.less(a[r]!, a[m]!)) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m]!, a[i]!];
        i = m;
      }
    }
    return top;
  }
}

interface Edge {
  to: number;
  w: number;
}

interface QueueEntry {
  node: number;
  dist: number;
}

function dijkstra(adj: Edge[][], source: number): { dist: number[]; prev: number[] } {
  const dist = new Array<number>(adj.length).fill(Infinity);
  const prev = new Array<number>(adj.length).fill(-1);
  dist[source] = 0;
  const pq = new MinHeap<QueueEntry>((a, b) => a.dist < b.dist);
  pq.push({ node: source, dist: 0 });
  while (pq.size > 0) {
    const { node, dist: d } = pq.pop()!;
    if (d > dist[node]!) continue;
    for (const { to, w } of adj[node]!) {
      const nd = d + w;
      if (nd < dist[to]!) {
        dist[to] = nd;
        prev[to] = node;
        pq.push({ node: to, dist: nd });
      }
    }
  }
  return { dist, prev };
}

function pathTo(prev: number[], target: number): number[] {
  const path: number[] = [];
  for (let at = target; at !== -1; at = prev[at]!) path.push(at);
  return path.reverse();
}

function prim(adj: Edge[][]): number {
  const inTree = new Array<boolean>(adj.length).fill(false);
  const pq = new MinHeap<[number, number]>((a, b) => a[0] < b[0]);
  pq.push([0, 0]);
  let total = 0;
  let taken = 0;
  while (pq.size && taken < adj.length) {
    const [w, v] = pq.pop()!;
    if (inTree[v]) continue;
    inTree[v] = true;
    total += w;
    taken++;
    for (const e of adj[v]!) if (!inTree[e.to]) pq.push([e.w, e.to]);
  }
  return total;
}

type Point = { x: number; y: number };

function aStar(grid: string[], start: Point, goal: Point): number {
  const h = (p: Point) => Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
  const key = (p: Point) => `${p.x},${p.y}`;
  const g = new Map<string, number>([[key(start), 0]]);
  const open = new MinHeap<{ p: Point; f: number }>((a, b) => a.f < b.f);
  open.push({ p: start, f: h(start) });
  const closed = new Set<string>();
  const dirs: Point[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  while (open.size) {
    const { p } = open.pop()!;
    const k = key(p);
    if (p.x === goal.x && p.y === goal.y) return g.get(k)!;
    if (closed.has(k)) continue;
    closed.add(k);
    for (const d of dirs) {
      const n = { x: p.x + d.x, y: p.y + d.y };
      if (n.y < 0 || n.y >= grid.length || n.x < 0 || n.x >= grid[0]!.length) continue;
      if (grid[n.y]!.charAt(n.x) === "#") continue;
      const tentative = g.get(k)! + 1;
      const nk = key(n);
      if (tentative < (g.get(nk) ?? Infinity)) {
        g.set(nk, tentative);
        open.push({ p: n, f: tentative + h(n) });
      }
    }
  }
  return -1;
}

export function weighted(): string[] {
  const n = 6;
  const adj: Edge[][] = Array.from({ length: n }, () => []);
  const add = (a: number, b: number, w: number) => {
    adj[a]!.push({ to: b, w });
    adj[b]!.push({ to: a, w });
  };
  add(0, 1, 7);
  add(0, 2, 9);
  add(0, 5, 14);
  add(1, 2, 10);
  add(1, 3, 15);
  add(2, 3, 11);
  add(2, 5, 2);
  add(3, 4, 6);
  add(4, 5, 9);
  const { dist, prev } = dijkstra(adj, 0);
  const grid = ["....#...", ".##.#.#.", ".#..#.#.", ".#.##.#.", "...#..#.", ".#...#..", "........"];
  const heap = new MinHeap<number>((a, b) => a < b);
  for (const x of [5, 3, 8, 1, 9, 2, 7, 1.5, -4]) heap.push(x);
  const drained: number[] = [];
  while (heap.size) drained.push(heap.pop()!);
  return [
    `dist ${dist.join(" ")}`,
    `path to 4 ${pathTo(prev, 4).join("->")}`,
    `mst prim ${prim(adj)}`,
    `astar ${aStar(grid, { x: 0, y: 0 }, { x: 7, y: 6 })} blocked ${aStar([".#", "#."], { x: 0, y: 0 }, { x: 1, y: 1 })}`,
    `heap ${drained.join(" ")} then ${heap.pop() ?? "empty"}`,
    `unreachable ${dijkstra([[], []], 0).dist.join(" ")}`,
  ];
}

// ───── Union-find, Kruskal, topological sort, cycle detection ─────

class UnionFind {
  private parent: number[];
  private rank: number[];
  count: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array<number>(n).fill(0);
    this.count = n;
  }

  find(x: number): number {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root]!;
    while (this.parent[x] !== root) {
      const next = this.parent[x]!;
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a: number, b: number): boolean {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra]! < this.rank[rb]!) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]!++;
    this.count--;
    return true;
  }
}

function kruskal(n: number, edges: [number, number, number][]): { weight: number; used: string[] } {
  const uf = new UnionFind(n);
  const sorted = [...edges].sort((a, b) => a[2] - b[2]);
  let weight = 0;
  const used: string[] = [];
  for (const [u, v, w] of sorted) {
    if (uf.union(u, v)) {
      weight += w;
      used.push(`${u}-${v}`);
    }
  }
  return { weight, used };
}

/** Kahn's algorithm; returns null when there is a cycle. */
function topoSort(deps: Record<string, string[]>): string[] | null {
  const indegree: Record<string, number> = {};
  for (const node of Object.keys(deps)) indegree[node] ??= 0;
  for (const targets of Object.values(deps)) for (const t of targets) indegree[t] = (indegree[t] ?? 0) + 1;
  const ready = Object.keys(indegree).filter((k) => indegree[k] === 0).sort();
  const out: string[] = [];
  while (ready.length) {
    const n = ready.shift()!;
    out.push(n);
    for (const m of deps[n] ?? []) {
      indegree[m]!--;
      if (indegree[m] === 0) {
        ready.push(m);
        ready.sort();
      }
    }
  }
  return out.length === Object.keys(indegree).length ? out : null;
}

/** DFS-based topological order (reverse postorder). */
function topoDfs(deps: Record<string, string[]>): string[] {
  const visited = new Set<string>();
  const post: string[] = [];
  function visit(n: string) {
    if (visited.has(n)) return;
    visited.add(n);
    for (const m of deps[n] ?? []) visit(m);
    post.push(n);
  }
  Object.keys(deps).forEach(visit);
  return post.reverse();
}

const enum Color {
  White,
  Gray,
  Black,
}

function hasCycleDirected(deps: Record<string, string[]>): string[] | null {
  const color = new Map<string, Color>();
  const stack: string[] = [];
  // Set inside the closure: typed so TypeScript doesn't narrow it to null at the return.
  let cycle = null as string[] | null;
  const dfs = (n: string): boolean => {
    color.set(n, Color.Gray);
    stack.push(n);
    for (const m of deps[n] ?? []) {
      const c = color.get(m) ?? Color.White;
      if (c === Color.Gray) {
        cycle = [...stack.slice(stack.indexOf(m)), m];
        return true;
      }
      if (c === Color.White && dfs(m)) return true;
    }
    stack.pop();
    color.set(n, Color.Black);
    return false;
  };
  for (const n of Object.keys(deps)) if ((color.get(n) ?? Color.White) === Color.White && dfs(n)) break;
  return cycle;
}

function hasCycleUndirected(n: number, edges: [number, number][]): boolean {
  const uf = new UnionFind(n);
  return edges.some(([a, b]) => !uf.union(a, b));
}

export function connectivity(): string[] {
  const edges: [number, number, number][] = [
    [0, 1, 4], [0, 7, 8], [1, 2, 8], [1, 7, 11], [2, 3, 7], [2, 8, 2], [2, 5, 4], [3, 4, 9],
    [3, 5, 14], [4, 5, 10], [5, 6, 2], [6, 7, 1], [6, 8, 6], [7, 8, 7],
  ];
  const { weight, used } = kruskal(9, edges);
  const recipe: Record<string, string[]> = {
    shop: ["cook"],
    wake: ["shower", "shop"],
    shower: ["dress"],
    dress: ["cook", "eat"],
    cook: ["eat"],
    eat: [],
  };
  const cyclic: Record<string, string[]> = { a: ["b"], b: ["c"], c: ["d", "a"], d: [] };
  const uf = new UnionFind(10);
  [[1, 2], [3, 4], [2, 3], [7, 8], [1, 4]].forEach(([a, b]) => uf.union(a!, b!));
  return [
    `kruskal ${weight} via ${used.join(" ")}`,
    `topo ${topoSort(recipe)?.join(" ") ?? "cycle"}`,
    `topo dfs ${topoDfs(recipe).join(" ")}`,
    `topo cyclic ${topoSort(cyclic)?.join(" ") ?? "cycle"}`,
    `cycle ${hasCycleDirected(cyclic)?.join("->") ?? "none"} / ${hasCycleDirected(recipe)?.join("->") ?? "none"}`,
    `undirected ${hasCycleUndirected(4, [[0, 1], [1, 2], [2, 3]])} ${hasCycleUndirected(4, [[0, 1], [1, 2], [2, 0]])}`,
    `uf count ${uf.count} same(1,4)=${uf.find(1) === uf.find(4)} same(1,7)=${uf.find(1) === uf.find(7)}`,
  ];
}

/** Floyd–Warshall on an adjacency matrix; Bellman–Ford with negative edges. */
export function allPairs(): string[] {
  const INF = Number.POSITIVE_INFINITY;
  const d: number[][] = [
    [0, 3, INF, 7],
    [8, 0, 2, INF],
    [5, INF, 0, 1],
    [2, INF, INF, 0],
  ];
  const n = d.length;
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) if (d[i]![k]! + d[k]![j]! < d[i]![j]!) d[i]![j] = d[i]![k]! + d[k]![j]!;
  const bellman = (count: number, edges: number[][], src: number): number[] | string => {
    const dist = new Array<number>(count).fill(INF);
    dist[src] = 0;
    for (let i = 0; i < count - 1; i++)
      for (const [u, v, w] of edges) if (dist[u!]! + w! < dist[v!]!) dist[v!] = dist[u!]! + w!;
    for (const [u, v, w] of edges) if (dist[u!]! + w! < dist[v!]!) return "negative cycle";
    return dist;
  };
  const ok = bellman(5, [[0, 1, 6], [0, 2, 7], [1, 2, 8], [1, 3, 5], [1, 4, -4], [2, 3, -3], [2, 4, 9], [3, 1, -2], [4, 0, 2], [4, 3, 7]], 0);
  const bad = bellman(3, [[0, 1, 1], [1, 2, -1], [2, 1, -1]], 0);
  return [
    ...d.map((row) => row.join(" ")),
    `bellman ${typeof ok === "string" ? ok : ok.join(",")}`,
    `bellman ${typeof bad === "string" ? bad : bad.join(",")}`,
  ];
}
