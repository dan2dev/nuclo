//! JavaScript's value model for the generated code: shared mutable variables, arrays and maps
//! with reference semantics, and numbers formatted as JavaScript formats them.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::thread::LocalKey;

use super::task::JsError;

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

/// A variable any closure may read and write: a global, an interface field, or a local that a
/// closure captures and something reassigns. Empty until its declaration runs.
pub struct Var<T>(RefCell<Option<T>>);

impl<T: Clone> Var<T> {
    pub const fn empty() -> Self {
        Var(RefCell::new(None))
    }
    pub fn new(value: T) -> Self {
        Var(RefCell::new(Some(value)))
    }
    pub fn get(&self) -> T {
        self.0.borrow().clone().expect("a variable was read before its declaration ran")
    }
    pub fn set(&self, value: T) {
        // The old value is dropped after the borrow ends: dropping it may run code that reads this variable.
        let old = self.0.replace(Some(value));
        drop(old);
    }
}

impl<T> Var<T> {
    /// The cycle collector's read of the value (gc.rs): borrowed, no clone, so no reference is added.
    pub fn gc_peek(&self, f: impl FnOnce(&T)) {
        if let Some(v) = self.0.borrow().as_ref() {
            f(v)
        }
    }
    /// The cycle collector drops the value of a garbage object's field (it is never read again).
    pub fn gc_clear(&self) {
        let old = self.0.replace(None);
        drop(old);
    }
}

/// A field pointing back at the object that owns this one (the compiler proved the owner is alive at every read):
/// a `Weak`, so the two never keep each other alive. Same `get` / `set` as `Var<Option<Rc<T>>>`.
pub struct WeakVar<T: ?Sized>(RefCell<Option<std::rc::Weak<T>>>);

impl<T: ?Sized> WeakVar<T> {
    pub fn new(value: Option<Rc<T>>) -> Self {
        WeakVar(RefCell::new(value.as_ref().map(Rc::downgrade)))
    }
    pub fn get(&self) -> Option<Rc<T>> {
        self.0.borrow().as_ref().and_then(|w| w.upgrade())
    }
    pub fn set(&self, value: Option<Rc<T>>) {
        *self.0.borrow_mut() = value.as_ref().map(Rc::downgrade);
    }
}

/// Globals are thread-locals (the UI thread owns all app state): `g::count.get()`.
pub trait Global<T> {
    fn get(&'static self) -> T;
    fn set(&'static self, value: T);
}

impl<T: Clone + 'static> Global<T> for LocalKey<Var<T>> {
    fn get(&'static self) -> T {
        self.with(|v| v.get())
    }
    fn set(&'static self, value: T) {
        self.with(|v| v.set(value))
    }
}

// ---------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------

/// A JavaScript array: a handle to shared storage, so reading a global array copies a pointer,
/// never the elements. Equality is identity, as `===` is.
pub struct Arr<T>(Rc<RefCell<Vec<T>>>);

/// `xs[i]!` out of range: JavaScript reads undefined and goes on, the native element type can't hold it. The trap
/// says which JavaScript operation it was (the same words on every target).
#[cold]
#[inline(never)]
pub fn js_trap_index(i: i64, len: i64) -> ! {
    panic!("nuclo: xs[i]! read index {i} of an array of length {len}: JavaScript gives undefined there, which the element type can't hold. Test the index (i < xs.length) or use xs[i] ?? fallback.")
}

impl<T> Clone for Arr<T> {
    fn clone(&self) -> Self {
        Arr(self.0.clone())
    }
}

impl<T> PartialEq for Arr<T> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl<T> From<Vec<T>> for Arr<T> {
    fn from(items: Vec<T>) -> Self {
        Arr(Rc::new(RefCell::new(items)))
    }
}

fn clamp_index(i: i64, len: usize) -> usize {
    if i < 0 {
        (len as i64 + i).max(0) as usize
    } else {
        (i as usize).min(len)
    }
}

impl<T> Arr<T> {
    /// For the cycle collector (gc.rs): the storage's address and strong count, and each element by reference.
    pub(crate) fn gc_id(&self) -> (usize, usize) {
        (Rc::as_ptr(&self.0) as *const () as usize, Rc::strong_count(&self.0))
    }
    /// A reference that keeps the storage alive (the collector holds what it scanned).
    pub(crate) fn gc_hold(&self) -> Rc<dyn std::any::Any>
    where
        T: 'static,
    {
        self.0.clone()
    }
    pub(crate) fn gc_each(&self, mut f: impl FnMut(&T)) {
        for e in self.0.borrow().iter() {
            f(e)
        }
    }
}

impl<T: Clone> Arr<T> {
    pub fn new() -> Self {
        Vec::new().into()
    }
    pub(crate) fn addr(&self) -> usize {
        Rc::as_ptr(&self.0) as *const () as usize
    }
    pub fn len(&self) -> i64 {
        self.0.borrow().len() as i64
    }
    /// `xs[i]`, undefined when out of range.
    pub fn at(&self, i: i64) -> Option<T> {
        if i < 0 {
            return None;
        }
        self.0.borrow().get(i as usize).cloned()
    }
    /// `xs[i]!`: traps when out of range, as the other targets do.
    pub fn get(&self, i: i64) -> T {
        match self.at(i) {
            Some(v) => v,
            None => js_trap_index(i, self.len()),
        }
    }
    pub fn set_at(&self, i: i64, value: T) {
        let mut items = self.0.borrow_mut();
        let i = i as usize;
        if i < items.len() {
            items[i] = value;
        } else if i == items.len() {
            items.push(value);
        } else {
            panic!("array index out of range");
        }
    }
    pub fn push(&self, value: T) {
        self.0.borrow_mut().push(value);
    }
    pub fn push_all(&self, values: Arr<T>) {
        let values = values.to_vec();
        self.0.borrow_mut().extend(values);
    }
    pub fn pop(&self) -> Option<T> {
        self.0.borrow_mut().pop()
    }
    pub fn unshift(&self, value: T) {
        self.0.borrow_mut().insert(0, value);
    }
    pub fn splice(&self, start: i64, count: i64) -> Arr<T> {
        let mut items = self.0.borrow_mut();
        let from = clamp_index(start, items.len());
        let to = (from + count.max(0) as usize).min(items.len());
        items.drain(from..to).collect::<Vec<_>>().into()
    }
    pub fn slice(&self, start: i64, end: Option<i64>) -> Arr<T> {
        let items = self.0.borrow();
        let from = clamp_index(start, items.len());
        let to = end.map_or(items.len(), |e| clamp_index(e, items.len()));
        if from < to { items[from..to].to_vec() } else { Vec::new() }.into()
    }
    pub fn to_vec(&self) -> Vec<T> {
        self.0.borrow().clone()
    }
    /// Reads each element as it is reached and holds no borrow while the caller runs, so a
    /// callback may change the array, as it may in JavaScript.
    pub fn iter(&self) -> ArrIter<T> {
        ArrIter { arr: self.clone(), next: 0 }
    }
    pub fn find(&self, f: impl Fn(T) -> bool) -> Option<T> {
        self.iter().find(|item| f(item.clone()))
    }
    pub fn find_index(&self, f: impl Fn(T) -> bool) -> i64 {
        self.iter().position(f).map_or(-1, |i| i as i64)
    }
    pub fn filter(&self, f: impl Fn(T) -> bool) -> Arr<T> {
        self.iter().filter(|item| f(item.clone())).collect::<Vec<_>>().into()
    }
    pub fn map<U>(&self, f: impl Fn(T) -> U) -> Arr<U> {
        self.iter().map(f).collect::<Vec<_>>().into()
    }
    pub fn some(&self, f: impl Fn(T) -> bool) -> bool {
        self.iter().any(f)
    }
    pub fn every(&self, f: impl Fn(T) -> bool) -> bool {
        self.iter().all(f)
    }
    pub fn for_each(&self, f: impl Fn(T)) {
        self.iter().for_each(f)
    }
    /// `[...a, ...b]` / `a.concat(b)`.
    pub fn concat(parts: Vec<Arr<T>>) -> Arr<T> {
        parts.iter().flat_map(|p| p.to_vec()).collect::<Vec<_>>().into()
    }
    /// JavaScript's `sort`: stable, and the same merge sort on every target, so even a comparator
    /// that contradicts itself orders the same way everywhere. A positive result puts `b` first.
    /// The comparator runs on a copy: it may read the array, as it may in JavaScript.
    pub fn sort(&self, cmp: impl Fn(T, T) -> f64) -> Arr<T> {
        match self.try_sort(|a, b| Ok(cmp(a, b))) {
            Ok(sorted) => sorted,
            Err(_) => unreachable!(),
        }
    }
    /// `sort` with a comparator that can throw: then the array is left as it was, as in JavaScript.
    pub fn try_sort(&self, cmp: impl Fn(T, T) -> Result<f64, JsError>) -> Result<Arr<T>, JsError> {
        let mut a = self.to_vec();
        let mut b = a.clone();
        let n = a.len();
        let mut width = 1;
        while width < n {
            let mut start = 0;
            while start < n {
                let (mid, end) = ((start + width).min(n), (start + 2 * width).min(n));
                let (mut l, mut r, mut k) = (start, mid, start);
                while l < mid && r < end {
                    if cmp(a[l].clone(), a[r].clone())? > 0.0 {
                        b[k] = a[r].clone();
                        r += 1;
                    } else {
                        b[k] = a[l].clone();
                        l += 1;
                    }
                    k += 1;
                }
                while l < mid {
                    b[k] = a[l].clone();
                    l += 1;
                    k += 1;
                }
                while r < end {
                    b[k] = a[r].clone();
                    r += 1;
                    k += 1;
                }
                start += 2 * width;
            }
            std::mem::swap(&mut a, &mut b);
            width *= 2;
        }
        *self.0.borrow_mut() = a;
        Ok(self.clone())
    }
    pub fn reverse(&self) -> Arr<T> {
        self.0.borrow_mut().reverse();
        self.clone()
    }
    pub fn shift(&self) -> Option<T> {
        let mut items = self.0.borrow_mut();
        if items.is_empty() { None } else { Some(items.remove(0)) }
    }
    /// `xs.at(i)`: from the end when negative.
    pub fn at_rel(&self, i: i64) -> Option<T> {
        self.at(if i < 0 { self.len() + i } else { i })
    }
    pub fn reduce<A>(&self, init: A, f: impl Fn(A, T) -> A) -> A {
        self.iter().fold(init, f)
    }
    pub fn map_i<U>(&self, f: impl Fn(T, i64) -> U) -> Arr<U> {
        self.iter().enumerate().map(|(i, x)| f(x, i as i64)).collect::<Vec<_>>().into()
    }
    pub fn filter_i(&self, f: impl Fn(T, i64) -> bool) -> Arr<T> {
        self.iter().enumerate().filter(|(i, x)| f(x.clone(), *i as i64)).map(|(_, x)| x).collect::<Vec<_>>().into()
    }
    pub fn for_each_i(&self, f: impl Fn(T, i64)) {
        self.iter().enumerate().for_each(|(i, x)| f(x, i as i64))
    }
    pub fn some_i(&self, f: impl Fn(T, i64) -> bool) -> bool {
        self.iter().enumerate().any(|(i, x)| f(x, i as i64))
    }
    pub fn every_i(&self, f: impl Fn(T, i64) -> bool) -> bool {
        self.iter().enumerate().all(|(i, x)| f(x, i as i64))
    }
    pub fn find_i(&self, f: impl Fn(T, i64) -> bool) -> Option<T> {
        self.iter().enumerate().find(|(i, x)| f(x.clone(), *i as i64)).map(|(_, x)| x)
    }
    pub fn find_index_i(&self, f: impl Fn(T, i64) -> bool) -> i64 {
        self.iter().enumerate().find(|(i, x)| f(x.clone(), *i as i64)).map_or(-1, |(i, _)| i as i64)
    }

