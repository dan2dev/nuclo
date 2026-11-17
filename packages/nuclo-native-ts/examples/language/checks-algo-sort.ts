// Algorithms corpus: sorting and searching, written the way TypeScript developers write them.

type Comparator<T> = (a: T, b: T) => number;

function swap(xs: number[], i: number, j: number): void {
  const t = xs[i]!;
  xs[i] = xs[j]!;
  xs[j] = t;
}

/** In-place Lomuto quicksort with median-of-three pivot. */
function quickSort(xs: number[], lo = 0, hi = xs.length - 1): number[] {
  if (lo >= hi) return xs;
  const mid = lo + ((hi - lo) >> 1);
  if (xs[mid]! < xs[lo]!) swap(xs, mid, lo);
  if (xs[hi]! < xs[lo]!) swap(xs, hi, lo);
  if (xs[mid]! < xs[hi]!) swap(xs, mid, hi);
  const pivot = xs[hi]!;
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (xs[j]! < pivot) {
      swap(xs, i, j);
      i++;
    }
  }
  swap(xs, i, hi);
  quickSort(xs, lo, i - 1);
  quickSort(xs, i + 1, hi);
  return xs;
}

/** Top-down merge sort, generic over a comparator, stable. */
function mergeSort<T>(items: readonly T[], cmp: Comparator<T>): T[] {
  if (items.length <= 1) return [...items];
  const middle = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, middle), cmp);
  const right = mergeSort(items.slice(middle), cmp);
  const result: T[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (cmp(left[i]!, right[j]!) <= 0) result.push(left[i++]!);
    else result.push(right[j++]!);
  }
  return result.concat(left.slice(i), right.slice(j));
}

function heapSort(input: number[]): number[] {
  const a = [...input];
  const siftDown = (start: number, end: number) => {
    let root = start;
    for (;;) {
      const left = 2 * root + 1;
      if (left >= end) break;
      let largest = root;
      if (a[left]! > a[largest]!) largest = left;
      if (left + 1 < end && a[left + 1]! > a[largest]!) largest = left + 1;
      if (largest === root) break;
      [a[root], a[largest]] = [a[largest]!, a[root]!];
      root = largest;
    }
  };
  for (let i = (a.length >> 1) - 1; i >= 0; i--) siftDown(i, a.length);
  for (let end = a.length - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end]!, a[0]!];
    siftDown(0, end);
  }
  return a;
}

function insertionSort(arr: number[]): number[] {
  const out = arr.slice();
  for (let i = 1; i < out.length; i++) {
    const key = out[i]!;
    let j = i - 1;
    while (j >= 0 && out[j]! > key) {
      out[j + 1] = out[j]!;
      j -= 1;
    }
    out[j + 1] = key;
  }
  return out;
}

function countingSort(arr: number[], max: number): number[] {
  const counts = new Array<number>(max + 1).fill(0);
  for (const x of arr) counts[x]!++;
  const out: number[] = [];
  counts.forEach((c, value) => {
    for (let k = 0; k < c; k++) out.push(value);
  });
  return out;
}

/** LSD radix sort, base 10, non-negative integers. */
function radixSort(arr: number[]): number[] {
  let out = [...arr];
  const max = Math.max(...out);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (const n of out) buckets[Math.floor(n / exp) % 10]!.push(n);
    out = buckets.flat();
  }
  return out;
}

function shellSort(input: number[]): number[] {
  const a = input.slice();
  for (let gap = Math.floor(a.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < a.length; i++) {
      const tmp = a[i]!;
      let j = i;
      for (; j >= gap && a[j - gap]! > tmp; j -= gap) a[j] = a[j - gap]!;
      a[j] = tmp;
    }
  }
  return a;
}

