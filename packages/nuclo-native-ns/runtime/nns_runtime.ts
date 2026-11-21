// nns-runtime (TypeScript): prototype subset for the worked examples.
// Not the final library. Each function has the behavior that the Nuclo Script document requires.

// ---- traps -----------------------------------------------------------------
export class NNSTrap extends Error {}
let isStopped = false
export function stopped(): boolean { return isStopped }
export function trap(message: string): never {
  isStopped = true
  throw new NNSTrap(message)
}
export function print(text: string): void { console.log(text) }

// ---- int: 32-bit signed, trap on overflow ------------------------------------
const MIN = -2147483648
const MAX = 2147483647
function int(r: number): number {
  if (r > MAX || r < MIN) trap("int overflow")
  return r === 0 ? 0 : r // removes negative zero
}
export function add(a: number, b: number): number { return int(a + b) }
export function sub(a: number, b: number): number { return int(a - b) }
export function mul(a: number, b: number): number { return int(a * b) }
export function neg(a: number): number { return int(-a) }
export function div(a: number, b: number): number {
  if (b === 0) trap("division by zero")
  return int(Math.trunc(a / b))
}
export function rem(a: number, b: number): number {
  if (b === 0) trap("division by zero")
  if (a === MIN && b === -1) trap("int overflow")
  return int(a % b)
}

// ---- long: 64-bit signed (bigint), trap on overflow ------------------------
const LMIN = -(2n ** 63n)
const LMAX = 2n ** 63n - 1n
function long(r: bigint): bigint {
  if (r > LMAX || r < LMIN) trap("long overflow")
  return r
}
export function addL(a: bigint, b: bigint): bigint { return long(a + b) }
export function subL(a: bigint, b: bigint): bigint { return long(a - b) }
export function mulL(a: bigint, b: bigint): bigint { return long(a * b) }
export function divL(a: bigint, b: bigint): bigint {
  if (b === 0n) trap("division by zero")
  return long(a / b)
}
export function remL(a: bigint, b: bigint): bigint {
  if (b === 0n) trap("division by zero")
  if (a === LMIN && b === -1n) trap("long overflow")
  return a % b
}
export function toInt(x: number | bigint): number {
  const n = typeof x === "bigint" ? Number(x) : Math.trunc(x)
  if (!(n >= MIN && n <= MAX)) trap("toInt: value out of range")
  return n === 0 ? 0 : n
}

// ---- string: a sequence of Unicode scalar values ---------------------------
export function length(s: string): number {
  let n = 0
  for (const _ of s) n++
  return n
}
/** `s.slice(start, end)` of Nuclo Script: positions count scalar values; a position out of range is moved into the range. */
export function strSlice(s: string, start: number, end?: number): string {
  const from = Math.max(0, start)
  const to = Math.max(0, end ?? Infinity)
  return /[\uD800-\uDFFF]/.test(s) ? Array.from(s).slice(from, to).join("") : s.slice(from, to)
}
/** `s.indexOf(part)` of Nuclo Script: the scalar position of the first `part`, or -1; 0 for the empty part. */
export function strIndexOf(s: string, part: string): number {
  const i = s.indexOf(part)
  return i <= 0 ? i : i - (s.slice(0, i).match(/[\uDC00-\uDFFF]/g)?.length ?? 0)
}
function compareStrings(a: string, b: string): number {
  const x = a[Symbol.iterator]()
  const y = b[Symbol.iterator]()
  for (;;) {
    const p = x.next()
    const q = y.next()
    if (p.done || q.done) return p.done ? (q.done ? 0 : -1) : 1
    const d = p.value.codePointAt(0)! - q.value.codePointAt(0)!
    if (d !== 0) return d < 0 ? -1 : 1
  }
}
/** Order of two int, long, float, or string values: -1, 0, or 1. */
export function compare<T>(a: T, b: T): number {
  if (typeof a === "string") return compareStrings(a, b as string)
  return a < b ? -1 : a > b ? 1 : 0
}

// ---- the copy check -------------------------------------------------------------
const SHARED = Symbol("nns.shared")
const BORROWS = Symbol("nns.borrows")
type Marks = { [SHARED]?: boolean; [BORROWS]?: number }

/**
 * True for a value that can hold marks: a record, a list, a Map, or a Set.
 * A union value (`{ tag, v0, ... }`) has the same shape as a record, and a record can have a field `tag`,
 * so the two cannot be told apart by their keys. Thus a union value also holds marks. It never changes in place,
 * so its marks have no effect. (The marks are symbol keys: `eq`, `key`, and `Object.keys` do not see them.)
 */
