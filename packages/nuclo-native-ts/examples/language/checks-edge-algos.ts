// Edge cases: classic algorithms (sorting, searching, graphs, dynamic programming, memoization). Names start with `ed`.

function edArr(xs: number[]): number[] {
  return xs.slice();
}

function edMergeSort(xs: number[]): number[] {
  if (xs.length <= 1) return xs.slice();
  const mid = Math.floor(xs.length / 2);
  const l = edMergeSort(xs.slice(0, mid));
  const r = edMergeSort(xs.slice(mid));
  const out: number[] = [];
  let i = 0;
  let j = 0;
  while (i < l.length && j < r.length) out.push(l[i]! <= r[j]! ? l[i++]! : r[j++]!);
  while (i < l.length) out.push(l[i++]!);
  while (j < r.length) out.push(r[j++]!);
  return out;
}

function edQuickSort(xs: number[]): number[] {
  if (xs.length < 2) return xs.slice();
  const pivot = xs[xs.length >> 1]!;
  return [...edQuickSort(xs.filter((x) => x < pivot)), ...xs.filter((x) => x === pivot), ...edQuickSort(xs.filter((x) => x > pivot))];
}

function edInsertionSort(input: number[]): number[] {
  const xs = input.slice();
  for (let i = 1; i < xs.length; i++) {
    const v = xs[i]!;
    let j = i - 1;
    while (j >= 0 && xs[j]! > v) {
      xs[j + 1] = xs[j]!;
      j--;
    }
    xs[j + 1] = v;
  }
  return xs;
}

function edHeapSort(input: number[]): number[] {
  const a = input.slice();
  const n = a.length;
  const sift = (start: number, end: number): void => {
    let root = start;
    while (2 * root + 1 < end) {
      let child = 2 * root + 1;
      if (child + 1 < end && a[child]! < a[child + 1]!) child++;
      if (a[root]! >= a[child]!) return;
      const t = a[root]!;
      a[root] = a[child]!;
      a[child] = t;
      root = child;
    }
  };
  for (let s = Math.floor(n / 2) - 1; s >= 0; s--) sift(s, n);
  for (let end = n - 1; end > 0; end--) {
    const t = a[0]!;
    a[0] = a[end]!;
    a[end] = t;
    sift(0, end);
  }
  return a;
}

/** Lower bound: the first index whose item is >= x. */
function edLowerBound(xs: number[], x: number): number {
  let lo = 0;
  let hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (xs[mid]! < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function edBinarySearch(xs: number[], x: number): number {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const v = xs[mid]!;
    if (v === x) return mid;
    if (v < x) lo = mid + 1;
    else hi = mid - 1;
  }
  return -(lo + 1);
}

/** Sorting and searching: every algorithm agrees, on duplicates, negatives, floats and empty input. */
export function edSortSearch(): string[] {
  const data = edArr([5, -3, 8.5, 0, -0.5, 8.5, 1e9, -1e9, 3, 3, 3, 2, 7, -3]);
  const lines: string[] = [];
  const sorted = data.slice().sort((a, b) => a - b);
  for (const [name, f] of [
    ["merge", edMergeSort],
    ["quick", edQuickSort],
    ["insertion", edInsertionSort],
    ["heap", edHeapSort],
  ] as [string, (xs: number[]) => number[]][]) {
    const out = f(data);
    lines.push(`${name} ${out.join(" ")} ${out.join() === sorted.join()} ${f([]).length} ${f([1]).join()}`);
  }
  lines.push([3, -3, 8.5, 100, -1e10, 2.5].map((x) => `${x}:${edBinarySearch(sorted, x)}/${edLowerBound(sorted, x)}`).join(" "));
  // Pseudo-random data from an LCG (no Math.random): the same on every target.
  let seed = 12345;
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed;
  };
  const big: number[] = [];
  for (let i = 0; i < 2000; i++) big.push(rand() % 1000);
  const m = edMergeSort(big);
  const h = edHeapSort(big);
  let ok = true;
  for (let i = 1; i < m.length; i++) if (m[i - 1]! > m[i]! || m[i] !== h[i]) ok = false;
  lines.push(`${ok} ${m[0]!} ${m[999]!} ${m[1999]!} ${big.slice(0, 5).join()} ${seed}`);
  return lines;
}

