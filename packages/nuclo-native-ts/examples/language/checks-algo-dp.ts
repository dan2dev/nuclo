// Algorithms corpus: dynamic programming (LCS, edit distance, knapsack, coin change, LIS, matrix chain, more).

function lcs(a: string, b: string): { length: number; sequence: string } {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a.charAt(i - 1) === b.charAt(j - 1) ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }
  let i = m;
  let j = n;
  const out: string[] = [];
  while (i > 0 && j > 0) {
    if (a.charAt(i - 1) === b.charAt(j - 1)) {
      out.push(a.charAt(i - 1));
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--;
    else j--;
  }
  return { length: dp[m]![n]!, sequence: out.reverse().join("") };
}

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[b.length]!;
}

interface Item {
  name: string;
  weight: number;
  value: number;
}

function knapsack(items: Item[], capacity: number): { value: number; chosen: string[] } {
  const n = items.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1]!;
    for (let w = 0; w <= capacity; w++) {
      dp[i]![w] = dp[i - 1]![w]!;
      if (weight <= w) dp[i]![w] = Math.max(dp[i]![w]!, dp[i - 1]![w - weight]! + value);
    }
  }
  const chosen: string[] = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i]![w] !== dp[i - 1]![w]) {
      chosen.unshift(items[i - 1]!.name);
      w -= items[i - 1]!.weight;
    }
  }
  return { value: dp[n]![capacity]!, chosen };
}

function coinChangeMin(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) if (c <= a && dp[a - c]! + 1 < dp[a]!) dp[a] = dp[a - c]! + 1;
  }
  return dp[amount] === Infinity ? -1 : dp[amount]!;
}

function coinChangeWays(coins: number[], amount: number): number {
  const ways = [1, ...new Array<number>(amount).fill(0)];
  for (const c of coins) for (let a = c; a <= amount; a++) ways[a]! += ways[a - c]!;
  return ways[amount]!;
}

/** O(n log n) LIS with patience sorting; also reconstructs one sequence. */
function lis(nums: number[]): number[] {
  const tails: number[] = [];
  const tailIdx: number[] = [];
  const parent = new Array<number>(nums.length).fill(-1);
  nums.forEach((x, i) => {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid]! < x) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = x;
    tailIdx[lo] = i;
    parent[i] = lo > 0 ? tailIdx[lo - 1]! : -1;
  });
  const out: number[] = [];
  for (let k = tailIdx[tails.length - 1] ?? -1; k >= 0; k = parent[k]!) out.push(nums[k]!);
  return out.reverse();
}

function matrixChain(dims: number[]): { cost: number; order: string } {
  const n = dims.length - 1;
  const cost: number[][] = [];
  const split: number[][] = [];
  for (let i = 0; i < n; i++) {
    cost.push(new Array<number>(n).fill(0));
    split.push(new Array<number>(n).fill(0));
  }
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      cost[i]![j] = Number.MAX_SAFE_INTEGER;
      for (let k = i; k < j; k++) {
        const c = cost[i]![k]! + cost[k + 1]![j]! + dims[i]! * dims[k + 1]! * dims[j + 1]!;
        if (c < cost[i]![j]!) {
          cost[i]![j] = c;
          split[i]![j] = k;
        }
      }
    }
  }
  const paren = (i: number, j: number): string => (i === j ? String.fromCharCode(65 + i) : `(${paren(i, split[i]![j]!)}${paren(split[i]![j]! + 1, j)})`);
  return { cost: cost[0]![n - 1]!, order: paren(0, n - 1) };
}

