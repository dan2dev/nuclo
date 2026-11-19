//! WeakMap, WeakSet and WeakRef (lib4): objects by identity, held weakly.

use std::any::Any;
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::{Rc, Weak};

/// A value held by reference that can be held weakly: an instance (`Rc<T>`), an array or a record.
pub trait JsWeakKey: Clone + 'static {
    type W: Clone;
    fn downgrade(&self) -> Self::W;
    fn upgrade(w: &Self::W) -> Option<Self>;
    fn alive(w: &Self::W) -> bool;
    /// The address of the shared allocation: a weak handle keeps it allocated, so no other object reuses it meanwhile.
    fn weak_addr(&self) -> usize;
}

impl<T: ?Sized + 'static> JsWeakKey for Rc<T> {
    type W = Weak<T>;
    fn downgrade(&self) -> Weak<T> {
        Rc::downgrade(self)
    }
    fn upgrade(w: &Weak<T>) -> Option<Self> {
        w.upgrade()
    }
    fn alive(w: &Weak<T>) -> bool {
        w.strong_count() > 0
    }
    fn weak_addr(&self) -> usize {
        Rc::as_ptr(self) as *const () as usize
    }
}

thread_local! {
    /// The targets `new WeakRef(x)` / `deref()` gave during the current job: kept until its microtasks have run.
    static KEPT: RefCell<Vec<Box<dyn Any>>> = RefCell::default();
}

fn keep<K: JsWeakKey>(k: &K) {
    KEPT.with(|kept| kept.borrow_mut().push(Box::new(k.clone())));
    super::task::schedule_drain_pub();
}

/// The job is over (task.rs, after its microtasks): WeakRef targets are no longer kept.
pub(crate) fn clear_kept() {
    let kept = KEPT.with(|kept| std::mem::take(&mut *kept.borrow_mut()));
    drop(kept);
}

struct Inner<K: JsWeakKey, V> {
    slots: HashMap<usize, (K::W, V)>,
    sweep_at: usize,
}

/// `WeakMap<K, V>` (a `WeakSet` has `V == ()`): entries by the key's identity, the key held weakly (a dead key's entry
/// is dropped by the next sweep, which runs as the map grows), not iterable.
pub struct JsWeakMap<K: JsWeakKey, V>(Rc<RefCell<Inner<K, V>>>);

impl<K: JsWeakKey, V> Clone for JsWeakMap<K, V> {
    fn clone(&self) -> Self {
        JsWeakMap(self.0.clone())
    }
}

impl<K: JsWeakKey, V> PartialEq for JsWeakMap<K, V> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl<K: JsWeakKey, V: Clone> JsWeakMap<K, V> {
    pub fn new() -> Self {
        JsWeakMap(Rc::new(RefCell::new(Inner { slots: HashMap::new(), sweep_at: 16 })))
    }
    // A live key's address is its own while the entry exists: the address finds the entry.
    pub fn get(&self, k: &K) -> Option<V> {
        self.0.borrow().slots.get(&k.weak_addr()).map(|e| e.1.clone())
    }
    pub fn has(&self, k: &K) -> bool {
        self.0.borrow().slots.contains_key(&k.weak_addr())
    }
    pub fn set(&self, k: K, v: V) -> Self {
        let (old, swept) = {
            let mut inner = self.0.borrow_mut();
            let old = inner.slots.insert(k.weak_addr(), (k.downgrade(), v));
            let mut swept = Vec::new();
            if inner.slots.len() >= inner.sweep_at {
                let dead: Vec<usize> = inner.slots.iter().filter(|(_, e)| !K::alive(&e.0)).map(|(a, _)| *a).collect();
                for a in dead {
                    swept.extend(inner.slots.remove(&a));
                }
                inner.sweep_at = (inner.slots.len() * 2).max(16);
            }
            (old, swept)
        };
        // Old values are dropped after the borrow ends.
        drop((old, swept));
        self.clone()
    }
    pub fn delete(&self, k: &K) -> bool {
        let old = self.0.borrow_mut().slots.remove(&k.weak_addr());
        old.is_some()
    }
}

impl<K: JsWeakKey> JsWeakMap<K, ()> {
    pub fn add(&self, k: K) -> Self {
        self.set(k, ())
    }
}

/// `WeakRef<T>`: its target while something else holds it (and until the job that made or read it ends).
pub struct JsWeakRef<K: JsWeakKey>(K::W);

impl<K: JsWeakKey> Clone for JsWeakRef<K> {
    fn clone(&self) -> Self {
        JsWeakRef(self.0.clone())
    }
}

impl<K: JsWeakKey> JsWeakRef<K> {
    pub fn new(k: K) -> Self {
        keep(&k);
        JsWeakRef(k.downgrade())
    }
    pub fn deref(&self) -> Option<K> {
        let k = K::upgrade(&self.0)?;
        keep(&k);
        Some(k)
    }
}
