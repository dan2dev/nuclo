// nns_rt (Rust): prototype subset for the worked examples. Not the final library.
#![allow(dead_code)]
pub use std::cell::{Cell, RefCell};
use std::fmt;
use std::future::Future;
use std::hash::Hash;
use std::pin::Pin;
pub use std::rc::Rc;
use std::task::{Context, Poll, Waker};

// ---- traps -----------------------------------------------------------------
pub fn trap(message: &str) -> ! {
  eprintln!("trap: {}", message);
  std::process::abort()
}

// ---- string: immutable, a copy is O(1) -------------------------------------
#[derive(Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Str(Rc<str>);
impl From<&str> for Str { fn from(s: &str) -> Str { Str(Rc::from(s)) } }
impl From<String> for Str { fn from(s: String) -> Str { Str(Rc::from(s)) } }
impl std::ops::Deref for Str { type Target = str; fn deref(&self) -> &str { &self.0 } }
impl fmt::Display for Str { fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result { f.write_str(&self.0) } }
pub fn concat(a: &Str, b: &Str) -> Str { Str::from(format!("{}{}", a, b)) }
pub fn print(text: &Str) { println!("{}", text); }
pub fn split(s: &Str, separator: &Str) -> List<Str> { List(Rc::new(s.split(&**separator).map(Str::from).collect())) }
/// `s.slice(start, end)`: positions count scalar values; a position out of range is moved into the range.
pub fn str_slice(s: &Str, start: i32, end: Option<i32>) -> Str {
  let ascii = s.is_ascii();
  let at = |n: i32| -> usize {
    if n <= 0 { 0 } else if ascii { (n as usize).min(s.len()) } else { s.char_indices().nth(n as usize).map_or(s.len(), |(i, _)| i) }
  };
  let from = at(start);
  let to = end.map_or(s.len(), at).max(from);
  if from == 0 && to == s.len() { return s.clone(); }
  Str::from(&s[from..to])
}
/// `s.indexOf(part)`: the scalar position of the first `part`, or -1; 0 for the empty part.
pub fn str_index_of(s: &Str, part: &Str) -> i32 {
  match s.find(&**part) { Some(i) => s[..i].chars().count() as i32, None => -1 }
}
pub fn str_trim(s: &Str) -> Str { Str::from(s.trim()) }
pub fn str_lower(s: &Str) -> Str { Str::from(s.to_lowercase()) }
pub fn str_upper(s: &Str) -> Str { Str::from(s.to_uppercase()) }
pub fn str_includes(s: &Str, part: &Str) -> bool { s.contains(&**part) }
pub fn str_starts_with(s: &Str, prefix: &Str) -> bool { s.starts_with(&**prefix) }
pub fn str_ends_with(s: &Str, suffix: &Str) -> bool { s.ends_with(&**suffix) }

// ---- int and long: trap on overflow ------------------------------------------
pub trait Checked: Copy {
  fn c_add(self, o: Self) -> Option<Self>;
  fn c_sub(self, o: Self) -> Option<Self>;
  fn c_mul(self, o: Self) -> Option<Self>;
  fn c_neg(self) -> Option<Self>;
}
macro_rules! checked { ($t:ty) => { impl Checked for $t {
  fn c_add(self, o: Self) -> Option<Self> { self.checked_add(o) }
  fn c_sub(self, o: Self) -> Option<Self> { self.checked_sub(o) }
  fn c_mul(self, o: Self) -> Option<Self> { self.checked_mul(o) }
  fn c_neg(self) -> Option<Self> { self.checked_neg() }
} }; }
checked!(i32);
checked!(i64);
pub fn add<T: Checked>(a: T, b: T) -> T { a.c_add(b).unwrap_or_else(|| trap("int overflow")) }
pub fn sub<T: Checked>(a: T, b: T) -> T { a.c_sub(b).unwrap_or_else(|| trap("int overflow")) }
pub fn mul<T: Checked>(a: T, b: T) -> T { a.c_mul(b).unwrap_or_else(|| trap("int overflow")) }
pub fn neg<T: Checked>(a: T) -> T { a.c_neg().unwrap_or_else(|| trap("int overflow")) }
pub fn to_int(x: f64) -> i32 {
  if !(x > -2147483649.0 && x < 2147483648.0) { trap("toInt: value out of range") }
  x as i32
}

// ---- float to text: the ECMAScript Number::toString format --------------------
pub fn text(x: f64) -> String {
  if x.is_nan() { return "NaN".into(); }
  if x == 0.0 { return "0".into(); }
  if x.is_infinite() { return if x > 0.0 { "Infinity".into() } else { "-Infinity".into() }; }
  let s = format!("{:e}", x.abs()); // the shortest digits that give the same value
  let (mantissa, exponent) = s.split_once('e').unwrap();
  let digits: String = mantissa.chars().filter(|c| *c != '.').collect();
  let k = digits.len() as i32;
  let n = exponent.parse::<i32>().unwrap() + 1;
  let body = if k <= n && n <= 21 {
    format!("{}{}", digits, "0".repeat((n - k) as usize))
  } else if 0 < n && n <= 21 {
    format!("{}.{}", &digits[..n as usize], &digits[n as usize..])
  } else if -6 < n && n <= 0 {
    format!("0.{}{}", "0".repeat((-n) as usize), digits)
  } else {
    let e = n - 1;
    let sign = if e < 0 { "-" } else { "+" };
    if k == 1 { format!("{}e{}{}", digits, sign, e.abs()) }
    else { format!("{}.{}e{}{}", &digits[..1], &digits[1..], sign, e.abs()) }
  };
  if x < 0.0 { format!("-{}", body) } else { body }
}

