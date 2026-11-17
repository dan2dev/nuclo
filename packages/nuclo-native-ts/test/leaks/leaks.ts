/**
 * The leak test's program (test/leaks.test.ts): each `leakRound()` builds cyclic structures, drops most of them and
 * rewires a structure that stays referenced (a global), so part of it becomes garbage that still points at itself.
 * After a collection, the number of live tracked objects must be the same after every round.
 */
import { cy2Churn } from "../../examples/language/checks-cycles2.ts";
import { g2Churn } from "../../examples/language/checks-gen2-values.ts";

class LkHub {
  peers: LkHub[] = [];
  byName = new Map<string, LkHub[]>();
  grid: LkHub[][] = [];
  owner: LkHub | null = null;
  tags = new Set<LkHub>();
  index: Record<string, LkHub> = {};
  constructor(public id: number) {}
}

/** Stays referenced: 40 hubs, rewired every round (each round replaces 10 of them; the old ones keep pointing at each other). */
const lkWorld: LkHub[] = [];
for (let i = 0; i < 40; i++) lkWorld.push(new LkHub(i));
let lkRound = 0;

function lkLink(a: LkHub, b: LkHub): void {
  a.peers.push(b);
  b.peers.push(a);
  a.tags.add(b);
  b.owner = a;
}

export function leakRound(): number {
  lkRound++;
  let sum = cy2Churn(25);
  // Objects holding their own generators (sync and async state machines that hold them back).
  sum += g2Churn(6);
  // Replace 10 hubs of the world; the replaced ones stay linked to each other (a garbage cycle) and to the world.
  for (let k = 0; k < 10; k++) {
    const at = (lkRound * 7 + k * 3) % lkWorld.length;
    const old = lkWorld[at]!;
    const fresh = new LkHub(lkRound * 100 + k);
    lkWorld[at] = fresh;
    lkLink(old, lkWorld[(at + 1) % lkWorld.length]!);
    lkLink(fresh, old);
    old.byName.set("self", [old, fresh]);
    old.grid = [[old], [fresh, old]];
    old.index["me"] = old;
  }
  // The world's hubs drop the links to hubs that left it (so the left ones become garbage).
  const inWorld = new Set<LkHub>(lkWorld);
  for (const h of lkWorld) {
    h.peers = h.peers.filter((p) => inWorld.has(p));
    const tags = [...h.tags];
    for (const t of tags) if (!inWorld.has(t)) h.tags.delete(t);
    if (h.owner !== null && !inWorld.has(h.owner)) h.owner = null;
    h.byName.clear();
    h.grid = [];
    h.index = {};
  }
  for (let i = 0; i < lkWorld.length; i++) lkLink(lkWorld[i]!, lkWorld[(i * 5 + lkRound) % lkWorld.length]!);
  for (const h of lkWorld) {
    // Keep each hub's links bounded.
    h.peers = h.peers.slice(-4);
    const tags = [...h.tags];
    for (let i = 0; i < tags.length - 4; i++) h.tags.delete(tags[i]!);
    sum += h.peers.length + h.tags.size;
  }
  return sum;
}

// ───────────── Stress: a big graph rewired while the incremental collector's slices run ─────────────
// A ring of ~20 000 nodes (doubly linked, with kids arrays, keyed maps, bags and parent links) that every
// `stressRound()` rewires: nodes leave the ring and become garbage still pointing into it, move into other nodes'
// containers or a global array, come back from them (container removals the write barrier does not see), and small
// cycles are made and dropped. The harness runs a few collector slices between rounds; the checksum walks everything
// still reachable, so a node freed while reachable (its fields cleared) changes it.

class StNode {
  next: StNode | null = null;
  prev: StNode | null = null;
  parent: StNode | null = null;
  kids: StNode[] = [];
  byKey = new Map<string, StNode>();
  bag = new Set<StNode>();
  constructor(public id: number) {}
}

const stRing = new StNode(0);
stRing.next = stRing;
stRing.prev = stRing;
let stCursor: StNode = stRing;
const stParked: StNode[] = [];
let stIds = 1;
let stSeed = 7;

function stRand(n: number): number {
  stSeed = (stSeed * 75 + 74) % 65537;
  return stSeed % n;
}

function stInsertAfter(at: StNode, x: StNode): void {
  const after = at.next!;
  x.prev = at;
  x.next = after;
  after.prev = x;
  at.next = x;
}

