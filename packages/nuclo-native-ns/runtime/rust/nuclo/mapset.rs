//! JavaScript's `Map` and `Set` (a Set is a `JsOMap<K, ()>`): shared, insertion-ordered hash maps.
//!
//! Keys compare by SameValueZero (numbers: NaN is NaN, -0 is +0; strings by content; booleans; bigints by value) or
//! by identity (objects, arrays, maps). A delete leaves a hole until the slots are compacted. Each slot keeps the
//! sequence number it was added with, so iteration (`next(s)`: the entry after `s`) is live as in JavaScript: an
//! entry deleted before its turn is skipped, one added during the loop is visited, compaction or `clear()` under a
//! running loop loses nothing.

use std::cell::RefCell;
use std::hash::{Hash, Hasher};
use std::rc::Rc;

use super::bigint::JsBigInt;
use super::js::{Arr, Map};

/// How a key is hashed and compared.
pub trait JsHashKey: Clone {
    fn js_hash<H: Hasher>(&self, h: &mut H);
    fn js_eq(&self, other: &Self) -> bool;
    /// What is stored (-0 becomes +0).
    fn js_norm(self) -> Self {
        self
    }
}

impl JsHashKey for f64 {
    fn js_hash<H: Hasher>(&self, h: &mut H) {
        h.write_u64(if *self == 0.0 { 0 } else if self.is_nan() { 0x7ff8_0000_0000_0000 } else { self.to_bits() })
    }
    fn js_eq(&self, other: &Self) -> bool {
        self == other || (self.is_nan() && other.is_nan())
    }
    fn js_norm(self) -> Self {
        if self == 0.0 { 0.0 } else { self }
    }
}

macro_rules! by_value {
    ($($t:ty),*) => {$(
        impl JsHashKey for $t {
            fn js_hash<H: Hasher>(&self, h: &mut H) { self.hash(h) }
            fn js_eq(&self, other: &Self) -> bool { self == other }
        }
    )*};
}
by_value!(i64, bool, String, JsBigInt);

impl<T: ?Sized> JsHashKey for Rc<T> {
    fn js_hash<H: Hasher>(&self, h: &mut H) {
        h.write_usize(Rc::as_ptr(self) as *const () as usize)
    }
    fn js_eq(&self, other: &Self) -> bool {
        Rc::as_ptr(self) as *const () == Rc::as_ptr(other) as *const ()
    }
}

impl<T: Clone> JsHashKey for Arr<T> {
    fn js_hash<H: Hasher>(&self, h: &mut H) {
        h.write_usize(self.addr())
    }
    fn js_eq(&self, other: &Self) -> bool {
        self == other
    }
}

impl<T: Clone> JsHashKey for Map<T> {
    fn js_hash<H: Hasher>(&self, h: &mut H) {
        h.write_usize(self.addr())
    }
    fn js_eq(&self, other: &Self) -> bool {
        self == other
    }
}