// ---- list: an Rc buffer with copy on write --------------------------------------
#[derive(Clone, PartialEq, Eq, Hash)]
pub struct List<T>(Rc<Vec<T>>);
impl<T, const N: usize> From<[T; N]> for List<T> { fn from(a: [T; N]) -> List<T> { List(Rc::new(Vec::from(a))) } }
impl<T> From<Vec<T>> for List<T> { fn from(v: Vec<T>) -> List<T> { List(Rc::new(v)) } }
impl<T: Clone> List<T> {
  pub fn new() -> List<T> { List(Rc::new(Vec::new())) }
  pub fn len(&self) -> i32 { self.0.len() as i32 }
  fn check(&self, i: i32) -> usize {
    if i < 0 || i >= self.len() { trap("index out of range") }
    i as usize
  }
  pub fn at(&self, i: i32) -> &T { &self.0[self.check(i)] }
  /// The element itself. Copies the buffer first when a second holder exists.
  pub fn at_mut(&mut self, i: i32) -> &mut T { let i = self.check(i); &mut Rc::make_mut(&mut self.0)[i] }
  pub fn get(&self, i: i32) -> Option<T> { if i < 0 { None } else { self.0.get(i as usize).cloned() } }
  pub fn set_at(&mut self, i: i32, v: T) { *self.at_mut(i) = v; }
  pub fn extend(&mut self, other: &List<T>) { Rc::make_mut(&mut self.0).extend(other.0.iter().cloned()); }
  pub fn push(&mut self, v: T) { Rc::make_mut(&mut self.0).push(v); }
  pub fn pop(&mut self) -> Option<T> { Rc::make_mut(&mut self.0).pop() }
  pub fn iter(&self) -> std::slice::Iter<'_, T> { self.0.iter() }
  pub fn map<U>(&self, f: impl FnMut(&T) -> U) -> List<U> { List(Rc::new(self.0.iter().map(f).collect())) }
  pub fn filter(&self, keep: impl Fn(&T) -> bool) -> List<T> { List(Rc::new(self.0.iter().filter(|x| keep(x)).cloned().collect())) }
  pub fn concat(&self, other: &List<T>) -> List<T> { let mut v = (*self.0).clone(); v.extend(other.0.iter().cloned()); List(Rc::new(v)) }
  pub fn insert(&mut self, i: i32, v: T) { if i < 0 || i > self.len() { trap("index out of range") } Rc::make_mut(&mut self.0).insert(i as usize, v); }
  pub fn remove_at(&mut self, i: i32) -> T { let i = self.check(i); Rc::make_mut(&mut self.0).remove(i) }
  pub fn clear(&mut self) { Rc::make_mut(&mut self.0).clear(); }
  /// In place and stable.
  pub fn sort(&mut self, less: impl Fn(&T, &T) -> bool) {
    Rc::make_mut(&mut self.0).sort_by(|a, b| {
      if less(a, b) { std::cmp::Ordering::Less } else if less(b, a) { std::cmp::Ordering::Greater } else { std::cmp::Ordering::Equal }
    });
  }
}

// ---- Map and Set: insertion order. Prototype: a linear search. -----------------
#[derive(Clone)]
pub struct Map<K, V>(Rc<Vec<(K, V)>>);
impl<K, V, const N: usize> From<[(K, V); N]> for Map<K, V> where K: Clone + Eq + Hash, V: Clone {
  fn from(a: [(K, V); N]) -> Map<K, V> { let mut m = Map::new(); for (k, v) in a { m.set(k, v); } m }
}
impl<K: PartialEq, V: PartialEq> PartialEq for Map<K, V> {
  fn eq(&self, o: &Self) -> bool { self.0.len() == o.0.len() && self.0.iter().all(|e| o.0.iter().any(|f| f.0 == e.0 && f.1 == e.1)) }
}
impl<K: Clone + Eq + Hash, V: Clone> Map<K, V> {
  pub fn new() -> Map<K, V> { Map(Rc::new(Vec::new())) }
  pub fn get(&self, k: &K) -> Option<V> { self.0.iter().find(|e| e.0 == *k).map(|e| e.1.clone()) }
  pub fn set(&mut self, k: K, v: V) {
    let items = Rc::make_mut(&mut self.0);
    match items.iter_mut().find(|e| e.0 == k) { Some(e) => e.1 = v, None => items.push((k, v)) }
  }
  pub fn delete(&mut self, k: &K) -> bool {
    let items = Rc::make_mut(&mut self.0);
    let n = items.len();
    items.retain(|e| e.0 != *k);
    items.len() != n
  }
  pub fn has(&self, k: &K) -> bool { self.0.iter().any(|e| e.0 == *k) }
  pub fn keys(&self) -> List<K> { List(Rc::new(self.0.iter().map(|e| e.0.clone()).collect())) }
}
#[derive(Clone)]
pub struct Set<T>(Rc<Vec<T>>);
impl<T: PartialEq> PartialEq for Set<T> {
  fn eq(&self, o: &Self) -> bool { self.0.len() == o.0.len() && self.0.iter().all(|x| o.0.contains(x)) }
}
impl<T: Clone + Eq + Hash> Set<T> {
  pub fn from(xs: List<T>) -> Set<T> { let mut s = Set(Rc::new(Vec::new())); for x in xs.iter() { s.add(x.clone()); } s }
  pub fn has(&self, v: &T) -> bool { self.0.contains(v) }
  pub fn add(&mut self, v: T) { if !self.has(&v) { Rc::make_mut(&mut self.0).push(v); } }
  pub fn delete(&mut self, v: &T) -> bool {
    let items = Rc::make_mut(&mut self.0);
    let n = items.len();
    items.retain(|e| e != v);
    items.len() != n
  }
}