/** Graphs on maps of adjacency lists: BFS distances, DFS order, topological sort, cycle detection, Dijkstra. */
export function edGraphs(): string[] {
  const edges: [string, string, number][] = [
    ["a", "b", 4],
    ["a", "c", 1],
    ["c", "b", 2],
    ["b", "d", 1],
    ["c", "d", 5],
    ["d", "e", 3],
    ["f", "g", 1],
  ];
  const adj: Record<string, string[]> = {};
  const weight: Record<string, number> = {};
  for (const [u, v, w] of edges) {
    adj[u] = [...(adj[u] ?? []), v];
    adj[v] = adj[v] ?? [];
    weight[`${u}->${v}`] = w;
  }
  const bfs = (start: string): string => {
    const dist: Record<string, number> = {};
    dist[start] = 0;
    const queue = [start];
    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const v of adj[u] ?? []) {
        if (!(v in dist)) {
          dist[v] = dist[u]! + 1;
          queue.push(v);
        }
      }
    }
    return Object.keys(dist).map((k) => `${k}${dist[k]!}`).join(" ");
  };
  const order: string[] = [];
  const seen: Record<string, boolean> = {};
  const dfs = (u: string): void => {
    if (seen[u]) return;
    seen[u] = true;
    order.push(u);
    for (const v of adj[u] ?? []) dfs(v);
  };
  for (const u of Object.keys(adj)) dfs(u);
  // Kahn's algorithm, smallest name first.
  const indeg: Record<string, number> = {};
  for (const u of Object.keys(adj)) indeg[u] = indeg[u] ?? 0;
  for (const u of Object.keys(adj)) for (const v of adj[u]!) indeg[v] = (indeg[v] ?? 0) + 1;
  let ready = Object.keys(indeg).filter((u) => indeg[u] === 0).sort();
  const topo: string[] = [];
  while (ready.length > 0) {
    const u = ready[0]!;
    ready = ready.slice(1);
    topo.push(u);
    for (const v of adj[u]!) {
      indeg[v] = indeg[v]! - 1;
      if (indeg[v] === 0) ready = [...ready, v].sort();
    }
  }
  const dijkstra = (src: string): string => {
    const dist: Record<string, number> = {};
    for (const u of Object.keys(adj)) dist[u] = Infinity;
    dist[src] = 0;
    const done: Record<string, boolean> = {};
    for (;;) {
      let best = "";
      for (const u of Object.keys(dist)) if (!done[u] && (best === "" || dist[u]! < dist[best]!)) best = u;
      if (best === "" || dist[best] === Infinity) break;
      done[best] = true;
      for (const v of adj[best]!) {
        const nd = dist[best]! + weight[`${best}->${v}`]!;
        if (nd < dist[v]!) dist[v] = nd;
      }
    }
    return Object.keys(dist).map((k) => `${k}=${dist[k]!}`).join(" ");
  };
  const hasCycle = (g: Record<string, string[]>): boolean => {
    const state: Record<string, number> = {};
    const visit = (u: string): boolean => {
      if (state[u] === 1) return true;
      if (state[u] === 2) return false;
      state[u] = 1;
      for (const v of g[u] ?? []) if (visit(v)) return true;
      state[u] = 2;
      return false;
    };
    return Object.keys(g).some((u) => visit(u));
  };
  return [bfs("a"), bfs("f"), order.join(""), topo.join(""), dijkstra("a"), `${hasCycle(adj)} ${hasCycle({ x: ["y"], y: ["z"], z: ["x"] })} ${hasCycle({})}`];
}

