//! The cycle collector. The compiler (cycles.ts, rule 6) finds the classes whose objects may end up pointing at each
//! other; their objects register here (`gc_track`, a `Weak`: no strong reference) and report the tracked objects
//! their fields hold (`GcNode::gc_traverse`, through optionals, arrays, records, Maps and Sets: once per reference, as
//! `Rc` counts them). A collection of a set of objects is CPython's algorithm: an object's strong count less the
//! references from the set (and the containers it reaches) is what the rest of the program holds; whatever is reachable
//! from an object with such outside references is live; the rest is garbage only other garbage reaches, so its
//! references are dropped (`gc_clear`) and `Rc` frees it. Exact for the set, whatever is outside it.
//!
//! Generational and incremental (the same design as NucloRuntime.swift's): the registry's `[0, old_end)` survived a
//! collection (old), the rest is young. At a safe point (a microtask drain's end, no app code on the stack) a young
//! collection examines only the young objects once there are `threshold` of them; once the old generation doubled,
//! an incremental pass over it runs in slices of at most `slice_ns`: scan, resolve, count and mark (from objects with
//! outside references, and from every value a tracked field's store overwrote meanwhile: the write barrier
//! `gc_write`), group the unmarked objects into connected candidate groups, verify each group with an indivisible
//! subset collection — the only thing that frees anything, exact at its instant, so the slices need not see a
//! consistent graph —, then drop the registry's dead entries. More slices run from a zero-delay backend timer.

use std::any::Any;
use std::cell::{Cell, RefCell};
use std::rc::{Rc, Weak};
use std::sync::atomic::{AtomicBool, Ordering};

use super::js::JsHashMap;

/// An object of a tracked class.
pub trait GcNode {
    fn gc_traverse(&self, s: &mut GcScan);
    fn gc_clear(&self);
}

const NONE: u32 = u32::MAX;

thread_local! {
    /// Every tracked object made: old ones first. Dead entries leave at the next young collection (young ones) or at
    /// the end of a pass (old ones); a `Weak` keeps the freed object's allocation (and its address) until then.
    static LIVE: RefCell<Vec<Weak<dyn GcNode>>> = const { RefCell::new(Vec::new()) };
    static OLD_END: Cell<usize> = const { Cell::new(0) };
    static OLD_AFTER_PASS: Cell<usize> = const { Cell::new(0) };
    static PASS: RefCell<Option<Box<Pass>>> = const { RefCell::new(None) };
    static TIMER: Cell<bool> = const { Cell::new(false) };
    /// Young objects that start a young collection (usize::MAX: none, as a benchmark sets it).
    static THRESHOLD: Cell<usize> = const { Cell::new(4_000) };
    /// The most objects one indivisible step examines (bigger young generations are promoted unexamined).
    static STEP_MAX: Cell<usize> = const { Cell::new(16_000) };
    static SLICE_NS: Cell<u64> = const { Cell::new(1_000_000) };
    static STATS: Cell<GcStats> = const { Cell::new(GcStats { passes: 0, pass_freed: 0, max_pause_ns: 0 }) };
}

/// While a pass scans and marks: stores into tracked fields report what they overwrite.
static MARKING: AtomicBool = AtomicBool::new(false);

/// Passes started, objects the finished passes freed, the longest collector step (ns).
#[derive(Clone, Copy, Debug, Default)]
pub struct GcStats {
    pub passes: usize,
    pub pass_freed: usize,
    pub max_pause_ns: u64,
}

/// Registers a new object of a tracked class.
pub fn gc_track<T: GcNode + 'static>(rc: Rc<T>) -> Rc<T> {
    let w: Weak<dyn GcNode> = Rc::downgrade(&rc) as Weak<dyn GcNode>;
    LIVE.with(|l| l.borrow_mut().push(w));
    rc
}

/// A value a tracked field holds, as the write barrier sees it: the address the scan knows it by.
pub trait GcRef {
    fn gc_addr(&self) -> Option<usize>;
}
impl<T: ?Sized> GcRef for Rc<T> {
    fn gc_addr(&self) -> Option<usize> {
        Some(Rc::as_ptr(self) as *const () as usize)
    }
}
impl<T: GcRef> GcRef for Option<T> {
    fn gc_addr(&self) -> Option<usize> {
        self.as_ref().and_then(GcRef::gc_addr)
    }
}
impl<T> GcRef for super::js::Arr<T> {
    fn gc_addr(&self) -> Option<usize> {
        Some(self.gc_id().0)
    }
}
impl<T> GcRef for super::js::Map<T> {
    fn gc_addr(&self) -> Option<usize> {
        Some(self.gc_id().0)
    }
}
impl<K, V> GcRef for super::mapset::JsOMap<K, V> {
    fn gc_addr(&self) -> Option<usize> {
        Some(self.gc_id().0)
    }
}