impl<K, V> JsHashKey for JsOMap<K, V> {
    fn js_hash<H: Hasher>(&self, h: &mut H) {
        h.write_usize(Rc::as_ptr(&self.0) as *const () as usize)
    }
    fn js_eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

/// A key as the index hashes it.
#[repr(transparent)]
struct Kw<K>(K);

impl<K: JsHashKey> Hash for Kw<K> {
    fn hash<H: Hasher>(&self, h: &mut H) {
        self.0.js_hash(h)
    }
}
impl<K: JsHashKey> PartialEq for Kw<K> {
    fn eq(&self, other: &Self) -> bool {
        self.0.js_eq(&other.0)
    }
}
impl<K: JsHashKey> Eq for Kw<K> {}

fn kw<K>(k: &K) -> &Kw<K> {
    // SAFETY: `Kw` is a transparent wrapper of `K`.
    unsafe { &*(k as *const K as *const Kw<K>) }
}

struct Inner<K, V> {
    index: super::js::JsHashMap<Kw<K>, usize>,
    slots: Vec<Option<(K, V)>>,
    seqs: Vec<i64>,
    next_seq: i64,
    /// The slot of the sequence number `next` returned last.
    cur: usize,
}

impl<K, V> Inner<K, V> {
    fn after(&self, s: i64) -> usize {
        self.seqs.partition_point(|&x| x <= s)
    }
    fn slot_of(&self, s: i64) -> usize {
        if self.seqs.get(self.cur) == Some(&s) { self.cur } else { self.after(s - 1) }
    }
}

pub struct JsOMap<K, V>(Rc<RefCell<Inner<K, V>>>);
pub type JsOSet<K> = JsOMap<K, ()>;

impl<K, V> Clone for JsOMap<K, V> {
    fn clone(&self) -> Self {
        JsOMap(self.0.clone())
    }
}

impl<K, V> PartialEq for JsOMap<K, V> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl<K, V> JsOMap<K, V> {
    /// For the cycle collector (gc.rs): the storage's address and strong count; each key as often as the map holds
    /// it (the index keeps a copy of each), each value once.
    pub(crate) fn gc_id(&self) -> (usize, usize) {
        (Rc::as_ptr(&self.0) as *const () as usize, Rc::strong_count(&self.0))
    }
    /// A reference that keeps the storage alive (the collector holds what it scanned).
    pub(crate) fn gc_hold(&self) -> Rc<dyn std::any::Any>
    where
        K: 'static,
        V: 'static,
    {
        self.0.clone()
    }
    pub(crate) fn gc_each(&self, mut f: impl FnMut(Option<&K>, Option<&V>)) {
        let m = self.0.borrow();
        for k in m.index.keys() {
            f(Some(&k.0), None)
        }
        for (k, v) in m.slots.iter().flatten() {
            f(Some(k), Some(v))
        }
    }
}

impl<K: JsHashKey, V: Clone> JsOMap<K, V> {
    pub fn new() -> Self {
        JsOMap(Rc::new(RefCell::new(Inner { index: Default::default(), slots: Vec::new(), seqs: Vec::new(), next_seq: 0, cur: 0 })))
    }
    pub fn size(&self) -> i64 {
        self.0.borrow().index.len() as i64
    }
    pub fn get(&self, k: &K) -> Option<V> {
        let m = self.0.borrow();
        m.index.get(kw(k)).map(|&i| m.slots[i].as_ref().unwrap().1.clone())
    }
    pub fn has(&self, k: &K) -> bool {
        self.0.borrow().index.contains_key(kw(k))
    }
    pub fn set(&self, k: K, v: V) -> Self {
        let old = {
            let mut m = self.0.borrow_mut();
            let m = &mut *m;
            if let Some(&i) = m.index.get(kw(&k)) {
                Some(std::mem::replace(&mut m.slots[i].as_mut().unwrap().1, v))
            } else {
                let k = k.js_norm();
                m.index.insert(Kw(k.clone()), m.slots.len());
                m.slots.push(Some((k, v)));
                m.seqs.push(m.next_seq);
                m.next_seq += 1;
                None
            }
        };
        // Dropped once the map is released: a value's drop may touch the map.
        drop(old);
        self.clone()
    }
    pub fn delete(&self, k: &K) -> bool {
        let old = {
            let mut m = self.0.borrow_mut();
            let m = &mut *m;
            let Some(i) = m.index.remove(kw(k)) else { return false };
            let old = m.slots[i].take();
            // Mostly holes: compact, so the slots stay proportional to the entries.
            if m.slots.len() > 16 && m.index.len() * 2 < m.slots.len() {
                let mut j = 0;
                for p in 0..m.slots.len() {
                    if m.slots[p].is_some() {
                        m.slots.swap(j, p);
                        m.seqs[j] = m.seqs[p];
                        *m.index.get_mut(kw(&m.slots[j].as_ref().unwrap().0)).unwrap() = j;
                        j += 1;
                    }
                }
                m.slots.truncate(j);
                m.seqs.truncate(j);
                m.cur = 0;
            }
            old
        };
        drop(old);
        true
    }
    pub fn clear(&self) {
        let old = {
            let mut m = self.0.borrow_mut();
            m.index.clear();
            m.seqs.clear();
            m.cur = 0;
            std::mem::take(&mut m.slots)
        };
        drop(old);
    }
    /// The sequence number of the first live entry after `s` (-1: from the start), or -1 at the end.
    pub fn next(&self, s: i64) -> i64 {
        let mut m = self.0.borrow_mut();
        let mut p = if s < 0 { 0 } else if m.seqs.get(m.cur) == Some(&s) { m.cur + 1 } else { m.after(s) };
        while p < m.slots.len() && m.slots[p].is_none() {
            p += 1;
        }
        if p >= m.slots.len() {
            return -1;
        }
        m.cur = p;
        m.seqs[p]
    }
    pub fn key_at(&self, s: i64) -> K {
        let m = self.0.borrow();
        m.slots[m.slot_of(s)].as_ref().unwrap().0.clone()
    }
    pub fn value_at(&self, s: i64) -> V {
        let m = self.0.borrow();
        m.slots[m.slot_of(s)].as_ref().unwrap().1.clone()
    }
    fn entry(&self) -> (K, V) {
        let m = self.0.borrow();
        m.slots[m.cur].clone().unwrap()
    }
    pub fn for_each(&self, f: impl Fn(V, K)) {
        let mut s = -1;
        loop {
            s = self.next(s);
            if s < 0 {
                return;
            }
            let (k, v) = self.entry();
            f(v, k);
        }
    }
    fn live(&self) -> Vec<(K, V)> {
        self.0.borrow().slots.iter().flatten().cloned().collect()
    }
    pub fn keys_arr(&self) -> Arr<K> {
        self.live().into_iter().map(|(k, _)| k).collect::<Vec<_>>().into()
    }
    pub fn values_arr(&self) -> Arr<V> {
        self.live().into_iter().map(|(_, v)| v).collect::<Vec<_>>().into()
    }
    pub fn pairs<T>(&self, f: impl Fn(K, V) -> T) -> Arr<T> {
        self.live().into_iter().map(|(k, v)| f(k, v)).collect::<Vec<_>>().into()
    }
    pub fn copy(&self) -> Self {
        let m = Self::new();
        for (k, v) in self.live() {
            m.set(k, v);
        }
        m
    }
    pub fn set_all(&self, ks: Arr<K>, vs: Arr<V>) -> Self {
        for (k, v) in ks.to_vec().into_iter().zip(vs.to_vec()) {
            self.set(k, v);
        }
        self.clone()
    }
}

impl<K: JsHashKey> JsOMap<K, ()> {
    pub fn add(&self, k: K) -> Self {
        self.set(k, ())
    }
    pub fn add_all(&self, ks: Arr<K>) -> Self {
        for k in ks.to_vec() {
            self.set(k, ());
        }
        self.clone()
    }
    pub fn for_each_set(&self, f: impl Fn(K, K)) {
        self.for_each(|_, k| f(k.clone(), k))
    }
}