export function classicDp(): string[] {
  const l = lcs("AGGTAB", "GXTXAYB");
  const items: Item[] = [
    { name: "map", weight: 9, value: 150 },
    { name: "compass", weight: 13, value: 35 },
    { name: "water", weight: 153, value: 200 },
    { name: "sandwich", weight: 50, value: 160 },
    { name: "glucose", weight: 15, value: 60 },
    { name: "tin", weight: 68, value: 45 },
    { name: "banana", weight: 27, value: 60 },
    { name: "apple", weight: 39, value: 40 },
  ];
  const k = knapsack(items, 200);
  const mc = matrixChain([40, 20, 30, 10, 30]);
  return [
    `lcs ${l.length} ${l.sequence} / ${lcs("", "abc").length} / ${lcs("abc", "abc").sequence}`,
    `edit ${editDistance("kitten", "sitting")} ${editDistance("", "abc")} ${editDistance("flaw", "lawn")} ${editDistance("intention", "execution")}`,
    `knapsack ${k.value} ${k.chosen.join("+")}`,
    `coins min ${coinChangeMin([1, 5, 10, 25], 63)} ${coinChangeMin([2], 3)} ${coinChangeMin([186, 419, 83, 408], 6249)}`,
    `coins ways ${coinChangeWays([1, 2, 5], 5)} ${coinChangeWays([2, 5, 3, 6], 10)} ${coinChangeWays([1, 5, 10, 25, 50], 100)}`,
    `lis ${lis([10, 9, 2, 5, 3, 7, 101, 18]).join(",")} / ${lis([0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15]).join(",")} / [${lis([]).join(",")}]`,
    `matrix chain ${mc.cost} ${mc.order}`,
  ];
}

// ───── Memoized recursion and grid DPs ─────

function memoize<A extends string | number, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache = new Map<A, R>();
  return (arg) => {
    const hit = cache.get(arg);
    if (hit !== undefined) return hit;
    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}

const climbStairs = memoize((n: number): number => (n <= 2 ? n : climbStairs(n - 1) + climbStairs(n - 2)));

function uniquePaths(grid: string[]): number {
  const rows = grid.length;
  const cols = grid[0]!.length;
  const dp = new Array<number>(cols).fill(0);
  dp[0] = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r]!.charAt(c) === "#") dp[c] = 0;
      else if (c > 0) dp[c]! += dp[c - 1]!;
    }
  }
  return dp[cols - 1]!;
}

function maxSubarray(xs: number[]): [number, number, number] {
  let best = -Infinity;
  let cur = 0;
  let start = 0;
  let bestRange: [number, number] = [0, 0];
  for (let i = 0; i < xs.length; i++) {
    if (cur <= 0) {
      cur = xs[i]!;
      start = i;
    } else cur += xs[i]!;
    if (cur > best) {
      best = cur;
      bestRange = [start, i];
    }
  }
  return [best, ...bestRange];
}

function wordBreak(s: string, dict: string[]): string[] {
  const words = new Set(dict);
  const memo = new Map<number, string[]>();
  const go = (start: number): string[] => {
    if (start === s.length) return [""];
    const cached = memo.get(start);
    if (cached) return cached;
    const out: string[] = [];
    for (let end = start + 1; end <= s.length; end++) {
      const w = s.slice(start, end);
      if (words.has(w)) for (const rest of go(end)) out.push(rest ? `${w} ${rest}` : w);
    }
    memo.set(start, out);
    return out;
  };
  return go(0);
}

function longestPalindromicSubsequence(s: string): number {
  const n = s.length;
  const dp: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    dp[i]![i] = 1;
    for (let j = i + 1; j < n; j++) {
      dp[i]![j] = s.charAt(i) === s.charAt(j) ? dp[i + 1]![j - 1]! + 2 : Math.max(dp[i + 1]![j]!, dp[i]![j - 1]!);
    }
  }
  return n ? dp[0]![n - 1]! : 0;
}

function rodCutting(prices: number[], n: number): number {
  const best = [0];
  for (let len = 1; len <= n; len++) {
    let q = -Infinity;
    for (let cut = 1; cut <= len && cut <= prices.length; cut++) q = Math.max(q, prices[cut - 1]! + best[len - cut]!);
    best.push(q);
  }
  return best[n]!;
}

export function moreDp(): string[] {
  return [
    `stairs ${[1, 2, 3, 10, 40, 80].map(climbStairs).join(",")}`,
    `paths ${uniquePaths(["....", "....", "...."])} ${uniquePaths(["..#.", "....", ".#.."])}`,
    `kadane ${maxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]).join(",")} ${maxSubarray([-3, -1, -2]).join(",")}`,
    `word break ${wordBreak("catsanddog", ["cat", "cats", "and", "sand", "dog"]).join(" | ")}`,
    `lps ${longestPalindromicSubsequence("bbbab")} ${longestPalindromicSubsequence("character")} ${longestPalindromicSubsequence("")}`,
    `rod ${rodCutting([1, 5, 8, 9, 10, 17, 17, 20], 8)} ${rodCutting([3, 5, 8, 9, 10, 17, 17, 20], 8)}`,
  ];
}