/// The write barrier, before a store into a tracked field: while a pass marks, the value it overwrites may now be
/// held from somewhere the pass already scanned, so it is kept for this pass.
#[inline(always)]
pub fn gc_write<T: GcRef>(field: &super::js::Var<T>) {
    if MARKING.load(Ordering::Relaxed) {
        field.gc_peek(|old| {
            if let Some(a) = old.gc_addr() {
                PASS.with(|p| {
                    if let Some(p) = p.borrow_mut().as_mut() {
                        p.scan.grey_addr(a)
                    }
                })
            }
        })
    }
}

/// The references between tracked objects and the containers they hold (each container once, as a node of its own,
/// held by the scan). Edges are recorded by address and resolved to nodes once every node is numbered.
pub struct GcScan {
    from: u32,
    /// Node ids below this are objects (by registry index in a pass, by position in a subset collection).
    objects: u32,
    /// A node by the address of its allocation.
    index: JsHashMap<usize, u32>,
    /// Each node's strong count when it was found (nothing of the scan held it then).
    rc: Vec<usize>,
    head: Vec<u32>,
    dead: Vec<bool>,
    holds: Vec<Rc<dyn Any>>,
    e_to: Vec<usize>,
    run_start: Vec<u32>,
    run_next: Vec<u32>,
    run_from: u32,
    in_deg: Vec<u32>,
    marked: Vec<bool>,
    greys: Vec<usize>,
    stack: Vec<u32>,
    cursor: usize,
}