    // The same with a callback that can throw: the first error stops the call and is returned.
    pub fn try_find_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<Option<T>, JsError> {
        for (i, x) in self.iter().enumerate() {
            if f(x.clone(), i as i64)? {
                return Ok(Some(x));
            }
        }
        Ok(None)
    }
    pub fn try_find_index_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<i64, JsError> {
        Ok(self.try_find_i_at(f)?.map_or(-1, |i| i as i64))
    }
    fn try_find_i_at(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<Option<usize>, JsError> {
        for (i, x) in self.iter().enumerate() {
            if f(x, i as i64)? {
                return Ok(Some(i));
            }
        }
        Ok(None)
    }
    pub fn try_filter_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<Arr<T>, JsError> {
        let mut out = Vec::new();
        for (i, x) in self.iter().enumerate() {
            if f(x.clone(), i as i64)? {
                out.push(x);
            }
        }
        Ok(out.into())
    }
    pub fn try_map_i<U>(&self, f: impl Fn(T, i64) -> Result<U, JsError>) -> Result<Arr<U>, JsError> {
        Ok(self.iter().enumerate().map(|(i, x)| f(x, i as i64)).collect::<Result<Vec<_>, _>>()?.into())
    }
    pub fn try_for_each_i(&self, f: impl Fn(T, i64) -> Result<(), JsError>) -> Result<(), JsError> {
        self.iter().enumerate().try_for_each(|(i, x)| f(x, i as i64))
    }
    pub fn try_some_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<bool, JsError> {
        Ok(self.try_find_i_at(f)?.is_some())
    }
    pub fn try_every_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<bool, JsError> {
        Ok(self.try_find_i_at(|x, i| Ok(!f(x, i)?))?.is_none())
    }
    pub fn try_find(&self, f: impl Fn(T) -> Result<bool, JsError>) -> Result<Option<T>, JsError> {
        self.try_find_i(|x, _| f(x))
    }
    pub fn try_find_index(&self, f: impl Fn(T) -> Result<bool, JsError>) -> Result<i64, JsError> {
        self.try_find_index_i(|x, _| f(x))
    }
    pub fn try_filter(&self, f: impl Fn(T) -> Result<bool, JsError>) -> Result<Arr<T>, JsError> {
        self.try_filter_i(|x, _| f(x))
    }
    pub fn try_map<U>(&self, f: impl Fn(T) -> Result<U, JsError>) -> Result<Arr<U>, JsError> {
        self.try_map_i(|x, _| f(x))
    }
    pub fn try_for_each(&self, f: impl Fn(T) -> Result<(), JsError>) -> Result<(), JsError> {
        self.try_for_each_i(|x, _| f(x))
    }
    pub fn try_some(&self, f: impl Fn(T) -> Result<bool, JsError>) -> Result<bool, JsError> {
        self.try_some_i(|x, _| f(x))
    }
    pub fn try_every(&self, f: impl Fn(T) -> Result<bool, JsError>) -> Result<bool, JsError> {
        self.try_every_i(|x, _| f(x))
    }
    pub fn try_reduce<A>(&self, init: A, f: impl Fn(A, T) -> Result<A, JsError>) -> Result<A, JsError> {
        self.iter().try_fold(init, f)
    }
}

impl<T: Clone + PartialEq> Arr<T> {
    pub fn index_of(&self, value: &T) -> i64 {
        self.0.borrow().iter().position(|item| item == value).map_or(-1, |i| i as i64)
    }
    /// SameValueZero: NaN includes NaN (`x != x` only for NaN), where indexOf's `===` never finds it.
    pub fn includes(&self, value: &T) -> bool {
        self.0.borrow().iter().any(|item| item == value || (item != item && value != value))
    }
    pub fn last_index_of(&self, value: &T) -> i64 {
        self.0.borrow().iter().rposition(|item| item == value).map_or(-1, |i| i as i64)
    }
    /// The same from an index (from the end when negative); `last_index_of_from` searches back from it.
    pub fn index_of_from(&self, value: &T, from: i64) -> i64 {
        let items = self.0.borrow();
        let k = clamp_index(from, items.len());
        items[k..].iter().position(|item| item == value).map_or(-1, |i| (k + i) as i64)
    }
    pub fn includes_from(&self, value: &T, from: i64) -> bool {
        let items = self.0.borrow();
        let k = clamp_index(from, items.len());
        items[k..].iter().any(|item| item == value || (item != item && value != value))
    }
    pub fn last_index_of_from(&self, value: &T, from: i64) -> i64 {
        let items = self.0.borrow();
        let k = if from < 0 { items.len() as i64 + from } else { from.min(items.len() as i64 - 1) };
        if k < 0 {
            return -1;
        }
        items[..=k as usize].iter().rposition(|item| item == value).map_or(-1, |i| i as i64)
    }
}

impl<T: Clone> Arr<T> {
    /// `splice(start, count, ...items)`: `items` may be the array itself, so it is read first.
    pub fn splice_items(&self, start: i64, count: i64, items: Arr<T>) -> Arr<T> {
        let add = items.to_vec();
        let mut v = self.0.borrow_mut();
        let from = clamp_index(start, v.len());
        let to = from + (count.max(0) as usize).min(v.len() - from);
        v.splice(from..to, add).collect::<Vec<_>>().into()
    }
    /// `fill(v, start, end)`, in place: the array itself.
    pub fn fill(&self, value: T, start: i64, end: Option<i64>) -> Arr<T> {
        {
            let mut v = self.0.borrow_mut();
            let n = v.len();
            let (from, to) = (clamp_index(start, n), end.map_or(n, |e| clamp_index(e, n)));
            if from < to {
                v[from..to].fill(value);
            }
        }
        self.clone()
    }
    /// `copyWithin(target, start, end)`, in place: the array itself.
    pub fn copy_within(&self, target: i64, start: i64, end: Option<i64>) -> Arr<T> {
        {
            let mut v = self.0.borrow_mut();
            let n = v.len();
            let (t, s) = (clamp_index(target, n), clamp_index(start, n));
            let e = end.map_or(n, |e| clamp_index(e, n));
            let count = e.saturating_sub(s).min(n - t);
            if count > 0 {
                let part = v[s..s + count].to_vec();
                v[t..t + count].clone_from_slice(&part);
            }
        }
        self.clone()
    }
    /// `new Array(n).fill(v)`.
    pub fn filled(n: i64, value: T) -> Arr<T> {
        vec![value; n.max(0) as usize].into()
    }
    /// `Array.from({ length: n }, (_, i) => …)`.
    pub fn from_len(n: i64, f: impl Fn(i64) -> T) -> Arr<T> {
        (0..n.max(0)).map(f).collect::<Vec<_>>().into()
    }
    pub fn try_from_len(n: i64, f: impl Fn(i64) -> Result<T, JsError>) -> Result<Arr<T>, JsError> {
        Ok((0..n.max(0)).map(f).collect::<Result<Vec<_>, _>>()?.into())
    }
    pub fn reduce_right<A>(&self, init: A, f: impl Fn(A, T) -> A) -> A {
        self.to_vec().into_iter().rev().fold(init, f)
    }
    pub fn try_reduce_right<A>(&self, init: A, f: impl Fn(A, T) -> Result<A, JsError>) -> Result<A, JsError> {
        self.to_vec().into_iter().rev().try_fold(init, f)
    }
    // ES2023.
    pub fn find_last_i(&self, f: impl Fn(T, i64) -> bool) -> Option<T> {
        self.to_vec().into_iter().enumerate().rev().find(|(i, x)| f(x.clone(), *i as i64)).map(|(_, x)| x)
    }
    pub fn find_last_index_i(&self, f: impl Fn(T, i64) -> bool) -> i64 {
        self.to_vec().into_iter().enumerate().rev().find(|(i, x)| f(x.clone(), *i as i64)).map_or(-1, |(i, _)| i as i64)
    }
    pub fn try_find_last_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<Option<T>, JsError> {
        for (i, x) in self.to_vec().into_iter().enumerate().rev() {
            if f(x.clone(), i as i64)? {
                return Ok(Some(x));
            }
        }
        Ok(None)
    }
    pub fn try_find_last_index_i(&self, f: impl Fn(T, i64) -> Result<bool, JsError>) -> Result<i64, JsError> {
        for (i, x) in self.to_vec().into_iter().enumerate().rev() {
            if f(x, i as i64)? {
                return Ok(i as i64);
            }
        }
        Ok(-1)
    }
    pub fn to_spliced(&self, start: i64, count: i64, items: Option<Arr<T>>) -> Arr<T> {
        let out: Arr<T> = self.to_vec().into();
        out.splice_items(start, count, items.unwrap_or_else(Arr::new));
        out
    }
    /// `with(i, v)`: a RangeError out of range, as JavaScript throws.
    pub fn try_with(&self, i: f64, value: T) -> Result<Arr<T>, JsError> {
        let mut v = self.to_vec();
        let t = js_to_integer(i);
        let k = if t < 0.0 { v.len() as f64 + t } else { t };
        if !(k >= 0.0 && k < v.len() as f64) {
            return Err(JsError::named("RangeError", "Array index out of range"));
        }
        v[k as usize] = value;
        Ok(v.into())
    }
    /// `new Array(n).fill(v)` of a length not known statically: a RangeError unless n is a whole number below 2^32.
    pub fn try_filled(n: f64, value: T) -> Result<Arr<T>, JsError> {
        Ok(Arr::filled(js_array_length(n)?, value))
    }
}

impl<T: Clone> Arr<Arr<T>> {
    /// `flat()` of a `T[][]`: one level.
    pub fn flat(&self) -> Arr<T> {
        self.0.borrow().iter().flat_map(|x| x.to_vec()).collect::<Vec<_>>().into()
    }
}

impl Arr<String> {
    pub fn join(&self, separator: &str) -> String {
        self.0.borrow().join(separator)
    }
}

pub struct ArrIter<T> {
    arr: Arr<T>,
    next: usize,
}

impl<T: Clone> Iterator for ArrIter<T> {
    type Item = T;
    fn next(&mut self) -> Option<T> {
        let item = self.arr.0.borrow().get(self.next).cloned();
        self.next += 1;
        item
    }
}

// ---------------------------------------------------------------------------
// Maps (Record<string, T>)
// ---------------------------------------------------------------------------

/// The runtime maps' hasher: FxHash's multiply-rotate per 8 bytes, then MurmurHash3's finalizer (hashbrown probes
/// by the top and low bits). Keys come from the app, not an attacker; SipHash was a third of a number-keyed Map's time.
#[derive(Default, Clone, Copy)]
pub struct JsFx(u64);

impl JsFx {
    #[inline]
    fn add(&mut self, x: u64) {
        self.0 = (self.0.rotate_left(5) ^ x).wrapping_mul(0x517c_c1b7_2722_0a95);
    }
}

impl std::hash::Hasher for JsFx {
    #[inline]
    fn write(&mut self, bytes: &[u8]) {
        let mut chunks = bytes.chunks_exact(8);
        for c in &mut chunks {
            self.add(u64::from_le_bytes(c.try_into().unwrap()));
        }
        let rest = chunks.remainder();
        if !rest.is_empty() {
            let mut w = [0u8; 8];
            w[..rest.len()].copy_from_slice(rest);
            self.add(u64::from_le_bytes(w) ^ ((rest.len() as u64) << 59));
        }
    }
    #[inline]
    fn write_u8(&mut self, x: u8) {
        self.add(x as u64);
    }
    #[inline]
    fn write_u64(&mut self, x: u64) {
        self.add(x);
    }
    #[inline]
    fn write_usize(&mut self, x: usize) {
        self.add(x as u64);
    }
    #[inline]
    fn finish(&self) -> u64 {
        let mut z = self.0;
        z ^= z >> 33;
        z = z.wrapping_mul(0xff51_afd7_ed55_8ccd);
        z ^= z >> 33;
        z = z.wrapping_mul(0xc4ce_b9fe_1a85_ec53);
        z ^ (z >> 33)
    }
}

pub type JsHashMap<K, V> = HashMap<K, V, std::hash::BuildHasherDefault<JsFx>>;

/// A hash map (O(1) reads, writes and deletes) that lists its keys in JavaScript's order: integer-like keys
/// ascending, then the others in insertion order (a key deleted and set again goes last).
pub struct Map<T>(Rc<RefCell<Entries<T>>>);

pub struct Entries<T> {
    /// Each key's place in `slots`.
    index: JsHashMap<String, usize>,
    /// Insertion order; a deleted entry leaves a hole until the slots are compacted.
    slots: Vec<Option<(String, T)>>,
}

/// An array index ("0" … "4294967294", no leading zero): JavaScript lists such keys first, in numeric order.
pub fn js_is_index(key: &str) -> bool {
    key.parse::<u32>().is_ok_and(|n| n < u32::MAX && n.to_string() == key)
}

impl<T> Clone for Map<T> {
    fn clone(&self) -> Self {
        Map(self.0.clone())
    }
}

impl<T> PartialEq for Map<T> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl<T> Map<T> {
    /// For the cycle collector (gc.rs): the storage's address and strong count, and each value by reference.
    pub(crate) fn gc_id(&self) -> (usize, usize) {
        (Rc::as_ptr(&self.0) as *const () as usize, Rc::strong_count(&self.0))
    }
    /// A reference that keeps the storage alive (the collector holds what it scanned).
    pub(crate) fn gc_hold(&self) -> Rc<dyn std::any::Any>
    where
        T: 'static,
    {
        self.0.clone()
    }
    pub(crate) fn gc_each(&self, mut f: impl FnMut(&T)) {
        for (_, v) in self.0.borrow().slots.iter().flatten() {
            f(v)
        }
    }
}

impl<T: Clone> Map<T> {
    pub(crate) fn addr(&self) -> usize {
        Rc::as_ptr(&self.0) as *const () as usize
    }
    pub fn from_pairs(pairs: Vec<(&str, T)>) -> Self {
        let map = Map(Rc::new(RefCell::new(Entries { index: JsHashMap::default(), slots: Vec::new() })));
        for (k, v) in pairs {
            map.insert(k, v);
        }
        map
    }
    pub fn get(&self, key: &str) -> Option<T> {
        let entries = self.0.borrow();
        entries.index.get(key).and_then(|&i| entries.slots[i].as_ref()).map(|(_, v)| v.clone())
    }
    pub fn insert(&self, key: &str, value: T) {
        let mut entries = self.0.borrow_mut();
        let entries = &mut *entries;
        match entries.index.get(key) {
            Some(&i) => entries.slots[i] = Some((key.to_string(), value)),
            None => {
                entries.index.insert(key.to_string(), entries.slots.len());
                entries.slots.push(Some((key.to_string(), value)));
            }
        }
    }
    /// `delete map[key]`.
    pub fn remove(&self, key: &str) {
        let old = {
            let mut entries = self.0.borrow_mut();
            let entries = &mut *entries;
            let Some(i) = entries.index.remove(key) else { return };
            let old = entries.slots[i].take();
            // Mostly holes: compact, so the slots stay proportional to the keys.
            if entries.slots.len() > 16 && entries.index.len() * 2 < entries.slots.len() {
                entries.slots.retain(Option::is_some);
                for (i, slot) in entries.slots.iter().enumerate() {
                    entries.index.insert(slot.as_ref().unwrap().0.clone(), i);
                }
            }
            old
        };
        // Dropped once the map is released: a value's drop may touch the map.
        drop(old);
    }
    /// `key in map`.
    pub fn has(&self, key: &str) -> bool {
        self.0.borrow().index.contains_key(key)
    }
    /// The entries in JavaScript's order (Object.keys / values / entries, for…in).
    pub(crate) fn entries(&self) -> Vec<(String, T)> {
        let entries = self.0.borrow();
        let live = entries.slots.iter().flatten();
        if !live.clone().any(|(k, _)| js_is_index(k)) {
            return live.cloned().collect();
        }
        let mut indices: Vec<(String, T)> = live.clone().filter(|(k, _)| js_is_index(k)).cloned().collect();
        indices.sort_by_key(|(k, _)| k.parse::<u32>().unwrap());
        indices.extend(live.filter(|(k, _)| !js_is_index(k)).cloned());
        indices
    }
    /// `Object.keys(map)`.
    pub fn keys(&self) -> Arr<String> {
        self.entries().into_iter().map(|(k, _)| k).collect::<Vec<_>>().into()
    }
    /// `Object.values(map)`.
    pub fn values(&self) -> Arr<T> {
        self.entries().into_iter().map(|(_, v)| v).collect::<Vec<_>>().into()
    }
}

// ---------------------------------------------------------------------------
// Functions as values
// ---------------------------------------------------------------------------

// A function value is an `Rc<dyn Fn>`: these name the type a closure becomes.
pub fn f0<R>(f: impl Fn() -> R + 'static) -> Rc<dyn Fn() -> R> {
    Rc::new(f)
}
pub fn f1<A, R>(f: impl Fn(A) -> R + 'static) -> Rc<dyn Fn(A) -> R> {
    Rc::new(f)
}
pub fn f2<A, B, R>(f: impl Fn(A, B) -> R + 'static) -> Rc<dyn Fn(A, B) -> R> {
    Rc::new(f)
}
pub fn f3<A, B, C, R>(f: impl Fn(A, B, C) -> R + 'static) -> Rc<dyn Fn(A, B, C) -> R> {
    Rc::new(f)
}
pub fn f4<A, B, C, D, R>(f: impl Fn(A, B, C, D) -> R + 'static) -> Rc<dyn Fn(A, B, C, D) -> R> {
    Rc::new(f)
}

// ---------------------------------------------------------------------------
// Numbers and strings
// ---------------------------------------------------------------------------

/// Numbers the way JavaScript prints them: 3, not 3.0; 1e+21, not a row of zeros.
pub fn js_num(d: f64) -> String {
    if d.is_nan() {
        return "NaN".into();
    }
    if d.is_infinite() {
        return if d > 0.0 { "Infinity" } else { "-Infinity" }.into();
    }
    if d == 0.0 {
        return "0".into();
    }
    let magnitude = d.abs();
    if let Some((ds, e)) = js_shortest_tie(magnitude) {
        return format!("{}{}", if d < 0.0 { "-" } else { "" }, js_layout(&ds, e));
    }
    if magnitude >= 1e21 || magnitude < 1e-6 {
        let s = format!("{d:e}");
        return if s.contains("e-") { s } else { s.replace('e', "e+") };
    }
    format!("{d}")
}

/// `toFixed`: exact halves round away from zero, which Rust's formatter (half to even) does not.
pub fn js_fixed(d: f64, digits: i64) -> String {
    // NaN, ±Infinity and anything from 1e21 print as String(d); -0 is "0".
    if !d.is_finite() || d.abs() >= 1e21 { return js_num(d); }
    let d = d + 0.0;
    let digits = digits.clamp(0, 100) as usize;
    // A half at this precision is an odd multiple of 2^-(digits + 1): only then do the two differ.
    let scaled = d * 2f64.powi(digits as i32 + 1);
    let tie = d.is_finite() && scaled.fract() == 0.0 && scaled % 2.0 != 0.0;
    if !tie {
        return format!("{d:.digits$}");
    }
    // A tie's text with one more digit is exact (it ends in 5): drop it and add one unit by hand (the next double can
    // be a whole unit away: 707273840904235.875.toFixed(2)).
    let mut u = format!("{d:.*}", digits + 1).into_bytes();
    u.pop();
    if u.last() == Some(&b'.') { u.pop(); }
    let (start, mut i) = ((u[0] == b'-') as usize, u.len());
    while i > start && (u[i - 1] == b'9' || u[i - 1] == b'.') { if u[i - 1] == b'9' { u[i - 1] = b'0'; } i -= 1; }
    if i == start { u.insert(start, b'1'); } else { u[i - 1] += 1; }
    String::from_utf8(u).unwrap()
}

/// `Math.round`: the nearest integer, a half up (`d + 0.5` would round 0.49999999999999994 up).
/// `Math.round` of any number (NaN and ±Infinity stay themselves).
pub fn js_round_d(d: f64) -> f64 {
    let f = d.floor();
    if d - f >= 0.5 { f + 1.0 } else { f }
}

pub fn js_round(d: f64) -> i64 {
    let f = d.floor();
    (if d - f >= 0.5 { f + 1.0 } else { f }) as i64
}

/// `Date.now()`: whole milliseconds, as in JavaScript (the backend's clock may have a fraction).
pub fn js_now() -> f64 {
    super::backend::now().floor()
}

pub fn js_random() -> f64 {
    thread_local!(static STATE: std::cell::Cell<u64> = std::cell::Cell::new(js_now().to_bits() | 1));
    STATE.with(|state| {
        // xorshift64*: enough for Math.random(), and no dependency.
        let mut x = state.get();
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        state.set(x);
        (x.wrapping_mul(0x2545_F491_4F6C_DD1D) >> 11) as f64 / (1u64 << 53) as f64
    })
}

/// `Number(s)`: JavaScript's StringToNumber (white space trimmed, "" is 0, 0x / 0o / 0b, Infinity, no "inf" or "1_0").
pub fn js_number(s: &str) -> f64 {
    let t = s.trim_matches(js_is_space);
    if t.is_empty() { return 0.0; }
    let b = t.as_bytes();
    let radix = if b.len() > 2 && b[0] == b'0' { match b[1] { b'x' | b'X' => 16, b'o' | b'O' => 8, b'b' | b'B' => 2, _ => 0 } } else { 0 };
    if radix != 0 {
        let mut v = 0.0;
        for c in t[2..].chars() {
            match c.to_digit(radix) { Some(d) => v = v * radix as f64 + d as f64, None => return f64::NAN }
        }
        return v;
    }
    let unsigned = t.strip_prefix(['+', '-']).unwrap_or(t);
    if unsigned == "Infinity" { return if t.starts_with('-') { f64::NEG_INFINITY } else { f64::INFINITY }; }
    // Rust also reads "inf", "NaN" and "1e" forms JavaScript doesn't: only digits, one '.', an exponent.
    let (mantissa, exponent) = match unsigned.find(['e', 'E']) { Some(i) => (&unsigned[..i], Some(&unsigned[i + 1..])), None => (unsigned, None) };
    let digits = mantissa.bytes().filter(u8::is_ascii_digit).count();
    let valid = digits > 0 && mantissa.bytes().all(|c| c.is_ascii_digit() || c == b'.') && mantissa.bytes().filter(|&c| c == b'.').count() <= 1
        && exponent.map_or(true, |e| { let e = e.strip_prefix(['+', '-']).unwrap_or(e); !e.is_empty() && e.bytes().all(|c| c.is_ascii_digit()) });
    if valid { t.parse().unwrap_or(f64::NAN) } else { f64::NAN }
}

/// `parseInt(s, radix)`: the longest run of digits after white space, a sign and (radix 16 or none) 0x; NaN if none.
pub fn js_parse_int(s: &str, radix: f64) -> f64 {
    let t = s.trim_start_matches(js_is_space);
    let negative = t.starts_with('-');
    let mut t = t.strip_prefix(['+', '-']).unwrap_or(t);
    let mut r = radix.js_i32() as u32;
    if r != 0 && !(2..=36).contains(&r) { return f64::NAN; }
    if (r == 0 || r == 16) && (t.starts_with("0x") || t.starts_with("0X")) { t = &t[2..]; r = 16; }
    if r == 0 { r = 10; }
    let end = t.char_indices().find(|&(_, c)| c.to_digit(r).is_none()).map_or(t.len(), |(i, _)| i);
    if end == 0 { return f64::NAN; }
    let v = if r == 10 { t[..end].parse().unwrap_or(f64::NAN) } else { t[..end].chars().fold(0.0, |v, c| v * r as f64 + c.to_digit(r).unwrap() as f64) };
    if negative { -v } else { v }
}

/// `Math.min` / `Math.max`: NaN if either is NaN (`x != x`). (-0 and +0 compare equal: the first is kept.)
pub fn js_min<T: PartialOrd>(a: T, b: T) -> T {
    if a != a { a } else if b != b || b < a { b } else { a }
}

pub fn js_max<T: PartialOrd>(a: T, b: T) -> T {
    if a != a { a } else if b != b || b > a { b } else { a }
}

/// `a || b` on strings.
pub fn js_or(a: String, b: String) -> String {
    if a.is_empty() { b } else { a }
}

/// `.length` counts UTF-16 units, as JavaScript (and Kotlin) do.
pub fn js_len(s: &str) -> i64 {
    // One unit per char start (not a 10xxxxxx byte), two for a 4-byte char (lead >= 0xF0): vectorizes.
    s.as_bytes().iter().map(|&b| ((b as i8) >= -0x40) as usize + (b >= 0xF0) as usize).sum::<usize>() as i64
}

/// Byte offset and UTF-16 offset of the first char at or after UTF-16 offset `p` (clamped to the end).
fn byte_of(s: &str, p: usize) -> (usize, usize) {
    let k = p.min(s.len());
    if s.as_bytes()[..k].is_ascii() {
        return (k, k);
    }
    let mut u = 0;
    for (i, c) in s.char_indices() {
        if u >= p {
            return (i, u);
        }
        u += c.len_utf16();
    }
    (s.len(), u)
}

pub fn js_str_slice(s: &str, start: i64, end: Option<i64>) -> String {
    if s.is_ascii() {
        let from = clamp_index(start, s.len());
        let to = end.map_or(s.len(), |e| clamp_index(e, s.len()));
        return if from < to { s[from..to].to_string() } else { String::new() };
    }
    let units: Vec<u16> = s.encode_utf16().collect();
    let from = clamp_index(start, units.len());
    let to = end.map_or(units.len(), |e| clamp_index(e, units.len()));
    if from < to { String::from_utf16_lossy(&units[from..to]) } else { String::new() }
}

/// ToInt32, which the bitwise operators apply to their operands.
pub trait JsI32 {
    fn js_i32(self) -> i32;
}

impl JsI32 for i64 {
    fn js_i32(self) -> i32 {
        self as i32
    }
}

impl JsI32 for f64 {
    fn js_i32(self) -> i32 {
        // Truncation commutes with mod 2^32, so below 2^63 a plain cast is exact (no fmod).
        if self.abs() < 9.2e18 { self as i64 as i32 } else if self.is_finite() { (self % 4294967296.0) as i64 as i32 } else { 0 }
    }
}

/// `Math.sign`: NaN and ±0 are themselves.
pub fn js_sign(x: f64) -> f64 {
    if x > 0.0 { 1.0 } else if x < 0.0 { -1.0 } else { x }
}

/// `x ** y` / `Math.pow` as JavaScriptCore (bun) computes them: a whole exponent 0…1000 by binary powering (powf rounds
/// differently: 1.07 ** 10), anything else by powf; NaN where JavaScript differs from C (`1 ** Infinity`, `x ** NaN`).
pub fn js_pow(x: f64, y: f64) -> f64 {
    if y.is_nan() || (x.abs() == 1.0 && y.is_infinite()) { return f64::NAN; }
    if (0.0..=1000.0).contains(&y) && y == y.trunc() {
        let (mut r, mut b, mut e) = (1.0, x, y as i64);
        while e != 0 {
            if e & 1 != 0 { r *= b; }
            b *= b;
            e >>= 1;
        }
        return r;
    }
    f64::powf(x, y)
}

pub fn js_is_integer(x: f64) -> bool {
    x.is_finite() && x.trunc() == x
}

/// JavaScript's white space and line terminators, which trim() removes.
fn js_is_space(c: char) -> bool {
    matches!(c, '\u{9}'..='\u{D}' | ' ' | '\u{A0}' | '\u{1680}' | '\u{2000}'..='\u{200A}' | '\u{2028}' | '\u{2029}' | '\u{202F}' | '\u{205F}' | '\u{3000}' | '\u{FEFF}')
}

pub fn js_trim(s: &str) -> String {
    s.trim_matches(js_is_space).to_string()
}

pub fn js_trim_start(s: &str) -> String {
    s.trim_start_matches(js_is_space).to_string()
}

pub fn js_trim_end(s: &str) -> String {
    s.trim_end_matches(js_is_space).to_string()
}

fn units(s: &str) -> Vec<u16> {
    s.encode_utf16().collect()
}

fn find_units(h: &[u16], n: &[u16], from: usize) -> Option<usize> {
    (from..=h.len().saturating_sub(n.len())).find(|&i| i + n.len() <= h.len() && h[i..i + n.len()] == *n)
}

pub fn js_index_of(s: &str, sub: &str, from: i64) -> i64 {
    // UTF-8 matches of valid text are exactly its UTF-16 matches (both at char boundaries); only offsets convert.
    let (b, u) = byte_of(s, from.max(0) as usize);
    if sub.is_empty() {
        return u as i64;
    }
    s[b..].find(sub).map_or(-1, |i| (u as i64) + js_len(&s[b..b + i]))
}

pub fn js_last_index_of(s: &str, sub: &str) -> i64 {
    let (h, n) = (units(s), units(sub));
    if n.len() > h.len() {
        return -1;
    }
    (0..=h.len() - n.len()).rev().find(|&i| h[i..i + n.len()] == *n).map_or(-1, |i| i as i64)
}

pub fn js_split(s: &str, sep: &str) -> Arr<String> {
    if !sep.is_empty() {
        // As in js_index_of: str::split finds the same separators, left to right, not overlapping.
        return s.split(sep).map(String::from).collect::<Vec<_>>().into();
    }
    let (h, n) = (units(s), units(sep));
    if n.is_empty() {
        return h.iter().map(|u| String::from_utf16_lossy(&[*u])).collect::<Vec<_>>().into();
    }
    let (mut parts, mut start) = (Vec::new(), 0);
    while let Some(i) = find_units(&h, &n, start) {
        parts.push(String::from_utf16_lossy(&h[start..i]));
        start = i + n.len();
    }
    parts.push(String::from_utf16_lossy(&h[start..]));
    parts.into()
}

/// `replace` / `replaceAll` with a string pattern, `$$ $& $` $'` in the replacement included.
pub fn js_replace(s: &str, pattern: &str, replacement: &str, all: bool) -> String {
    let (h, n, r) = (units(s), units(pattern), units(replacement));
    let mut matches = Vec::new();
    let mut i = 0;
    while i + n.len() <= h.len() {
        if h[i..i + n.len()] == *n {
            matches.push(i);
            if !all {
                break;
            }
            i += n.len().max(1);
        } else {
            i += 1;
        }
    }
    let (mut out, mut last) = (Vec::new(), 0);
    for at in matches {
        out.extend_from_slice(&h[last..at]);
        let mut j = 0;
        while j < r.len() {
            let next = if r[j] == b'$' as u16 && j + 1 < r.len() { r[j + 1] } else { 0 };
            match next {
                36 => out.push(36),
                38 => out.extend_from_slice(&n),
                96 => out.extend_from_slice(&h[..at]),
                39 => out.extend_from_slice(&h[at + n.len()..]),
                _ => {
                    out.push(r[j]);
                    j += 1;
                    continue;
                }
            }
            j += 2;
        }
        last = at + n.len();
    }
    out.extend_from_slice(&h[last..]);
    String::from_utf16_lossy(&out)
}

pub fn js_pad(s: &str, length: i64, fill: &str, at_start: bool) -> String {
    let (h, f) = (units(s), units(fill));
    if length <= h.len() as i64 || f.is_empty() {
        return s.to_string();
    }
    let pad: Vec<u16> = (0..length as usize - h.len()).map(|i| f[i % f.len()]).collect();
    String::from_utf16_lossy(&if at_start { [pad, h].concat() } else { [h, pad].concat() })
}

pub fn js_repeat(s: &str, n: i64) -> String {
    s.repeat(n.max(0) as usize)
}

/// `Object.is` of numbers: SameValue (NaN is NaN, -0 isn't +0).
pub fn js_object_is(a: f64, b: f64) -> bool {
    if a == b { a != 0.0 || a.is_sign_negative() == b.is_sign_negative() } else { a.is_nan() && b.is_nan() }
}

/// `Number.isSafeInteger`.
pub fn js_is_safe_integer(d: f64) -> bool {
    d.trunc() == d && d.abs() <= 9007199254740991.0
}

/// `s.replace(pattern, f)` / `replaceAll`: f(match, offset in UTF-16 units, s) for each match, left to right.
pub fn js_replace_fn(s: &str, pattern: &str, f: Rc<dyn Fn(String, f64, String) -> String>) -> String {
    js_replace_by(s, pattern, false, f)
}
pub fn js_replace_all_fn(s: &str, pattern: &str, f: Rc<dyn Fn(String, f64, String) -> String>) -> String {
    js_replace_by(s, pattern, true, f)
}
fn js_replace_by(s: &str, pattern: &str, all: bool, f: Rc<dyn Fn(String, f64, String) -> String>) -> String {
    let (h, n) = (units(s), units(pattern));
    let (mut out, mut last, mut i) = (Vec::new(), 0, 0);
    while i + n.len() <= h.len() {
        if h[i..i + n.len()] == *n {
            out.extend_from_slice(&h[last..i]);
            out.extend(f(pattern.to_string(), i as f64, s.to_string()).encode_utf16());
            last = i + n.len();
            if !all {
                break;
            }
            i += n.len().max(1);
        } else {
            i += 1;
        }
    }
    out.extend_from_slice(&h[last..]);
    String::from_utf16_lossy(&out)
}

/// ToIntegerOrInfinity: NaN is 0, fractions truncate toward 0.
pub fn js_to_integer(d: f64) -> f64 {
    if d.is_nan() { 0.0 } else { d.trunc() + 0.0 }
}

/// `new Array(n)`'s length: a RangeError unless n is a whole number below 2^32.
pub fn js_array_length(n: f64) -> Result<i64, JsError> {
    if n >= 0.0 && n < 4294967296.0 && n.trunc() == n { Ok(n as i64) } else { Err(JsError::named("RangeError", "Array length must be a positive integer of safe magnitude.")) }
}

/// `s.repeat(n)` of a count not known statically: a RangeError for a negative or infinite count.
pub fn js_str_repeat(s: &str, n: f64) -> Result<String, JsError> {
    let t = js_to_integer(n);
    if t < 0.0 || t.is_infinite() {
        return Err(JsError::named("RangeError", "String.prototype.repeat argument must be greater than or equal to 0 and not be Infinity"));
    }
    Ok(if t == 0.0 || s.is_empty() { String::new() } else { s.repeat(t as usize) })
}

/// `d.toFixed(f)` of digits not known statically: a RangeError out of 0..=100.
pub fn js_to_fixed_checked(d: f64, f: f64) -> Result<String, JsError> {
    let t = js_to_integer(f);
    if !(0.0..=100.0).contains(&t) {
        return Err(JsError::named("RangeError", "toFixed() argument must be between 0 and 100"));
    }
    Ok(js_fixed(d, t as i64))
}

/// `a < b` on strings: UTF-16 units in order, as JavaScript compares (Rust's `<` orders code points).
pub fn js_compare(a: &str, b: &str) -> i64 {
    match a.encode_utf16().cmp(b.encode_utf16()) {
        std::cmp::Ordering::Less => -1,
        std::cmp::Ordering::Equal => 0,
        std::cmp::Ordering::Greater => 1,
    }
}

// ---------------------------------------------------------------------------
// String and number APIs (js.fn): positions are UTF-16 units, converted as JavaScript converts them
// ---------------------------------------------------------------------------

use super::bigint::JsBigInt;

/// ToIntegerOrInfinity: NaN is 0, a fraction truncates.
fn js_pos(d: f64) -> f64 {
    if d.is_nan() { 0.0 } else { d.trunc() }
}

/// A position clamped to 0..=len.
fn js_clamp_pos(d: f64, len: usize) -> usize {
    let p = js_pos(d);
    if p <= 0.0 { 0 } else if p >= len as f64 { len } else { p as usize }
}

fn js_unit_at(s: &str, i: f64) -> Option<u16> {
    let p = js_pos(i);
    if p < 0.0 { return None; }
    let (k, b) = (p.min(usize::MAX as f64) as usize, s.as_bytes());
    if k < b.len() && b[..=k].is_ascii() { Some(b[k] as u16) } else { s.encode_utf16().nth(k) }
}

pub fn js_char_at(s: &str, i: f64) -> String {
    js_unit_at(s, i).map_or_else(String::new, |u| String::from_utf16_lossy(&[u]))
}

pub fn js_char_code_at(s: &str, i: f64) -> f64 {
    js_unit_at(s, i).map_or(f64::NAN, f64::from)
}

pub fn js_code_point_at(s: &str, i: f64) -> Option<f64> {
    let (p, u) = (js_pos(i), units(s));
    if p < 0.0 || p >= u.len() as f64 { return None; }
    let (k, a) = (p as usize, u[p as usize] as u32);
    if (0xD800..0xDC00).contains(&a) && k + 1 < u.len() && (0xDC00..0xE000).contains(&u[k + 1]) {
        return Some((((a - 0xD800) << 10) + u[k + 1] as u32 - 0xDC00 + 0x10000) as f64);
    }
    Some(a as f64)
}

pub fn js_str_at(s: &str, i: f64) -> Option<String> {
    let (n, p) = (js_len(s) as f64, js_pos(i));
    let k = if p < 0.0 { n + p } else { p };
    if k >= 0.0 && k < n { Some(js_char_at(s, k)) } else { None }
}

/// `s[i]`: the UTF-16 unit at an integer index in range, else undefined (rest).
pub fn js_str_index(s: &str, i: f64) -> Option<String> {
    if i >= 0.0 && i == i.trunc() && i < js_len(s) as f64 { Some(js_char_at(s, i)) } else { None }
}

/// `for (const c of s)`, `[...s]`, `Array.from(s)`: code points (rest).
pub fn js_code_points(s: &str) -> Arr<String> {
    s.chars().map(|c| c.to_string()).collect::<Vec<_>>().into()
}

/// `xs.reduce(f)` without an initial value: index `i` of the start, or JavaScript's TypeError on an empty array (rest).
pub fn js_reduce_start(n: i64, i: i64) -> Result<i64, JsError> {
    if n == 0 { return Err(JsError::named("TypeError", "Reduce of empty array with no initial value")); }
    Ok(i)
}

/// `Math.hypot(…)` of any count, as JavaScriptCore computes it (rest): 2 → hypot; 3 → libc++'s std::hypot(x, y, z)
/// (scaled sum of squares); more → a running maximum with fused multiply-adds. Infinity wins over NaN.
pub fn js_hypot_n(xs: Arr<f64>) -> f64 {
    let v = xs.to_vec();
    if v.iter().any(|x| x.is_infinite()) { return f64::INFINITY; }
    match v.len() {
        0 => return 0.0,
        1 => return v[0].abs(),
        _ => {}
    }
    if v.iter().any(|x| x.is_nan()) { return f64::NAN; }
    if v.len() == 2 { return v[0].hypot(v[1]); }
    if v.len() == 3 {
        let m = v[0].abs().max(v[1].abs().max(v[2].abs()));
        let (th, small) = (2f64.powi(512), 2f64.powi(-532));
        let sc = if m > th { small } else if m < 1.0 / th { 1.0 / small } else { 1.0 };
        let (x, y, z) = (v[0] * sc, v[1] * sc, v[2] * sc);
        return (x * x + y * y + z * z).sqrt() / sc;
    }
    let (mut m, mut sum) = (0.0f64, 0.0f64);
    for x in v {
        let a = x.abs();
        if m < a { let r = m / a; sum = sum.mul_add(r * r, 1.0); m = a; }
        else if m != 0.0 { let r = a / m; sum = r.mul_add(r, sum); }
    }
    if m == 0.0 { 0.0 } else { sum.sqrt() * m }
}

const JS_URI_UNRESERVED: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'()";
const JS_URI_RESERVED: &[u8] = b";/?:@&=+$,#";

fn js_uri_encode(s: &str, keep_reserved: bool) -> String {
    const HEX: &[u8] = b"0123456789ABCDEF";
    let mut out = String::with_capacity(s.len());
    for &b in s.as_bytes() {
        if JS_URI_UNRESERVED.contains(&b) || (keep_reserved && JS_URI_RESERVED.contains(&b)) { out.push(b as char); }
        else { out.push('%'); out.push(HEX[(b >> 4) as usize] as char); out.push(HEX[(b & 15) as usize] as char); }
    }
    out
}

/// `encodeURIComponent(s)` / `encodeURI(s)` (rest): UTF-8, uppercase hex (a Rust string has no lone surrogate).
pub fn js_encode_uri_component(s: &str) -> String { js_uri_encode(s, false) }
pub fn js_encode_uri(s: &str) -> String { js_uri_encode(s, true) }

fn js_uri_decode(s: &str, keep_reserved: bool) -> Result<String, JsError> {
    let u = s.as_bytes();
    let bad = || JsError::named("URIError", "URI error");
    let hex = |c: u8| (c as char).to_digit(16);
    let byte = |i: usize| -> Result<u8, JsError> {
        if i + 2 >= u.len() || u[i] != b'%' { return Err(bad()); }
        match (hex(u[i + 1]), hex(u[i + 2])) { (Some(h), Some(l)) => Ok((h * 16 + l) as u8), _ => Err(bad()) }
    };
    let mut out: Vec<u8> = Vec::with_capacity(u.len());
    let mut i = 0;
    while i < u.len() {
        if u[i] != b'%' { out.push(u[i]); i += 1; continue; }
        let b = byte(i)?;
        if b < 0x80 {
            if keep_reserved && JS_URI_RESERVED.contains(&b) { out.extend_from_slice(&u[i..i + 3]); } else { out.push(b); }
            i += 3;
            continue;
        }
        let n = if b & 0xE0 == 0xC0 { 2 } else if b & 0xF0 == 0xE0 { 3 } else if b & 0xF8 == 0xF0 { 4 } else { return Err(bad()) };
        let mut seq = vec![b];
        for k in 1..n {
            let c = byte(i + 3 * k)?;
            if c & 0xC0 != 0x80 { return Err(bad()); }
            seq.push(c);
        }
        // Overlong forms, surrogates and code points past U+10FFFF are errors, as in JavaScript.
        if std::str::from_utf8(&seq).is_err() { return Err(bad()); }
        out.extend_from_slice(&seq);
        i += 3 * n;
    }
    Ok(String::from_utf8(out).unwrap_or_default())
}

/// `decodeURIComponent(s)` / `decodeURI(s)` (rest): a URIError on a malformed escape, as JavaScript.
pub fn js_decode_uri_component(s: &str) -> Result<String, JsError> { js_uri_decode(s, false) }
pub fn js_decode_uri(s: &str) -> Result<String, JsError> { js_uri_decode(s, true) }

pub fn js_substring(s: &str, a: f64, b: f64) -> String {
    let u = units(s);
    let (x, y) = (js_clamp_pos(a, u.len()), js_clamp_pos(b, u.len()));
    String::from_utf16_lossy(&u[x.min(y)..x.max(y)])
}

pub fn js_substr(s: &str, start: f64, length: f64) -> String {
    let u = units(s);
    let n = u.len() as f64;
    let mut p = js_pos(start);
    if p < 0.0 { p = (n + p).max(0.0); }
    p = p.min(n);
    let l = js_pos(length).max(0.0).min(n - p);
    if l <= 0.0 { String::new() } else { String::from_utf16_lossy(&u[p as usize..(p + l) as usize]) }
}

/// ToUint16.
fn js_u16(d: f64) -> u16 {
    if d.is_finite() { (d % 65536.0) as i64 as u16 } else { 0 }
}

pub fn js_from_char_code(codes: &[f64]) -> String {
    if let [c] = codes {
        let u = js_u16(*c);
        if u < 0x80 {
            return (u as u8 as char).to_string();
        }
    }
    String::from_utf16_lossy(&codes.iter().map(|&c| js_u16(c)).collect::<Vec<_>>())
}

pub fn js_from_char_codes(codes: &Arr<f64>) -> String {
    js_from_char_code(&codes.to_vec())
}

pub fn js_from_code_point(points: &[f64]) -> Result<String, JsError> {
    let mut u = Vec::new();
    for &c in points {
        if !(c >= 0.0 && c <= 1114111.0 && c.trunc() == c) {
            return Err(JsError::named("RangeError", "Arguments contain a value that is out of range of code points"));
        }
        let v = c as u32;
        if v < 0x10000 { u.push(v as u16); } else { u.push((0xD800 + ((v - 0x10000) >> 10)) as u16); u.push((0xDC00 + ((v - 0x10000) & 0x3FF)) as u16); }
    }
    Ok(String::from_utf16_lossy(&u))
}

pub fn js_from_code_points(points: &Arr<f64>) -> Result<String, JsError> {
    js_from_code_point(&points.to_vec())
}

pub fn js_normalize(s: &str, form: &str) -> String {
    use unicode_normalization::UnicodeNormalization;
    match form {
        "NFD" => s.nfd().collect(),
        "NFKC" => s.nfkc().collect(),
        "NFKD" => s.nfkd().collect(),
        _ => s.nfc().collect(),
    }
}

/// `split(sep, limit)`: at most ToUint32(limit) parts.
pub fn js_split_limit(s: &str, sep: &str, limit: f64) -> Arr<String> {
    let lim = limit.js_i32() as u32 as usize;
    let mut parts = js_split(s, sep).to_vec();
    parts.truncate(lim);
    parts.into()
}

pub fn js_starts_with_at(s: &str, t: &str, pos: f64) -> bool {
    let (h, n) = (units(s), units(t));
    let p = js_clamp_pos(pos, h.len());
    p + n.len() <= h.len() && h[p..p + n.len()] == *n
}

pub fn js_ends_with_at(s: &str, t: &str, end: f64) -> bool {
    let (h, n) = (units(s), units(t));
    let e = js_clamp_pos(end, h.len());
    e >= n.len() && h[e - n.len()..e] == *n
}

pub fn js_includes_at(s: &str, t: &str, pos: f64) -> bool {
    js_index_of_from(s, t, pos) >= 0
}

pub fn js_index_of_from(s: &str, t: &str, pos: f64) -> i64 {
    js_index_of(s, t, js_clamp_pos(pos, s.len()) as i64)
}

/// `lastIndexOf(t, from)`: from NaN searches the whole string.
pub fn js_last_index_of_from(s: &str, t: &str, from: f64) -> i64 {
    let (h, n) = (units(s), units(t));
    if n.len() > h.len() { return -1; }
    let start = (if from.is_nan() { h.len() } else { js_clamp_pos(from, h.len()) }).min(h.len() - n.len());
    (0..=start).rev().find(|&i| h[i..i + n.len()] == *n).map_or(-1, |i| i as i64)
}

/// `parseFloat(s)`: the longest decimal literal (or Infinity) after white space; NaN if none.
pub fn js_parse_float(s: &str) -> f64 {
    let t = s.trim_start_matches(js_is_space).as_bytes();
    let digit = |i: usize| i < t.len() && t[i].is_ascii_digit();
    let mut i = if t.first().map_or(false, |&c| c == b'+' || c == b'-') { 1 } else { 0 };
    if t[i..].starts_with(b"Infinity") { return if t[0] == b'-' { f64::NEG_INFINITY } else { f64::INFINITY }; }
    let mut digits = 0;
    while digit(i) { i += 1; digits += 1; }
    if i < t.len() && t[i] == b'.' { i += 1; while digit(i) { i += 1; digits += 1; } }
    if digits == 0 { return f64::NAN; }
    let mut end = i;
    if i < t.len() && t[i] | 0x20 == b'e' {
        let mut j = i + 1;
        if j < t.len() && (t[j] == b'+' || t[j] == b'-') { j += 1; }
        let first = j;
        while digit(j) { j += 1; }
        if j > first { end = j; }
    }
    std::str::from_utf8(&t[..end]).ok().and_then(|x| x.parse().ok()).unwrap_or(f64::NAN)
}

/// A finite d >= 0 as m * 2^e.
fn js_decompose(d: f64) -> (i64, i64) {
    let bits = d.to_bits();
    let (be, m) = (((bits >> 52) & 0x7FF) as i64, (bits & 0xF_FFFF_FFFF_FFFF) as i64);
    if be == 0 { (m, -1074) } else { (m | 1 << 52, be - 1075) }
}

/// `{:.(p-1)e}` of d: Rust's exact, correctly rounded digits (an exact tie to even) and the first's exponent.
fn js_fmt_digits(d: f64, p: usize) -> (Vec<u8>, i64) {
    let s = format!("{:.*e}", p - 1, d);
    let (m, x) = s.split_once('e').unwrap();
    (m.bytes().filter(|&b| b != b'.').collect(), x.parse().unwrap())
}

/// d (finite, >= 0) rounded to p significant digits, half up, from its exact decimal value: the digits and the
/// exponent of the first. The formatter's digits, except at an exact tie (where it rounds to even): then rounded up
/// by hand. d = m·2^e (m odd): for e < 0 the exact text has x + k + 1 digits (k = -e, the last one a 5), so a
/// tie is x + k == p; an integer below 2^64 is checked by its remainder.
fn js_round_digits(d: f64, p: usize) -> (Vec<u8>, i64) {
    if d == 0.0 { return (vec![b'0'; p], 0); }
    let (mut m, mut e) = js_decompose(d);
    while m & 1 == 0 && e < 0 { m >>= 1; e += 1; }
    let (ds, x) = js_fmt_digits(d, p);
    let tie = if e < 0 {
        let k = -e;
        (x + k == p as i64 || x - 1 + k == p as i64) && {
            let (ds2, x2) = js_fmt_digits(d, p + 1);
            x2 + k == p as i64 && ds2.last() == Some(&b'5')
        }
    } else if d < 18446744073709551616.0 {
        let n = d as u64;
        let t = n.checked_ilog10().unwrap_or(0) as usize + 1;
        p < t && { let q = 10u64.pow((t - p) as u32); n % q == q / 2 }
    } else {
        return js_round_digits_big(d, p);
    };
    if !tie {
        return (ds, x);
    }
    // At a tie the p + 1 digits are exact (the last a 5): the first p rounded up. (Not the next double's digits:
    // its gap can pass a digit, 707273840904235.875 → ...236.)
    let (mut up, mut ux) = js_fmt_digits(d, p + 1);
    up.pop();
    let mut i = p;
    while i > 0 && up[i - 1] == b'9' { up[i - 1] = b'0'; i -= 1; }
    if i == 0 { up.insert(0, b'1'); up.pop(); ux += 1; } else { up[i - 1] += 1; }
    (up, ux)
}

/// js_round_digits from the exact bignum value (integers from 2^64).
fn js_round_digits_big(d: f64, p: usize) -> (Vec<u8>, i64) {
    if d == 0.0 { return (vec![b'0'; p], 0); }
    let (m, e) = js_decompose(d);
    let mut n = JsBigInt::from(m);
    if e >= 0 { n = n << JsBigInt::from(e); }
    let mut k = -e;
    while k > 0 {
        let c = k.min(13);
        n = n * JsBigInt::from(5i64.pow(c as u32));
        k -= c;
    }
    let mut ds = n.to_string_radix(10).into_bytes();
    let mut x = ds.len() as i64 - 1 + e.min(0);
    if ds.len() <= p { ds.resize(p, b'0'); return (ds, x); }
    let up = ds[p] >= b'5';
    ds.truncate(p);
    if up {
        let mut i = p;
        while i > 0 && ds[i - 1] == b'9' { ds[i - 1] = b'0'; i -= 1; }
        if i == 0 { ds.insert(0, b'1'); ds.pop(); x += 1; } else { ds[i - 1] += 1; }
    }
    (ds, x)
}

fn js_exp_text(ds: &[u8], e: i64) -> String {
    let text = String::from_utf8_lossy(ds);
    format!("{}{}e{}{}", &text[..1], if ds.len() > 1 { format!(".{}", &text[1..]) } else { String::new() }, if e >= 0 { "+" } else { "-" }, e.abs())
}

pub fn js_to_precision(d: f64, precision: f64) -> Result<String, JsError> {
    let p = js_pos(precision);
    if !d.is_finite() { return Ok(js_num(d)); }
    if !(1.0..=100.0).contains(&p) { return Err(JsError::named("RangeError", "toPrecision() argument must be between 1 and 100")); }
    let n = p as i64;
    let (ds, e) = js_round_digits(d.abs(), n as usize);
    let sign = if d < 0.0 { "-" } else { "" };
    let t = String::from_utf8_lossy(&ds).into_owned();
    Ok(if e < -6 || e >= n {
        format!("{sign}{}", js_exp_text(&ds, e))
    } else if e == n - 1 {
        format!("{sign}{t}")
    } else if e >= 0 {
        format!("{sign}{}.{}", &t[..e as usize + 1], &t[e as usize + 1..])
    } else {
        format!("{sign}0.{}{t}", "0".repeat((-(e + 1)) as usize))
    })
}

pub fn js_to_exponential(d: f64, digits: f64) -> Result<String, JsError> {
    let f = js_pos(digits);
    if !d.is_finite() { return Ok(js_num(d)); }
    if !(0.0..=100.0).contains(&f) { return Err(JsError::named("RangeError", "toExponential() argument must be between 0 and 100")); }
    let (ds, e) = js_round_digits(d.abs(), f as usize + 1);
    Ok(format!("{}{}", if d < 0.0 { "-" } else { "" }, js_exp_text(&ds, e)))
}

/// Rust's `{:e}` shortest digits of d (> 0, finite) and the exponent of the first.
fn js_shortest(d: f64) -> (Vec<u8>, i64) {
    let text = format!("{:e}", d);
    let (mantissa, exponent) = text.split_once('e').unwrap_or((&text, "0"));
    (mantissa.bytes().filter(|&c| c != b'.').collect(), exponent.parse().unwrap_or(0))
}

/// The shortest digits when two are equally near d (> 0, finite): Rust's formatter takes the upper (…313), JavaScript
/// the even one (860.8474731445312). Only an exact value of at most 18 digits ending in 5 can be such a tie, so only a
/// mantissa times 5^0..25 or 2^0..74 is checked (cheap bit tests first); None when Rust's digits are JavaScript's.
fn js_shortest_tie(d: f64) -> Option<(Vec<u8>, i64)> {
    let (m, e) = js_decompose(d);
    if m == 0 { return None; }
    let tz = m.trailing_zeros() as i64;
    let (m, e) = (m >> tz, e + tz);
    let mut x: u128 = if (-25..0).contains(&e) { m as u128 * 5u128.pow((-e) as u32) } else if (0..=74).contains(&e) { (m as u128) << e } else { return None };
    while x % 10 == 0 { x /= 10; }
    if x % 10 != 5 || x < 100 { return None; }
    let (mut ds, exp) = js_shortest(d);
    let lower = ds.iter().fold(0u128, |v, &c| v * 10 + (c - b'0') as u128).checked_sub(1)?;
    if ds.len() < 2 || (ds[ds.len() - 1] - b'0') % 2 == 0 || x != lower * 10 + 5 { return None; }
    *ds.last_mut().unwrap() -= 1;
    Some((ds, exp))
}

/// Number::toString's layout of the digits `ds` whose first has the exponent `e`.
fn js_layout(ds: &[u8], e: i64) -> String {
    let (k, n) = (ds.len() as i64, e + 1);
    let text = String::from_utf8_lossy(ds);
    if k <= n && n <= 21 { format!("{text}{}", "0".repeat((n - k) as usize)) }
    else if 0 < n && n <= 21 { format!("{}.{}", &text[..n as usize], &text[n as usize..]) }
    else if -6 < n && n <= 0 { format!("0.{}{text}", "0".repeat((-n) as usize)) }
    else { js_exp_text(ds, e) }
}

/// `toExponential()`: the shortest digits that read back as d (those String(d) has).
pub fn js_to_exponential_auto(d: f64) -> String {
    if !d.is_finite() { return js_num(d); }
    if d == 0.0 { return "0e+0".into(); }
    let (ds, e) = js_shortest_tie(d.abs()).unwrap_or_else(|| js_shortest(d.abs()));
    format!("{}{}", if d < 0.0 { "-" } else { "" }, js_exp_text(&ds, e))
}

/// x * 2^by as an integer (x finite, >= 0, a multiple of 2^-by).
fn js_scaled(x: f64, by: i64) -> JsBigInt {
    let (m, e) = js_decompose(x);
    JsBigInt::from(m) << JsBigInt::from(e + by)
}

/// `toString(radix)`: JavaScriptCore's digits (bun's): the integer part exact, the fraction until the next or previous
/// double would print differently, rounded half to even (NumberPrototype.cpp's toStringWithRadixInternal, exactly).
pub fn js_to_radix(d: f64, radix_arg: f64) -> Result<String, JsError> {
    let r = js_pos(radix_arg);
    if !(2.0..=36.0).contains(&r) { return Err(JsError::named("RangeError", "toString() radix argument must be between 2 and 36")); }
    let radix = r as u32;
    if radix == 10 || !d.is_finite() { return Ok(js_num(d)); }
    let n = d.abs();
    let mut ip = n.floor();
    let fp = n - ip;
    const CHARS: &[u8] = b"0123456789abcdefghijklmnopqrstuvwxyz";
    let int_text = |v: u64| {
        let (mut v, mut out) = (v, Vec::new());
        loop { out.push(CHARS[(v % radix as u64) as usize]); v /= radix as u64; if v == 0 { break; } }
        out.reverse();
        String::from_utf8(out).unwrap()
    };
    let sign = if d < 0.0 { "-" } else { "" };
    if fp == 0.0 && ip < 4503599627370496.0 { return Ok(format!("{sign}{}", int_text(ip as u64))); }
    let mut frac: Vec<u8> = Vec::new();
    if fp != 0.0 {
        // Fixed point: every value here is a multiple of 2^-1076.
        let s = 1076;
        let one = JsBigInt::from(1) << JsBigInt::from(s);
        let half = JsBigInt::from(1) << JsBigInt::from(s - 1);
        let mask = one.clone() - JsBigInt::from(1);
        let big = JsBigInt::from(radix as i64);
        let mut f = js_scaled(fp, s);
        let mut next = js_scaled(f64::from_bits(n.to_bits() + 1) - n, s - 1);
        let mut last = js_scaled(n - f64::from_bits(n.to_bits() - 1), s - 1);
        let mut digit = if ip <= 9007199254740991.0 && ip % 2.0 == 1.0 { 1 } else { 0 };
        let (mut odd, mut up) = (digit == 1, false);
        loop {
            if f > half || (f == half && if radix & 1 == 1 { odd } else { digit & 1 == 1 }) {
                if f.clone() + next.clone() > one { up = true; break; }
            } else if f < last {
                break;
            }
            f = f * big.clone();
            digit = (f.clone() >> JsBigInt::from(s)).to_f64() as u32;
            f = f & mask.clone();
            next = next * big.clone();
            last = last * big.clone();
            frac.push(digit as u8);
            if digit & 1 == 1 { odd = !odd; }
        }
        if up {
            while frac.last() == Some(&(radix as u8 - 1)) { frac.pop(); }
            match frac.last_mut() { Some(x) => *x += 1, None => ip += 1.0 }
        } else {
            while frac.last() == Some(&0) { frac.pop(); }
        }
    }
    let whole = if ip < 9007199254740992.0 { int_text(ip as u64) } else { js_scaled(ip, 0).to_string_radix(radix) };
    let frac: String = frac.iter().map(|&x| CHARS[x as usize] as char).collect();
    Ok(if frac.is_empty() { format!("{sign}{whole}") } else { format!("{sign}{whole}.{frac}") })
}

// WeakMap / WeakSet / WeakRef keys (weak.rs): arrays and records by identity.
impl<T: Clone + 'static> super::weak::JsWeakKey for Arr<T> {
    type W = std::rc::Weak<RefCell<Vec<T>>>;
    fn downgrade(&self) -> Self::W {
        Rc::downgrade(&self.0)
    }
    fn upgrade(w: &Self::W) -> Option<Self> {
        w.upgrade().map(Arr)
    }
    fn alive(w: &Self::W) -> bool {
        w.strong_count() > 0
    }
    fn weak_addr(&self) -> usize {
        self.addr()
    }
}

impl<T: Clone + 'static> super::weak::JsWeakKey for Map<T> {
    type W = std::rc::Weak<RefCell<Entries<T>>>;
    fn downgrade(&self) -> Self::W {
        Rc::downgrade(&self.0)
    }
    fn upgrade(w: &Self::W) -> Option<Self> {
        w.upgrade().map(Map)
    }
    fn alive(w: &Self::W) -> bool {
        w.strong_count() > 0
    }
    fn weak_addr(&self) -> usize {
        self.addr()
    }
}

// Math.asinh / acosh / atanh (lib4): the platform's C library, as JavaScriptCore calls it (Rust's own formulas differ
// in the last digit); wasm has no C library: Rust's.
#[cfg(not(target_arch = "wasm32"))]
mod libm_ffi {
    extern "C" {
        pub fn asinh(x: f64) -> f64;
        pub fn acosh(x: f64) -> f64;
        pub fn atanh(x: f64) -> f64;
    }
}
pub fn js_asinh(x: f64) -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    return unsafe { libm_ffi::asinh(x) };
    #[cfg(target_arch = "wasm32")]
    return x.asinh();
}
pub fn js_acosh(x: f64) -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    return unsafe { libm_ffi::acosh(x) };
    #[cfg(target_arch = "wasm32")]
    return x.acosh();
}
pub fn js_atanh(x: f64) -> f64 {
    #[cfg(not(target_arch = "wasm32"))]
    return unsafe { libm_ffi::atanh(x) };
    #[cfg(target_arch = "wasm32")]
    return x.atanh();
}