/** Dynamic programming and memoized recursion. */
export function edDynamic(): string[] {
  const memo: Record<string, number> = {};
  const fib = (n: number): number => {
    if (n < 2) return n;
    const key = `${n}`;
    const hit = memo[key];
    if (hit !== undefined) return hit;
    const v = fib(n - 1) + fib(n - 2);
    memo[key] = v;
    return v;
  };
  const lcs = (a: string, b: string): string => {
    const x = a.split("");
    const y = b.split("");
    const dp: number[][] = [];
    for (let i = 0; i <= x.length; i++) {
      const row: number[] = [];
      for (let j = 0; j <= y.length; j++) row.push(0);
      dp.push(row);
    }
    for (let i = 1; i <= x.length; i++)
      for (let j = 1; j <= y.length; j++) dp[i]![j] = x[i - 1] === y[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    let out = "";
    let i = x.length;
    let j = y.length;
    while (i > 0 && j > 0) {
      if (x[i - 1] === y[j - 1]) {
        out = x[i - 1]! + out;
        i--;
        j--;
      } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--;
      else j--;
    }
    return out;
  };
  const editDistance = (a: string, b: string): number => {
    let prev: number[] = [];
    for (let j = 0; j <= b.length; j++) prev.push(j);
    for (let i = 1; i <= a.length; i++) {
      const cur: number[] = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a.slice(i - 1, i) === b.slice(j - 1, j) ? 0 : 1;
        cur.push(Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost));
      }
      prev = cur;
    }
    return prev[b.length]!;
  };
  const coins = (amount: number, kinds: number[]): number => {
    const ways: number[] = [1];
    for (let i = 1; i <= amount; i++) ways.push(0);
    for (const c of kinds) for (let i = c; i <= amount; i++) ways[i] = ways[i]! + ways[i - c]!;
    return ways[amount]!;
  };
  const knapsack = (cap: number, items: [number, number][]): number => {
    const best: number[] = [];
    for (let i = 0; i <= cap; i++) best.push(0);
    for (const [w, v] of items) for (let c = cap; c >= w; c--) best[c] = Math.max(best[c]!, best[c - w]! + v);
    return best[cap]!;
  };
  const lis = (xs: number[]): number => {
    const tails: number[] = [];
    for (const x of xs) {
      const i = edLowerBound(tails, x);
      if (i === tails.length) tails.push(x);
      else tails[i] = x;
    }
    return tails.length;
  };
  const ackermann = (m: number, n: number): number => (m === 0 ? n + 1 : n === 0 ? ackermann(m - 1, 1) : ackermann(m - 1, ackermann(m, n - 1)));
  const depth = (n: number): number => (n === 0 ? 0 : 1 + depth(n - 1));
  return [
    `${fib(10)} ${fib(50)} ${fib(78)} ${fib(79)} ${fib(90)} ${Object.keys(memo).length}`,
    `${lcs("ABCBDAB", "BDCABA")} [${lcs("", "abc")}] ${lcs("AGGTAB", "GXTXAYB")} ${editDistance("kitten", "sitting")} ${editDistance("", "abc")} ${editDistance("flaw", "lawn")}`,
    `${coins(100, [1, 5, 10, 25, 50])} ${coins(0, [1])} ${coins(3, [2])} ${knapsack(50, [[10, 60], [20, 100], [30, 120]])} ${lis([10, 9, 2, 5, 3, 7, 101, 18])} ${lis([])}`,
    `${ackermann(2, 3)} ${ackermann(3, 3)} ${depth(5000)}`,
  ];
}

/** Number theory on Ints and Doubles: gcd, primes, modular power, digit sums, base conversion by hand. */
export function edNumberTheory(): string[] {
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  const sieve = (n: number): number[] => {
    const mark: boolean[] = [];
    for (let i = 0; i <= n; i++) mark.push(true);
    const out: number[] = [];
    for (let i = 2; i <= n; i++) {
      if (!mark[i]) continue;
      out.push(i);
      for (let j = i * i; j <= n; j += i) mark[j] = false;
    }
    return out;
  };
  const modPow = (base: number, exp: number, mod: number): number => {
    let result = 1;
    let b = base % mod;
    let e = exp;
    while (e > 0) {
      if (e % 2 === 1) result = (result * b) % mod;
      b = (b * b) % mod;
      e = Math.floor(e / 2);
    }
    return result;
  };
  const toBase = (n: number, base: number): string => {
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    if (n === 0) return "0";
    let s = "";
    let v = Math.abs(n);
    while (v > 0) {
      s = digits.slice(v % base, (v % base) + 1) + s;
      v = Math.floor(v / base);
    }
    return (n < 0 ? "-" : "") + s;
  };
  const collatz = (n: number): number => {
    let steps = 0;
    let v = n;
    while (v !== 1) {
      v = v % 2 === 0 ? v / 2 : 3 * v + 1;
      steps++;
    }
    return steps;
  };
  const primes = sieve(100);
  return [
    `${gcd(48, 18)} ${gcd(-48, 18)} ${gcd(0, 0)} ${gcd(17, 5)} ${gcd(1071, 462)}`,
    `${primes.length} ${primes.slice(-3).join()} ${modPow(2, 10, 1000)} ${modPow(3, 200, 1000007)} ${modPow(7, 0, 13)}`,
    `${toBase(255, 16)} ${toBase(-255, 2)} ${toBase(0, 7)} ${toBase(123456789, 36)} ${collatz(27)} ${collatz(97)}`,
  ];
}