// ---- defer: a guard that runs its block when it is dropped ---------------------
pub struct Defer<F: FnOnce()>(Option<F>);
impl<F: FnOnce()> Defer<F> { pub fn new(f: F) -> Defer<F> { Defer(Some(f)) } }
impl<F: FnOnce()> Drop for Defer<F> { fn drop(&mut self) { if let Some(f) = self.0.take() { f() } } }

// ---- async: one single-thread executor. Prototype: it polls each task in turn. --
pub type BoxFuture<T> = Pin<Box<dyn Future<Output = T>>>;
struct TaskState<T> { result: RefCell<Option<T>>, done: Cell<bool>, cancelled: Cell<bool> }
pub struct Task<T>(Rc<TaskState<T>>);
impl<T: Clone> Task<T> {
  pub fn cancel(&self) { if !self.0.done.get() { self.0.cancelled.set(true); } }
  pub fn join(&self) -> Join<T> { Join(self.0.clone()) }
}
pub struct Join<T>(Rc<TaskState<T>>);
impl<T: Clone> Future for Join<T> {
  type Output = Option<T>;
  fn poll(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<Option<T>> {
    if self.0.cancelled.get() { Poll::Ready(None) }
    else if self.0.done.get() { Poll::Ready(self.0.result.borrow().clone()) }
    else { Poll::Pending }
  }
}
trait Turn { fn turn(&mut self, cx: &mut Context<'_>) -> bool; }
struct Slot<T> { state: Rc<TaskState<T>>, future: Option<BoxFuture<T>> }
impl<T> Turn for Slot<T> {
  fn turn(&mut self, cx: &mut Context<'_>) -> bool {
    if self.state.cancelled.get() { self.future = None; return true; } // the drop runs the open defer blocks
    match self.future.as_mut().unwrap().as_mut().poll(cx) {
      Poll::Ready(v) => { *self.state.result.borrow_mut() = Some(v); self.state.done.set(true); self.future = None; true }
      Poll::Pending => false,
    }
  }
}
thread_local! { static TASKS: RefCell<Vec<Box<dyn Turn>>> = RefCell::new(Vec::new()); }
/// The task starts later, after the current code waits or returns.
pub fn spawn<T: 'static>(future: impl Future<Output = T> + 'static) -> Task<T> {
  let state = Rc::new(TaskState { result: RefCell::new(None), done: Cell::new(false), cancelled: Cell::new(false) });
  TASKS.with(|t| t.borrow_mut().push(Box::new(Slot { state: state.clone(), future: Some(Box::pin(future)) })));
  Task(state)
}
pub fn run(main: impl Future<Output = ()> + 'static) {
  let mut cx = Context::from_waker(Waker::noop());
  let mut main: Option<BoxFuture<()>> = Some(Box::pin(main));
  loop {
    if let Some(m) = main.as_mut() { if m.as_mut().poll(&mut cx).is_ready() { main = None; } }
    let tasks = TASKS.with(|t| std::mem::take(&mut *t.borrow_mut()));
    let mut open: Vec<Box<dyn Turn>> = Vec::new();
    for mut task in tasks { if !task.turn(&mut cx) { open.push(task); } }
    let empty = TASKS.with(|t| { let mut q = t.borrow_mut(); open.append(&mut q); *q = open; q.is_empty() });
    if main.is_none() && empty { break; }
  }
}
/// A future that is not complete at its first poll: an extern operation that is pending.
pub struct Later<T>(Option<T>, bool);
pub fn later<T>(v: T) -> Later<T> { Later(Some(v), false) }
impl<T: Unpin> Future for Later<T> {
  type Output = T;
  fn poll(mut self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<T> {
    if self.1 { Poll::Ready(self.0.take().unwrap()) } else { self.1 = true; Poll::Pending }
  }
}
