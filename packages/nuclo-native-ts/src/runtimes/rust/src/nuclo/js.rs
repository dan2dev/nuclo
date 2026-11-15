//! JavaScript's value model for the generated code: shared mutable variables, arrays and maps
//! with reference semantics, and numbers formatted as JavaScript formats them.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::thread::LocalKey;

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
        self.at(i).expect("array index out of range")
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
}

impl<T: Clone + PartialEq> Arr<T> {
    pub fn index_of(&self, value: &T) -> i64 {
        self.0.borrow().iter().position(|item| item == value).map_or(-1, |i| i as i64)
    }
    pub fn includes(&self, value: &T) -> bool {
        self.0.borrow().contains(value)
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

pub struct Map<T>(Rc<RefCell<HashMap<String, T>>>);

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

impl<T: Clone> Map<T> {
    pub fn from_pairs(pairs: Vec<(&str, T)>) -> Self {
        Map(Rc::new(RefCell::new(pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect())))
    }
    pub fn get(&self, key: &str) -> Option<T> {
        self.0.borrow().get(key).cloned()
    }
    pub fn insert(&self, key: &str, value: T) {
        self.0.borrow_mut().insert(key.to_string(), value);
    }
    pub(crate) fn entries(&self) -> Vec<(String, T)> {
        self.0.borrow().iter().map(|(k, v)| (k.clone(), v.clone())).collect()
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
    if magnitude >= 1e21 || magnitude < 1e-6 {
        let s = format!("{d:e}");
        return if s.contains("e-") { s } else { s.replace('e', "e+") };
    }
    format!("{d}")
}

/// `toFixed`: exact halves round away from zero, which Rust's formatter (half to even) does not.
pub fn js_fixed(d: f64, digits: i64) -> String {
    let digits = digits.clamp(0, 100) as usize;
    // A half at this precision is an odd multiple of 2^-(digits + 1): only then do the two differ.
    let scaled = d * 2f64.powi(digits as i32 + 1);
    let tie = d.is_finite() && scaled.fract() == 0.0 && scaled % 2.0 != 0.0;
    let value = if tie { f64::from_bits(d.to_bits() + 1) } else { d };
    format!("{value:.digits$}")
}

pub fn js_round(d: f64) -> i64 {
    (d + 0.5).floor() as i64
}

pub fn js_now() -> f64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0.0, |t| t.as_millis() as f64)
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

pub fn js_number(s: &str) -> f64 {
    let s = s.trim();
    if s.is_empty() { 0.0 } else { s.parse().unwrap_or(f64::NAN) }
}

pub fn js_parse_int(s: &str) -> i64 {
    let s = s.trim();
    let end = s.char_indices().find(|&(i, c)| !(c.is_ascii_digit() || (i == 0 && (c == '-' || c == '+')))).map_or(s.len(), |(i, _)| i);
    s[..end].parse().unwrap_or(0)
}

pub fn js_min<T: PartialOrd>(a: T, b: T) -> T {
    if b < a { b } else { a }
}

pub fn js_max<T: PartialOrd>(a: T, b: T) -> T {
    if b > a { b } else { a }
}

/// `a || b` on strings.
pub fn js_or(a: String, b: String) -> String {
    if a.is_empty() { b } else { a }
}

/// `.length` counts UTF-16 units, as JavaScript (and Kotlin) do.
pub fn js_len(s: &str) -> i64 {
    s.encode_utf16().count() as i64
}

pub fn js_str_slice(s: &str, start: i64, end: Option<i64>) -> String {
    let units: Vec<u16> = s.encode_utf16().collect();
    let from = clamp_index(start, units.len());
    let to = end.map_or(units.len(), |e| clamp_index(e, units.len()));
    if from < to { String::from_utf16_lossy(&units[from..to]) } else { String::new() }
}