function bubbleSortCountSwaps(input: number[]): [number[], number] {
  const a = [...input];
  let swaps = 0;
  let swapped = true;
  while (swapped) {
    swapped = false;
    for (let i = 1; i < a.length; i++) {
      if (a[i - 1]! > a[i]!) {
        swap(a, i - 1, i);
        swaps++;
        swapped = true;
      }
    }
  }
  return [a, swaps];
}

const SAMPLE = [38, 27, 43, 3, 9, 82, 10, 3, -5, 0, 27, 100, 1];

export function sorts(): string[] {
  const [bubbled, swaps] = bubbleSortCountSwaps(SAMPLE);
  const builtin = [...SAMPLE].sort((a, b) => a - b);
  return [
    `quick ${quickSort([...SAMPLE]).join(",")}`,
    `merge ${mergeSort(SAMPLE, (a, b) => a - b).join(",")}`,
    `merge desc ${mergeSort(SAMPLE, (a, b) => b - a).join(" ")}`,
    `heap ${heapSort(SAMPLE).join(",")}`,
    `insertion ${insertionSort(SAMPLE).join(",")}`,
    `shell ${shellSort(SAMPLE).join(",")}`,
    `bubble ${bubbled.join(",")} swaps=${swaps}`,
    `counting ${countingSort([4, 1, 3, 4, 0, 2, 1, 1], 4).join("")}`,
    `radix ${radixSort([170, 45, 75, 90, 802, 24, 2, 66]).join(" ")}`,
    `builtin ${builtin.join(",")}`,
    `agree ${[quickSort([...SAMPLE]), heapSort(SAMPLE), insertionSort(SAMPLE), shellSort(SAMPLE)].every((s) => s.join() === builtin.join())}`,
    `empty ${quickSort([]).length} ${heapSort([]).length} ${mergeSort<number>([], (a, b) => a - b).length}`,
    `floats ${mergeSort([3.5, -0.25, 1e3, 2.75, -1e-3], (a, b) => a - b).join(" ")}`,
  ];
}

interface Employee {
  name: string;
  dept: string;
  salary: number;
}

const STAFF: Employee[] = [
  { name: "Ann", dept: "eng", salary: 120 },
  { name: "Bob", dept: "ops", salary: 90 },
  { name: "Cid", dept: "eng", salary: 100 },
  { name: "Dee", dept: "ops", salary: 90 },
  { name: "Eve", dept: "eng", salary: 120 },
  { name: "Fay", dept: "hr", salary: 70 },
  { name: "Gus", dept: "hr", salary: 90 },
];

const byKey =
  <T>(key: (t: T) => number): Comparator<T> =>
  (a, b) =>
    key(a) - key(b);

function thenBy<T>(first: Comparator<T>, second: Comparator<T>): Comparator<T> {
  return (a, b) => first(a, b) || second(a, b);
}

export function stableSorts(): string[] {
  const names = (xs: Employee[]) => xs.map((e) => e.name).join(" ");
  const bySalary = [...STAFF].sort((a, b) => a.salary - b.salary);
  const bySalaryDesc = STAFF.slice().sort((a, b) => b.salary - a.salary);
  const byDept = [...STAFF].sort((a, b) => (a.dept < b.dept ? -1 : a.dept > b.dept ? 1 : 0));
  const multi = [...STAFF].sort(thenBy<Employee>((a, b) => (a.dept === b.dept ? 0 : a.dept < b.dept ? -1 : 1), (a, b) => b.salary - a.salary));
  const merged = mergeSort(STAFF, byKey<Employee>((e) => e.salary));
  const words = ["banana", "Apple", "cherry", "apple", "Banana", "date", "fig", "Fig"];
  return [
    `salary asc ${names(bySalary)}`,
    `salary desc ${names(bySalaryDesc)}`,
    `dept ${names(byDept)}`,
    `dept,-salary ${names(multi)}`,
    `merge stable ${names(merged)}`,
    `default ${[...words].sort().join(",")}`,
    `ci ${[...words].sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : a.toLowerCase() > b.toLowerCase() ? 1 : 0)).join(",")}`,
    `by length ${[...words].sort((a, b) => a.length - b.length).join(",")}`,
    `numbers as text ${[10, 9, 1, 100, 25, -3].sort().join(",")}`,
    `toSorted ${[3, 1, 2].toSorted((a, b) => b - a).join("")} original kept`,
  ];
}