function hasMarks(x: unknown): x is Marks {
  if (typeof x !== "object" || x === null) return false
  return Array.isArray(x) || x instanceof Map || x instanceof Set || Object.getPrototypeOf(x) === Object.prototype
}
/** A second holder that stays gets the value. */
export function share<T>(x: T): T {
  if (hasMarks(x)) x[SHARED] = true
  return x
}
/** A local copy, a loop, or a call reads the value for a limited time. */
export function borrow<T>(x: T): T {
  if (hasMarks(x)) x[BORROWS] = (x[BORROWS] ?? 0) + 1
  return x
}
export function release(x: unknown): void {
  if (hasMarks(x)) x[BORROWS] = (x[BORROWS] ?? 1) - 1
}
/** A shallow copy with clear marks. Each child now has two holders. */
export function clone<T>(x: T): T {
  let c: any
  if (Array.isArray(x)) {
    c = x.slice()
    for (const v of c) share(v)
  } else if (x instanceof Map || x instanceof Set) {
    c = x.copy()
  } else {
    c = { ...x }
    c[SHARED] = false
    c[BORROWS] = 0
    for (const k of Object.keys(c)) share(c[k])
  }
  return c
}
/** Gives `x` when it has one holder. If not, gives a private copy. */
export function own<T>(x: T): T {
  const m = x as Marks
  return m[SHARED] || m[BORROWS] ? clone(x) : x
}

// ---- lists -------------------------------------------------------------------
export function at<T>(xs: T[], i: number): T {
  if (i < 0 || i >= xs.length) trap("index out of range")
  return xs[i] as T
}
export function get<T>(xs: T[], i: number): T | null {
  return i < 0 || i >= xs.length ? null : (xs[i] as T)
}
export function setAt<T>(xs: T[], i: number, v: T): void {
  if (i < 0 || i >= xs.length) trap("index out of range")
  xs[i] = v
}
/** The element at `i`, after the copy check. `xs` must have one holder. */
export function ownAt<T>(xs: T[], i: number): T {
  const e = own(at(xs, i))
  xs[i] = e
  return e
}
/** `xs.insert(i, v)`. `xs` must have one holder. */
export function insert<T>(xs: T[], i: number, v: T): void {
  if (i < 0 || i > xs.length) trap("index out of range")
  xs.splice(i, 0, v)
}
/** `xs.removeAt(i)`: gives the element. `xs` must have one holder. */
export function removeAt<T>(xs: T[], i: number): T {
  if (i < 0 || i >= xs.length) trap("index out of range")
  return xs.splice(i, 1)[0] as T
}
export function sort<T>(xs: T[], less: (a: T, b: T) => boolean): void {
  xs.sort((a, b) => (less(a, b) ? -1 : less(b, a) ? 1 : 0)) // Array.prototype.sort is stable
}

// ---- `&` parameters ------------------------------------------------------------
/** Holds a value for the time of one call. `store` writes it back to its path. */
export class Cell<T> {
  v: T
  private readonly put: (v: T) => void
  constructor(v: T, put: (v: T) => void) { this.v = v; this.put = put }
  store(): void { this.put(this.v) }
}
export function cellAt<T>(xs: T[], i: number): Cell<T> {
  return new Cell(at(xs, i), (v) => { xs[i] = v })
}

// ---- equality and hash by value ----------------------------------------------
export function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false
  if (Array.isArray(a)) {
    const y = b as unknown[]
    return a.length === y.length && a.every((v, i) => eq(v, y[i]))
  }
  if (a instanceof Map || a instanceof Set) return a.equals(b as never)
  const x = a as Record<string, unknown>
  const y = b as Record<string, unknown>
  return Object.keys(x).every((k) => eq(x[k], y[k]))
}
/** A text that is equal for two values exactly when `eq` is true. A real runtime uses a hash number. */
function key(v: unknown): string {
  if (typeof v === "string") return "s" + v
  if (typeof v !== "object" || v === null) return typeof v + String(v)
  if (Array.isArray(v)) return "[" + v.map(key).join(",") + "]"
  const o = v as Record<string, unknown>
  return "{" + Object.keys(o).map((k) => k + ":" + key(o[k])).join(",") + "}"
}