function stUnlink(x: StNode): void {
  x.prev!.next = x.next;
  x.next!.prev = x.prev;
}

/** A ring node a few steps from the cursor (never the ring's own head). */
function stPick(): StNode {
  let x = stCursor;
  for (let k = stRand(40); k > 0; k--) x = x.next!;
  if (x === stRing) x = x.next!;
  stCursor = x;
  return x;
}

for (let i = 0; i < 20000; i++) stInsertAfter(stRing.prev!, new StNode(stIds++));

export function stressRound(): number {
  for (let op = 0; op < 600; op++) {
    const kind = stRand(10);
    const a = stPick();
    if (a === stRing) continue;
    if (kind === 0) {
      // Leaves the ring: garbage that still points into it (unless some container holds it).
      stCursor = a.next!;
      stUnlink(a);
      if (stCursor === a) stCursor = stRing;
    } else if (kind === 1) {
      // Leaves the ring into another node's kids, or the global parking array.
      stCursor = a.next!;
      stUnlink(a);
      if (stRand(2) === 0) stPick().kids.push(a);
      else stParked.push(a);
    } else if (kind === 2) {
      // Back from a container (a removal no barrier reports) into the ring or a map (overwriting a value).
      const b = stPick();
      const k = b.kids.length > 0 ? b.kids.pop()! : stParked.length > 0 ? stParked.shift()! : null;
      if (k !== null) {
        if (k.next !== null && k.next.prev === k) continue;
        if (stRand(2) === 0) stInsertAfter(a, k);
        else a.byKey.set(`k${stRand(5)}`, k);
      }
    } else if (kind === 3) {
      a.bag.add(stPick());
      if (a.bag.size > 3) {
        const first = [...a.bag][0]!;
        a.bag.delete(first);
      }
    } else if (kind === 4) {
      a.parent = stPick();
    } else if (kind === 5) {
      // A small cycle pointing into the ring, dropped at once (young garbage).
      const x = new StNode(stIds++);
      const y = new StNode(stIds++);
      x.next = y;
      y.prev = x;
      y.next = x;
      x.kids.push(a, y);
      y.bag.add(x);
    } else if (kind === 6) {
      // New nodes join the ring.
      stInsertAfter(a, new StNode(stIds++));
      stInsertAfter(a, new StNode(stIds++));
    } else if (kind === 7) {
      // Swap two nodes' positions (relinking only: every write is a barriered field store).
      const b = stPick();
      if (b === a || b === stRing || a.next === b || b.next === a) continue;
      const pa = a.prev!;
      const pb = b.prev!;
      stUnlink(a);
      stUnlink(b);
      stInsertAfter(pb, a);
      stInsertAfter(pa, b);
    } else if (kind === 8) {
      // A map's value moves to the global array (a map removal no barrier reports).
      const key = `k${stRand(5)}`;
      const v = a.byKey.get(key);
      if (v !== undefined) {
        a.byKey.delete(key);
        stParked.push(v);
      }
    } else {
      a.kids = a.kids.filter((k) => k.id % 3 !== 0);
    }
  }
  while (stParked.length > 50) stParked.shift();
  return stChecksum();
}

/** Walks every node still reachable from the ring and the parking array (each once). */
function stReach(f: (n: StNode) => void): void {
  const seen = new Set<StNode>();
  const todo: StNode[] = [stRing, ...stParked];
  while (todo.length > 0) {
    const n = todo.pop()!;
    if (seen.has(n)) continue;
    seen.add(n);
    f(n);
    if (n.next !== null) todo.push(n.next);
    if (n.prev !== null) todo.push(n.prev);
    if (n.parent !== null) todo.push(n.parent);
    for (const k of n.kids) todo.push(k);
    for (const v of n.byKey.values()) todo.push(v);
    for (const v of n.bag) todo.push(v);
  }
}

function stChecksum(): number {
  let sum = 0;
  let pos = 0;
  for (let x = stRing.next!; x !== stRing; x = x.next!) sum = (sum + x.id * ((pos++ % 7) + 1)) % 1000000007;
  stReach((n) => {
    sum = (sum + n.kids.length * 3 + n.byKey.size * 5 + n.bag.size * 7 + (n.parent !== null ? n.parent.id % 11 : 0)) % 1000000007;
  });
  return sum;
}

/** How many nodes are reachable (what must stay alive after a full collection). */
export function stressReachable(): number {
  let n = 0;
  stReach(() => {
    n++;
  });
  return n;
}