impl GcScan {
    fn new(objects: usize) -> GcScan {
        GcScan {
            from: 0,
            objects: objects as u32,
            index: JsHashMap::default(),
            rc: vec![0; objects],
            head: vec![NONE; objects],
            dead: vec![false; objects],
            holds: Vec::new(),
            e_to: Vec::new(),
            run_start: Vec::new(),
            run_next: Vec::new(),
            run_from: NONE,
            in_deg: Vec::new(),
            marked: Vec::new(),
            greys: Vec::new(),
            stack: Vec::new(),
            cursor: 0,
        }
    }
    fn edge(&mut self, to: usize) {
        if self.from != self.run_from {
            self.run_from = self.from;
            let f = self.from as usize;
            self.run_next.push(self.head[f]);
            self.head[f] = self.run_start.len() as u32;
            self.run_start.push(self.e_to.len() as u32);
        }
        self.e_to.push(to);
    }
    /// A reference to an object (an untracked one, or one outside the set, resolves to no edge).
    pub fn rc<T: ?Sized>(&mut self, x: &Rc<T>) {
        self.edge(Rc::as_ptr(x) as *const () as usize);
    }
    /// A container (`addr`, its strong count, a reference to hold it): an edge to it; true the first time (then its
    /// elements are its edges).
    fn enter(&mut self, addr: usize, count: usize, hold: impl FnOnce() -> Rc<dyn Any>) -> bool {
        self.edge(addr);
        if self.index.contains_key(&addr) {
            return false;
        }
        let i = self.rc.len() as u32;
        self.rc.push(count);
        self.head.push(NONE);
        self.index.insert(addr, i);
        self.holds.push(hold());
        self.from = i;
        true
    }
    pub fn arr<T: Clone + 'static>(&mut self, a: &super::js::Arr<T>, f: impl Fn(&mut GcScan, &T)) {
        let saved = self.from;
        let (addr, count) = a.gc_id();
        if self.enter(addr, count, || a.gc_hold()) {
            a.gc_each(|e| f(self, e));
        }
        self.from = saved;
    }
    pub fn map<T: Clone + 'static>(&mut self, m: &super::js::Map<T>, f: impl Fn(&mut GcScan, &T)) {
        let saved = self.from;
        let (addr, count) = m.gc_id();
        if self.enter(addr, count, || m.gc_hold()) {
            m.gc_each(|e| f(self, e));
        }
        self.from = saved;
    }
    /// A Map / Set: `fk` sees each key as often as the map holds it (its index keeps a copy), `fv` each value.
    pub fn omap<K: 'static, V: 'static>(&mut self, m: &super::mapset::JsOMap<K, V>, fk: impl Fn(&mut GcScan, &K), fv: impl Fn(&mut GcScan, &V)) {
        let saved = self.from;
        let (addr, count) = m.gc_id();
        if self.enter(addr, count, || m.gc_hold()) {
            m.gc_each(|k, v| {
                if let Some(k) = k {
                    fk(self, k)
                }
                if let Some(v) = v {
                    fv(self, v)
                }
            });
        }
        self.from = saved;
    }

    fn alive(&self, i: usize) -> bool {
        i >= self.objects as usize || !self.dead[i]
    }
    fn run_end(&self, r: usize) -> usize {
        if r + 1 < self.run_start.len() { self.run_start[r + 1] as usize } else { self.e_to.len() }
    }
    /// Each edge's address becomes its node (or NONE: an object outside the set). Resumable.
    fn resolve(&mut self, c: &mut Clock) -> bool {
        while self.cursor < self.e_to.len() {
            let a = self.e_to[self.cursor];
            self.e_to[self.cursor] = self.index.get(&a).map_or(NONE as usize, |&i| i as usize);
            self.cursor += 1;
            if c.over() {
                return false;
            }
        }
        self.cursor = 0;
        true
    }
    /// The references into each node from the nodes still alive. Resumable.
    fn count_in(&mut self, c: &mut Clock) -> bool {
        if self.in_deg.is_empty() {
            self.in_deg = vec![0; self.rc.len()];
        }
        while self.cursor < self.rc.len() {
            let i = self.cursor;
            self.cursor += 1;
            if !self.alive(i) {
                continue;
            }
            let mut r = self.head[i];
            while r != NONE {
                for k in self.run_start[r as usize] as usize..self.run_end(r as usize) {
                    let t = self.e_to[k];
                    if t != NONE as usize {
                        self.in_deg[t] += 1;
                    }
                }
                r = self.run_next[r as usize];
            }
            if c.over() {
                return false;
            }
        }
        self.cursor = 0;
        true
    }
    fn grey(&mut self, i: usize) {
        if !self.marked[i] {
            self.marked[i] = true;
            self.stack.push(i as u32);
        }
    }
    fn grey_addr(&mut self, a: usize) {
        if self.marked.is_empty() {
            self.greys.push(a)
        } else if let Some(&i) = self.index.get(&a) {
            self.grey(i as usize)
        }
    }
    /// Marks what is reachable from the nodes with outside references and from the greyed ones. Resumable.
    fn mark(&mut self, c: &mut Clock) -> bool {
        if self.marked.is_empty() && !self.rc.is_empty() {
            self.marked = vec![false; self.rc.len()];
            for a in std::mem::take(&mut self.greys) {
                if let Some(&i) = self.index.get(&a) {
                    self.grey(i as usize)
                }
            }
        }
        while self.cursor < self.rc.len() {
            let i = self.cursor;
            self.cursor += 1;
            if !self.marked[i] && self.alive(i) && self.rc[i] > self.in_deg[i] as usize {
                self.grey(i);
            }
            if c.over() {
                return false;
            }
        }
        while let Some(i) = self.stack.pop() {
            let mut r = self.head[i as usize];
            while r != NONE {
                for k in self.run_start[r as usize] as usize..self.run_end(r as usize) {
                    let t = self.e_to[k];
                    if t != NONE as usize && !self.marked[t] && self.alive(t) {
                        self.marked[t] = true;
                        self.stack.push(t as u32);
                    }
                }
                r = self.run_next[r as usize];
            }
            if c.over() {
                return false;
            }
        }
        self.cursor = 0;
        true
    }
}

/// A slice's deadline (checked every 64 units of work).
struct Clock {
    end: Option<u64>,
    n: u32,
}