// ───── Searching ─────

function binarySearch(xs: readonly number[], target: number): number {
  let lo = 0;
  let hi = xs.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const v = xs[mid]!;
    if (v === target) return mid;
    if (v < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

function lowerBound(xs: readonly number[], target: number): number {
  let lo = 0;
  let hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (xs[mid]! < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBound(xs: readonly number[], target: number): number {
  let lo = 0;
  let hi = xs.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (xs[mid]! <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function recursiveSearch(xs: number[], target: number, lo: number, hi: number): number {
  if (lo > hi) return -1;
  const mid = (lo + hi) >> 1;
  if (xs[mid] === target) return mid;
  return xs[mid]! < target ? recursiveSearch(xs, target, mid + 1, hi) : recursiveSearch(xs, target, lo, mid - 1);
}

/** Search in a rotated sorted array. */
function searchRotated(nums: number[], target: number): number {
  let l = 0;
  let r = nums.length - 1;
  while (l <= r) {
    const m = (l + r) >> 1;
    if (nums[m] === target) return m;
    if (nums[l]! <= nums[m]!) {
      if (nums[l]! <= target && target < nums[m]!) r = m - 1;
      else l = m + 1;
    } else {
      if (nums[m]! < target && target <= nums[r]!) l = m + 1;
      else r = m - 1;
    }
  }
  return -1;
}

/** Binary search on the answer: integer square root. */
function isqrt(n: number): number {
  let lo = 0;
  let hi = n;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (mid * mid <= n) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Bisection on a continuous function. */
function bisect(f: (x: number) => number, a: number, b: number, eps = 1e-12): number {
  let lo = a;
  let hi = b;
  while (hi - lo > eps) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

function exponentialSearch(xs: number[], target: number): number {
  if (xs.length === 0) return -1;
  let bound = 1;
  while (bound < xs.length && xs[bound]! < target) bound *= 2;
  const lo = bound >> 1;
  const hi = Math.min(bound, xs.length - 1);
  const idx = lowerBound(xs.slice(lo, hi + 1), target);
  return xs[lo + idx] === target ? lo + idx : -1;
}

export function searches(): string[] {
  const sorted = [1, 3, 3, 3, 5, 8, 13, 21, 34];
  const finds = [1, 3, 4, 34, 0, 99].map((t) => `${t}:${binarySearch(sorted, t)}`);
  const bounds = [3, 4, 0, 34, 35].map((t) => `${t}:[${lowerBound(sorted, t)},${upperBound(sorted, t)})`);
  return [
    `binary ${finds.join(" ")}`,
    `bounds ${bounds.join(" ")}`,
    `count of 3 = ${upperBound(sorted, 3) - lowerBound(sorted, 3)}`,
    `recursive ${[13, 2].map((t) => recursiveSearch(sorted, t, 0, sorted.length - 1)).join(",")}`,
    `rotated ${[0, 4, 7, 3].map((t) => searchRotated([4, 5, 6, 7, 0, 1, 2], t)).join(",")}`,
    `isqrt ${[0, 1, 15, 16, 17, 1000000, 2147395600].map(isqrt).join(",")}`,
    `sqrt2 ${bisect((x) => x * x - 2, 0, 2).toFixed(10)}`,
    `cos root ${bisect((x) => Math.cos(x), 0, 3).toFixed(9)}`,
    `exponential ${[21, 22, 1].map((t) => exponentialSearch(sorted, t)).join(",")}`,
    `findIndex ${sorted.findIndex((x) => x > 4)} findLast ${sorted.findLast((x) => x < 10)}`,
  ];
}