// ---- Map and Set: insertion order, keys compared by value ---------------------
const NativeMap = globalThis.Map
export class Map<K, V> {
  private items = new NativeMap<string, [K, V]>();
  [SHARED]?: boolean;
  [BORROWS]?: number
  static of<K, V>(entries: [K, V][]): Map<K, V> {
    const m = new Map<K, V>()
    for (const [k, v] of entries) m.set(k, v)
    return m
  }
  get(k: K): V | null { return this.items.get(key(k))?.[1] ?? null }
  set(k: K, v: V): void {
    const id = key(k)
    const e = this.items.get(id)
    if (e) e[1] = v
    else this.items.set(id, [k, v])
  }
  delete(k: K): boolean { return this.items.delete(key(k)) }
  keys(): K[] { return [...this.items.values()].map((e) => e[0]) }
  copy(): Map<K, V> {
    const m = new Map<K, V>()
    for (const [id, [k, v]] of this.items) m.items.set(id, [k, share(v)])
    return m
  }
  equals(o: Map<K, V>): boolean {
    if (this.items.size !== o.items.size) return false
    for (const [id, e] of this.items) {
      const f = o.items.get(id)
      if (!f || !eq(e[1], f[1])) return false
    }
    return true
  }
}
/** The value of `m[k]`, after the copy check. `m` must have one holder. Traps when `k` is missing. */
export function ownKey<K, V>(m: Map<K, V>, k: K): V {
  const v = m.get(k)
  if (v === null) trap("key not found")
  const e = own(v)
  m.set(k, e)
  return e
}
export class Set<T> {
  private items = new NativeMap<string, T>();
  [SHARED]?: boolean;
  [BORROWS]?: number
  static of<T>(xs: T[]): Set<T> {
    const s = new Set<T>()
    for (const x of xs) s.add(x)
    return s
  }
  add(v: T): void {
    const id = key(v)
    if (!this.items.has(id)) this.items.set(id, v)
  }
  has(v: T): boolean { return this.items.has(key(v)) }
  delete(v: T): boolean { return this.items.delete(key(v)) }
  /** The values, in insertion order. */
  values(): T[] { return [...this.items.values()] }
  copy(): Set<T> {
    const s = new Set<T>()
    for (const [id, v] of this.items) s.items.set(id, v)
    return s
  }
  equals(o: Set<T>): boolean {
    if (this.items.size !== o.items.size) return false
    for (const id of this.items.keys()) if (!o.items.has(id)) return false
    return true
  }
}

// ---- Result -----------------------------------------------------------------
export type Result<T, E> =
  | { readonly tag: "Ok"; readonly v0: T }
  | { readonly tag: "Err"; readonly v0: E }

// ---- top-level bindings: computed at first use ---------------------------------
export type LazyVar<T> = (() => T) & { set(v: T): void }
/** A top-level `let` that needs a call: `x()` reads it, `x.set(v)` changes it. A change first runs the initializer. */
export function lazyVar<T>(init: () => T): LazyVar<T> {
  let state = 0 // 0 = not started, 1 = running, 2 = done
  let value: T
  const read = (() => {
    if (state === 2) return value
    if (state === 1) trap("a top-level binding depends on itself")
    state = 1
    value = init()
    state = 2
    return value
  }) as LazyVar<T>
  read.set = (v) => { read(); value = v }
  return read
}
export function lazy<T>(init: () => T): () => T { return lazyVar(init) }

// ---- async: tasks are generators, and the runtime is the driver ----------------
/** An `async fn` is a generator. It yields a promise only when it must wait. */
export type Op<T> = Generator<Promise<unknown>, T, unknown>
export function* wait<T>(p: Promise<T>): Op<T> {
  return (yield p) as T
}
export class Task<T> {
  private state: "queued" | "running" | "done" | "cancelled" = "queued"
  private result: T | null = null
  private waiters: (() => void)[] = []
  private readonly gen: Op<T>
  constructor(gen: Op<T>) { this.gen = gen }
  /** Runs the task until it must wait, or until its end. */
  step(input: unknown): void {
    if (this.state === "done" || this.state === "cancelled") return
    this.state = "running"
    const r = this.gen.next(input)
    if (r.done) this.finish("done", r.value)
    else r.value.then((v) => this.step(v), (e) => { throw e })
  }
  cancel(): void {
    if (this.state === "done" || this.state === "cancelled") return
    this.gen.return(undefined as never) // runs the open `defer` blocks
    this.finish("cancelled", null)
  }
  /** The result, or `null` when the task was cancelled. */
  *join(): Op<T | null> {
    if (this.state !== "done" && this.state !== "cancelled") {
      yield new Promise<void>((done) => this.waiters.push(done))
    }
    return this.result
  }
  private finish(state: "done" | "cancelled", result: T | null): void {
    this.state = state
    this.result = result
    for (const w of this.waiters) w()
    this.waiters = []
  }
}
const queue: Task<any>[] = []
/** The task starts later, after the current code waits or returns. */
export function spawn<T>(task: () => Op<T>): Task<T> {
  const t = new Task(task())
  if (queue.length === 0) queueMicrotask(() => { while (queue.length > 0) queue.shift()!.step(undefined) })
  queue.push(t)
  return t
}