impl Clock {
    fn unlimited() -> Clock {
        Clock { end: None, n: 0 }
    }
    fn over(&mut self) -> bool {
        self.n = self.n.wrapping_add(1);
        self.n & 63 == 0 && self.over_now()
    }
    fn over_now(&self) -> bool {
        self.end.is_some_and(|e| now_ns() >= e)
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn now_ns() -> u64 {
    thread_local!(static START: std::time::Instant = std::time::Instant::now());
    START.with(|s| s.elapsed().as_nanos() as u64)
}

#[cfg(target_arch = "wasm32")]
fn now_ns() -> u64 {
    (super::backend::now() * 1e6) as u64
}

/// Collects the objects at registry indices `members` in one indivisible step. Returns how many it freed.
fn collect_subset(members: &[usize]) -> usize {
    let n = members.len();
    if n == 0 {
        return 0;
    }
    let weaks: Vec<Weak<dyn GcNode>> = LIVE.with(|l| {
        let l = l.borrow();
        members.iter().map(|&i| l[i].clone()).collect()
    });
    let mut s = GcScan::new(n);
    // Counts first (nothing holds the objects), then each one's references (held only while it reports them).
    for (k, w) in weaks.iter().enumerate() {
        s.index.insert(w.as_ptr() as *const () as usize, k as u32);
        s.rc[k] = w.strong_count();
        s.dead[k] = s.rc[k] == 0;
    }
    for (k, w) in weaks.iter().enumerate() {
        if let Some(o) = w.upgrade() {
            s.from = k as u32;
            o.gc_traverse(&mut s);
        }
    }
    let mut c = Clock::unlimited();
    s.resolve(&mut c);
    s.count_in(&mut c);
    s.mark(&mut c);
    // Garbage: held while each drops its references (so none is freed under a gc_clear), then released.
    let garbage: Vec<Rc<dyn GcNode>> = (0..n).filter(|&k| !s.marked[k]).filter_map(|k| weaks[k].upgrade()).collect();
    drop(s);
    for g in &garbage {
        g.gc_clear();
    }
    garbage.len()
}

/// The incremental pass over the old generation's objects at registry indices `[0, end)` (they keep their index:
/// nothing leaves that range of the registry until the pass ends).
struct Pass {
    end: usize,
    scan: GcScan,
    phase: u8,
    cursor: usize,
    write: usize,
    parent: Vec<u32>,
    member_head: Vec<u32>,
    member_next: Vec<u32>,
    groups: Vec<u32>,
    freed: usize,
}

impl Pass {
    fn find(&mut self, mut x: usize) -> usize {
        while self.parent[x] as usize != x {
            self.parent[x] = self.parent[self.parent[x] as usize];
            x = self.parent[x] as usize;
        }
        x
    }

    /// Runs until the clock's deadline; true once the pass is over. The registry is borrowed only for short reads.
    fn step(&mut self, c: &mut Clock) -> bool {
        loop {
            match self.phase {
                0 => {
                    while self.cursor < self.end {
                        let i = self.cursor;
                        self.cursor += 1;
                        let w = LIVE.with(|l| l.borrow()[i].clone());
                        let count = w.strong_count();
                        let s = &mut self.scan;
                        if count == 0 {
                            s.dead[i] = true;
                            continue;
                        }
                        s.index.insert(w.as_ptr() as *const () as usize, i as u32);
                        s.rc[i] = count;
                        if let Some(o) = w.upgrade() {
                            s.from = i as u32;
                            o.gc_traverse(s);
                        }
                        if c.over() {
                            return false;
                        }
                    }
                    // Every count is read: the containers need not stay.
                    self.scan.holds = Vec::new();
                    self.cursor = 0;
                    self.phase = 1;
                }
                1 => {
                    if !self.scan.resolve(c) {
                        return false;
                    }
                    self.phase = 2;
                }
                2 => {
                    if !self.scan.count_in(c) {
                        return false;
                    }
                    self.phase = 3;
                }
                3 => {
                    if !self.scan.mark(c) {
                        return false;
                    }
                    MARKING.store(false, Ordering::Relaxed);
                    self.scan.in_deg = Vec::new();
                    self.parent = (0..self.scan.rc.len() as u32).collect();
                    self.phase = 4;
                }
                4 => {
                    while self.cursor < self.scan.rc.len() {
                        let i = self.cursor;
                        self.cursor += 1;
                        if self.scan.marked[i] || !self.scan.alive(i) {
                            continue;
                        }
                        let mut r = self.scan.head[i];
                        while r != NONE {
                            for k in self.scan.run_start[r as usize] as usize..self.scan.run_end(r as usize) {
                                let t = self.scan.e_to[k];
                                if t != NONE as usize && !self.scan.marked[t] && self.scan.alive(t) {
                                    let (a, b) = (self.find(i), self.find(t));
                                    if a != b {
                                        self.parent[a.max(b)] = a.min(b) as u32;
                                    }
                                }
                            }
                            r = self.scan.run_next[r as usize];
                        }
                        if c.over() {
                            return false;
                        }
                    }
                    self.cursor = 0;
                    self.member_head = vec![NONE; self.scan.rc.len()];
                    self.member_next = vec![NONE; self.end];
                    self.phase = 5;
                }
                5 => {
                    while self.cursor < self.end {
                        let i = self.cursor;
                        self.cursor += 1;
                        if self.scan.marked[i] || self.scan.dead[i] {
                            continue;
                        }
                        let r = self.find(i);
                        if self.member_head[r] == NONE {
                            self.groups.push(r as u32);
                        }
                        self.member_next[i] = self.member_head[r];
                        self.member_head[r] = i as u32;
                        if c.over() {
                            return false;
                        }
                    }
                    self.cursor = 0;
                    self.scan = GcScan::new(0);
                    self.parent = Vec::new();
                    self.phase = 6;
                }
                6 => {
                    let step_max = STEP_MAX.with(Cell::get);
                    while self.cursor < self.groups.len() {
                        let mut members = Vec::new();
                        while self.cursor < self.groups.len() && members.len() < step_max {
                            let mut m = self.member_head[self.groups[self.cursor] as usize];
                            self.cursor += 1;
                            while m != NONE {
                                members.push(m as usize);
                                m = self.member_next[m as usize];
                            }
                        }
                        self.freed += collect_subset(&members);
                        if c.over_now() {
                            return false;
                        }
                    }
                    self.member_head = Vec::new();
                    self.member_next = Vec::new();
                    self.groups = Vec::new();
                    self.cursor = 0;
                    self.phase = 7;
                }
                _ => {
                    // Compaction: the live entries of [0, end) move down; the dead ones leave at the end.
                    let done = LIVE.with(|l| {
                        let mut l = l.borrow_mut();
                        while self.cursor < self.end {
                            if l[self.cursor].strong_count() > 0 {
                                l.swap(self.write, self.cursor);
                                self.write += 1;
                            }
                            self.cursor += 1;
                            if c.over() {
                                return false;
                            }
                        }
                        l.drain(self.write..self.end);
                        true
                    });
                    if !done {
                        return false;
                    }
                    OLD_END.with(|o| o.set(o.get() - (self.end - self.write)));
                    return true;
                }
            }
        }
    }
}

/// A young collection: the objects made since the last one, alone (old objects' references count as outside
/// references), then they all become old. More than `STEP_MAX` (a long synchronous burst) are promoted unexamined.
fn young() {
    let lo = OLD_END.with(Cell::get);
    let n = LIVE.with(|l| {
        let mut l = l.borrow_mut();
        // The young entries of objects already freed leave first.
        let mut w = lo;
        for r in lo..l.len() {
            if l[r].strong_count() > 0 {
                l.swap(w, r);
                w += 1;
            }
        }
        l.truncate(w);
        w - lo
    });
    if n > 0 && n <= STEP_MAX.with(Cell::get) {
        let members: Vec<usize> = (lo..lo + n).collect();
        collect_subset(&members);
    }
    LIVE.with(|l| {
        let mut l = l.borrow_mut();
        let mut w = lo;
        for r in lo..l.len() {
            if l[r].strong_count() > 0 {
                l.swap(w, r);
                w += 1;
            }
        }
        l.truncate(w);
        OLD_END.with(|o| o.set(w));
    });
}

/// Starts an incremental pass over the old generation now (the young objects first become old), unless one runs.
pub fn gc_start_pass() {
    if PASS.with(|p| p.borrow().is_some()) {
        return;
    }
    let end = LIVE.with(|l| l.borrow().len());
    OLD_END.with(|o| o.set(end));
    PASS.with(|p| {
        *p.borrow_mut() = Some(Box::new(Pass { end, scan: GcScan::new(end), phase: 0, cursor: 0, write: 0, parent: Vec::new(), member_head: Vec::new(), member_next: Vec::new(), groups: Vec::new(), freed: 0 }))
    });
    STATS.with(|s| s.set(GcStats { passes: s.get().passes + 1, ..s.get() }));
    MARKING.store(true, Ordering::Relaxed);
}

/// Ends a running pass at once (its candidates are dropped; the registry is compacted).
fn abort_pass() {
    let Some(mut p) = PASS.with(|p| p.borrow_mut().take()) else { return };
    MARKING.store(false, Ordering::Relaxed);
    if p.phase < 7 {
        p.phase = 7;
        p.cursor = 0;
        p.write = 0;
    }
    p.step(&mut Clock::unlimited());
}

/// Frees every tracked object only tracked garbage reaches, now, in one step over the whole registry (tests, memory
/// pressure). A running pass is ended first. Returns how many objects it freed.
pub fn gc_collect() -> usize {
    abort_pass();
    LIVE.with(|l| l.borrow_mut().retain(|w| w.strong_count() > 0));
    let n = LIVE.with(|l| l.borrow().len());
    let members: Vec<usize> = (0..n).collect();
    let freed = collect_subset(&members);
    LIVE.with(|l| l.borrow_mut().retain(|w| w.strong_count() > 0));
    let alive = LIVE.with(|l| l.borrow().len());
    OLD_END.with(|o| o.set(alive));
    OLD_AFTER_PASS.with(|o| o.set(alive));
    freed
}

/// One collector step at a safe point: a young collection once `threshold` young objects exist; a pass once the old
/// generation doubled since the last (at least 10 000 more); then a slice of the running pass, up to `slice_ns`.
pub fn gc_step() {
    let t0 = now_ns();
    let (len, old) = (LIVE.with(|l| l.borrow().len()), OLD_END.with(Cell::get));
    if len - old >= THRESHOLD.with(Cell::get) {
        young();
    }
    let (old, after) = (OLD_END.with(Cell::get), OLD_AFTER_PASS.with(Cell::get));
    if PASS.with(|p| p.borrow().is_none()) && old >= after && old - after >= after.max(10_000) {
        gc_start_pass();
    }
    // The pass leaves its cell while it runs (a collection inside frees objects; nothing reenters the pass).
    if let Some(mut p) = PASS.with(|p| p.borrow_mut().take()) {
        let mut c = Clock { end: Some(t0 + SLICE_NS.with(Cell::get)), n: 0 };
        if p.step(&mut c) {
            MARKING.store(false, Ordering::Relaxed);
            OLD_AFTER_PASS.with(|o| o.set(OLD_END.with(Cell::get)));
            STATS.with(|s| s.set(GcStats { pass_freed: s.get().pass_freed + p.freed, ..s.get() }));
        } else {
            PASS.with(|c| *c.borrow_mut() = Some(p));
        }
    }
    let t = now_ns() - t0;
    STATS.with(|s| s.set(GcStats { max_pause_ns: s.get().max_pause_ns.max(t), ..s.get() }));
    if gc_pass_active() && !TIMER.with(|t| t.replace(true)) {
        // More slices from the main loop (a zero-delay timer), between the app's own events.
        if let Some(b) = super::backend::try_backend() {
            b.set_timer(0, Box::new(|| {
                TIMER.with(|t| t.set(false));
                if gc_pass_active() {
                    gc_step();
                }
            }));
        } else {
            TIMER.with(|t| t.set(false));
        }
    }
}

pub fn gc_pass_active() -> bool {
    PASS.with(|p| p.borrow().is_some())
}

/// How many tracked objects are alive.
pub fn gc_live() -> usize {
    LIVE.with(|l| l.borrow().iter().filter(|w| w.strong_count() > 0).count())
}

/// Young objects that start a young collection (usize::MAX: no automatic collection, as a benchmark sets it).
pub fn gc_set_threshold(n: usize) {
    THRESHOLD.with(|t| t.set(n));
}

/// The longest slice (ns) and the most objects one indivisible step examines.
pub fn gc_set_slice(slice_ns: u64, step_max: usize) {
    SLICE_NS.with(|s| s.set(slice_ns));
    STEP_MAX.with(|s| s.set(step_max));
}

pub fn gc_stats() -> GcStats {
    STATS.with(Cell::get)
}

pub fn gc_reset_max_pause() {
    STATS.with(|s| s.set(GcStats { max_pause_ns: 0, ..s.get() }));
}

/// At a safe point (a microtask drain's end).
pub(crate) fn gc_maybe() {
    let young = LIVE.with(|l| l.borrow().len()) - OLD_END.with(Cell::get);
    if gc_pass_active() || young >= THRESHOLD.with(Cell::get) {
        gc_step();
    }
}
