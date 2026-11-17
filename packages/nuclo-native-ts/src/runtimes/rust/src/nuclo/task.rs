//! Async for the generated code: a single-threaded executor for `async` functions, timers,
//! fetch (on a thread, resumed on the UI thread), JSON decoding and console.log.

use std::any::Any;
use std::cell::{Cell, RefCell};
use std::collections::{HashMap, VecDeque};
use std::future::Future;
use std::pin::Pin;
use std::rc::Rc;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll, Wake, Waker};

use super::backend::backend;
use super::js::{Arr, Map};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/// What `throw new Error(message)` throws and `catch (e)` receives.
#[derive(Clone)]
pub struct JsError {
    pub message: String,
    /// "Error", or the class of an error the runtime throws as JavaScript would (`RangeError` of a BigInt division by 0),
    /// or the `name` of a thrown object of an app's error class.
    pub name: std::borrow::Cow<'static, str>,
    /// The object of an app's error class (`class E extends Error`) this error carries (`throw new E(…)`).
    pub obj: Option<Rc<dyn Any>>,
}

impl std::fmt::Debug for JsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", js_error_message(self))
    }
}

impl JsError {
    pub fn new(message: impl Into<String>) -> JsError {
        JsError { message: message.into(), name: std::borrow::Cow::Borrowed("Error"), obj: None }
    }

    pub fn named(name: &'static str, message: impl Into<String>) -> JsError {
        JsError { message: message.into(), name: std::borrow::Cow::Borrowed(name), obj: None }
    }

    /// An object of an app's error class thrown: its name and message (for the runtime's messages), and the object.
    pub fn wrap(name: String, message: String, obj: Rc<dyn Any>) -> JsError {
        JsError { message, name: std::borrow::Cow::Owned(name), obj: Some(obj) }
    }
}

/// `String(e)`, as the other runtimes print it.
pub fn js_error_message(error: &JsError) -> String {
    if error.message.is_empty() { error.name.to_string() } else { format!("{}: {}", error.name, error.message) }
}

// ---------------------------------------------------------------------------
// The executor
// ---------------------------------------------------------------------------

type Task = Pin<Box<dyn Future<Output = ()>>>;
type Done = Box<dyn FnOnce(Box<dyn Any + Send>)>;

thread_local! {
    static TASKS: RefCell<HashMap<u64, Task>> = RefCell::default();
    /// What to do on the UI thread with the result of work done on another thread.
    static PENDING: RefCell<HashMap<u64, Done>> = RefCell::default();
    static NEXT_ID: Cell<u64> = const { Cell::new(1) };
}

/// Tasks to poll and finished off-thread work: the only state other threads touch.
static READY: Mutex<Vec<u64>> = Mutex::new(Vec::new());
static FINISHED: Mutex<Vec<(u64, Box<dyn Any + Send>)>> = Mutex::new(Vec::new());
static NOTIFY: Mutex<Option<Arc<dyn Fn() + Send + Sync>>> = Mutex::new(None);

pub(crate) fn start() {
    *NOTIFY.lock().unwrap() = Some(backend().waker());
}

fn notify() {
    let notify = NOTIFY.lock().unwrap().clone();
    if let Some(notify) = notify {
        notify();
    }
}

fn next_id() -> u64 {
    NEXT_ID.with(|next| next.replace(next.get() + 1))
}

struct TaskWaker(u64);

impl Wake for TaskWaker {
    fn wake(self: Arc<Self>) {
        READY.lock().unwrap().push(self.0);
        notify();
    }
}

fn poll(id: u64) {
    // The task is out of the table while it runs: it may launch others.
    let Some(mut task) = TASKS.with(|tasks| tasks.borrow_mut().remove(&id)) else { return };
    let waker = Waker::from(Arc::new(TaskWaker(id)));
    if task.as_mut().poll(&mut Context::from_waker(&waker)).is_pending() {
        TASKS.with(|tasks| tasks.borrow_mut().insert(id, task));
    }
}

/// Starts an async call from synchronous code; an uncaught error is logged.
pub fn launch<T>(call: impl Future<Output = Result<T, JsError>> + 'static) {
    let id = next_id();
    let task: Task = Box::pin(async move {
        if let Err(error) = call.await {
            // As the browser's console says it of an async call nobody awaits.
            backend().log(&format!("Uncaught (in promise) {}", js_error_message(&error)), true);
        }
    });
    TASKS.with(|tasks| tasks.borrow_mut().insert(id, task));
    poll(id);
}

/// The UI thread's turn (`host::wake`): delivers off-thread results, then resumes woken tasks.
pub(crate) fn run_ready() {
    let finished = std::mem::take(&mut *FINISHED.lock().unwrap());
    for (id, result) in finished {
        if let Some(done) = PENDING.with(|pending| pending.borrow_mut().remove(&id)) {
            done(result);
        }
    }
    let ready = std::mem::take(&mut *READY.lock().unwrap());
    for id in ready {
        poll(id);
    }
    // A task's end (a timer, a native completion): its microtasks run now.
    SCHEDULED.with(|s| s.set(false));
    drain_microtasks();
}

// ---------------------------------------------------------------------------
// Promises and the microtask queue (see NucloRuntime.swift: the same model, the same job order)
// ---------------------------------------------------------------------------

thread_local! {
    static JOBS: RefCell<VecDeque<Box<dyn FnOnce()>>> = RefCell::default();
    static DRAINING: Cell<bool> = const { Cell::new(false) };
    static SCHEDULED: Cell<bool> = const { Cell::new(false) };
    /// Promises rejected while nothing handled them: reported once the queue drains, if still unhandled.
    static REJECTED: RefCell<Vec<Rc<dyn Rejection>>> = RefCell::default();
}

trait Rejection {
    fn handled(&self) -> bool;
    fn reason(&self) -> Option<JsError>;
}

pub fn queue_microtask(job: impl FnOnce() + 'static) {
    JOBS.with(|jobs| jobs.borrow_mut().push_back(Box::new(job)));
    schedule_drain();
}

/// Work queued outside a runtime entry point that drains (a native completion): the main loop drains it.
pub(crate) fn schedule_drain_pub() {
    schedule_drain();
}

fn schedule_drain() {
    if DRAINING.with(Cell::get) || SCHEDULED.with(|s| s.replace(true)) {
        return;
    }
    notify();
}

/// Runs every queued microtask (and those they queue), then reports the rejections nothing handled.
pub fn drain_microtasks() {
    if DRAINING.with(|d| d.replace(true)) {
        return;
    }
    while let Some(job) = JOBS.with(|jobs| jobs.borrow_mut().pop_front()) {
        job();
    }
    // The job is over: WeakRef targets it read are no longer kept (lib4).
    super::weak::clear_kept();
    DRAINING.with(|d| d.set(false));
    // No app code is running: a safe point for the cycle collector.
    super::gc::gc_maybe();
    for p in REJECTED.with(|r| std::mem::take(&mut *r.borrow_mut())) {
        if !p.handled() {
            backend_log(&format!("Uncaught (in promise) {}", js_error_message(&p.reason().unwrap())));
        }
    }
}

fn backend_log(line: &str) {
    if NOTIFY.lock().unwrap().is_some() { backend().log(line, true) } else { eprintln!("{line}") }
}

enum State<T> {
    Pending,
    Fulfilled(T),
    Rejected(JsError),
}

struct PromiseInner<T> {
    state: RefCell<State<T>>,
    reactions: RefCell<Vec<Box<dyn FnOnce(&Promise<T>)>>>,
    /// Resolved or rejected (or following another promise): what settles it later is ignored.
    resolved: Cell<bool>,
    handled: Cell<bool>,
    /// The state machine of the async function this is the promise of; dropped once it settles.
    step: RefCell<Option<Rc<dyn Fn(Promise<T>)>>>,
    await_error: RefCell<Option<JsError>>,
}

impl<T> Rejection for PromiseInner<T> {
    fn handled(&self) -> bool {
        self.handled.get()
    }
    fn reason(&self) -> Option<JsError> {
        match &*self.state.borrow() {
            State::Rejected(e) => Some(e.clone()),
            _ => None,
        }
    }
}

/// `Promise<T>`: settled once; its reactions run as microtasks and are dropped once it settles (no cycle remains).
pub struct Promise<T>(Rc<PromiseInner<T>>);

impl<T> Clone for Promise<T> {
    fn clone(&self) -> Self {
        Promise(self.0.clone())
    }
}

impl<T> PartialEq for Promise<T> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

/// An element of `Promise.allSettled`'s result.
#[derive(Clone)]
pub struct JsSettled<T> {
    pub status: String,
    pub value: Option<T>,
    pub reason: Option<JsError>,
}

impl<T: Clone + 'static> Promise<T> {
    pub fn new() -> Promise<T> {
        Promise(Rc::new(PromiseInner {
            state: RefCell::new(State::Pending),
            reactions: RefCell::default(),
            resolved: Cell::new(false),
            handled: Cell::new(false),
            step: RefCell::new(None),
            await_error: RefCell::new(None),
        }))
    }

    pub fn resolved(v: T) -> Promise<T> {
        let p = Promise::new();
        p.resolve(v);
        p
    }

    pub fn rejected(e: JsError) -> Promise<T> {
        let p = Promise::new();
        p.reject(e);
        p
    }

    pub fn resolve(&self, v: T) {
        if !self.0.resolved.replace(true) {
            self.settle(State::Fulfilled(v));
        }
    }

    pub fn reject(&self, e: JsError) {
        if !self.0.resolved.replace(true) {
            self.settle(State::Rejected(e));
        }
    }

    /// Resolving with a promise: it follows `p`, starting a job later (JavaScript's NewPromiseResolveThenableJob).
    pub fn adopt(&self, p: Promise<T>) {
        if self.0.resolved.replace(true) {
            return;
        }
        if p == *self {
            return self.settle(State::Rejected(JsError::named("TypeError", "Chaining cycle detected for promise #<Promise>")));
        }
        let (a, b) = (self.clone(), self.clone());
        queue_microtask(move || p.react(move |v| a.settle(State::Fulfilled(v)), move |e| b.settle(State::Rejected(e))));
    }

    fn settle(&self, state: State<T>) {
        let rejected = matches!(state, State::Rejected(_));
        *self.0.state.borrow_mut() = state;
        let step = self.0.step.borrow_mut().take();
        drop(step);
        if rejected && !self.0.handled.get() {
            REJECTED.with(|r| r.borrow_mut().push(self.0.clone()));
            schedule_drain();
        }
        for reaction in std::mem::take(&mut *self.0.reactions.borrow_mut()) {
            let p = self.clone();
            queue_microtask(move || reaction(&p));
        }
    }

    /// JavaScript's PerformPromiseThen without a derived promise: one of the two runs in a job once it settled.
    fn react(&self, on_fulfilled: impl FnOnce(T) + 'static, on_rejected: impl FnOnce(JsError) + 'static) {
        self.0.handled.set(true);
        let reaction: Box<dyn FnOnce(&Promise<T>)> = Box::new(move |p| {
            let state = match &*p.0.state.borrow() {
                State::Fulfilled(v) => Ok(v.clone()),
                State::Rejected(e) => Err(e.clone()),
                State::Pending => unreachable!(),
            };
            match state {
                Ok(v) => on_fulfilled(v),
                Err(e) => on_rejected(e),
            }
        });
        if matches!(&*self.0.state.borrow(), State::Pending) {
            self.0.reactions.borrow_mut().push(reaction);
        } else {
            let p = self.clone();
            queue_microtask(move || reaction(&p));
        }
    }

    pub fn then<U: Clone + 'static>(&self, f: impl FnOnce(T) -> Result<U, JsError> + 'static) -> Promise<U> {
        let d = Promise::new();
        let (a, b) = (d.clone(), d.clone());
        self.react(move |v| match f(v) { Ok(u) => a.resolve(u), Err(e) => a.reject(e) }, move |e| b.reject(e));
        d
    }

    pub fn then_p<U: Clone + 'static>(&self, f: impl FnOnce(T) -> Result<Promise<U>, JsError> + 'static) -> Promise<U> {
        let d = Promise::new();
        let (a, b) = (d.clone(), d.clone());
        self.react(move |v| match f(v) { Ok(u) => a.adopt(u), Err(e) => a.reject(e) }, move |e| b.reject(e));
        d
    }

    pub fn then2<U: Clone + 'static>(&self, f: impl FnOnce(T) -> Result<U, JsError> + 'static, r: impl FnOnce(JsError) -> Result<U, JsError> + 'static) -> Promise<U> {
        let d = Promise::new();
        let (a, b) = (d.clone(), d.clone());
        self.react(move |v| match f(v) { Ok(u) => a.resolve(u), Err(e) => a.reject(e) }, move |e| match r(e) { Ok(u) => b.resolve(u), Err(e) => b.reject(e) });
        d
    }

    pub fn then2_p<U: Clone + 'static>(&self, f: impl FnOnce(T) -> Result<Promise<U>, JsError> + 'static, r: impl FnOnce(JsError) -> Result<Promise<U>, JsError> + 'static) -> Promise<U> {
        let d = Promise::new();
        let (a, b) = (d.clone(), d.clone());
        self.react(move |v| match f(v) { Ok(u) => a.adopt(u), Err(e) => a.reject(e) }, move |e| match r(e) { Ok(u) => b.adopt(u), Err(e) => b.reject(e) });
        d
    }

    pub fn catch(&self, r: impl FnOnce(JsError) -> Result<T, JsError> + 'static) -> Promise<T> {
        self.then2(Ok, r)
    }

    pub fn catch_p(&self, r: impl FnOnce(JsError) -> Result<Promise<T>, JsError> + 'static) -> Promise<T> {
        self.then2_p(|v| Ok(Promise::resolved(v)), r)
    }

    /// `finally(f)` as the specification writes it: `f`'s result is waited for, then the value or the error goes on.
    pub fn finally(&self, f: impl Fn() -> Result<(), JsError> + 'static) -> Promise<T> {
        let f = Rc::new(f);
        let g = f.clone();
        self.then2_p(
            move |v| {
                f()?;
                Ok(Promise::resolved(()).then(move |_| Ok(v)))
            },
            move |e| {
                g()?;
                Ok(Promise::resolved(()).then(move |_| Err(e)))
            },
        )
    }

    pub fn finally_p<X: Clone + 'static>(&self, f: impl Fn() -> Result<Promise<X>, JsError> + 'static) -> Promise<T> {
        let f = Rc::new(f);
        let g = f.clone();
        self.then2_p(move |v| Ok(f()?.then(move |_| Ok(v))), move |e| Ok(g()?.then(move |_| Err(e))))
    }

    /// `new Promise<T>(executor)`: the executor runs at once; what it throws rejects the promise.
    pub fn create(executor: impl FnOnce(Rc<dyn Fn(T)>, Rc<dyn Fn(JsError)>) -> Result<(), JsError>) -> Promise<T> {
        let p = Promise::new();
        let (a, b) = (p.clone(), p.clone());
        if let Err(e) = executor(Rc::new(move |v| a.resolve(v)), Rc::new(move |e| b.reject(e))) {
            p.reject(e);
        }
        p
    }

    pub fn all(ps: Arr<Promise<T>>) -> Promise<Arr<T>> {
        let d = Promise::new();
        let ps = ps.to_vec();
        let values = Rc::new(RefCell::new(vec![None::<T>; ps.len()]));
        let remaining = Rc::new(Cell::new(ps.len()));
        if ps.is_empty() {
            d.resolve(Vec::new().into());
        }
        for (i, p) in ps.iter().enumerate() {
            let (d1, d2, values, remaining) = (d.clone(), d.clone(), values.clone(), remaining.clone());
            p.react(
                move |v| {
                    values.borrow_mut()[i] = Some(v);
                    remaining.set(remaining.get() - 1);
                    if remaining.get() == 0 {
                        d1.resolve(values.borrow_mut().drain(..).map(Option::unwrap).collect::<Vec<T>>().into());
                    }
                },
                move |e| d2.reject(e),
            );
        }
        d
    }

    pub fn all_settled(ps: Arr<Promise<T>>) -> Promise<Arr<JsSettled<T>>> {
        let d = Promise::new();
        let ps = ps.to_vec();
        let results = Rc::new(RefCell::new(vec![None::<JsSettled<T>>; ps.len()]));
        let remaining = Rc::new(Cell::new(ps.len()));
        if ps.is_empty() {
            d.resolve(Vec::new().into());
        }
        for (i, p) in ps.iter().enumerate() {
            let done = {
                let (d, results, remaining) = (d.clone(), results.clone(), remaining.clone());
                Rc::new(move |r: JsSettled<T>| {
                    results.borrow_mut()[i] = Some(r);
                    remaining.set(remaining.get() - 1);
                    if remaining.get() == 0 {
                        d.resolve(results.borrow_mut().drain(..).map(Option::unwrap).collect::<Vec<_>>().into());
                    }
                })
            };
            let other = done.clone();
            p.react(
                move |v| done(JsSettled { status: "fulfilled".into(), value: Some(v), reason: None }),
                move |e| other(JsSettled { status: "rejected".into(), value: None, reason: Some(e) }),
            );
        }
        d
    }

    pub fn race(ps: Arr<Promise<T>>) -> Promise<T> {
        let d = Promise::new();
        for p in ps.to_vec() {
            let (a, b) = (d.clone(), d.clone());
            p.react(move |v| a.resolve(v), move |e| b.reject(e));
        }
        d
    }

    pub fn any(ps: Arr<Promise<T>>) -> Promise<T> {
        let d = Promise::new();
        let ps = ps.to_vec();
        let remaining = Rc::new(Cell::new(ps.len()));
        if ps.is_empty() {
            d.reject(JsError::named("AggregateError", ""));
        }
        for p in ps {
            let (a, b, remaining) = (d.clone(), d.clone(), remaining.clone());
            p.react(
                move |v| a.resolve(v),
                move |_| {
                    remaining.set(remaining.get() - 1);
                    if remaining.get() == 0 {
                        b.reject(JsError::named("AggregateError", ""));
                    }
                },
            );
        }
        d
    }

    /// The promise of a native async call (fetch, the app's platform code): it starts at once.
    pub fn native(call: impl Future<Output = Result<T, JsError>> + 'static) -> Promise<T> {
        let p = Promise::new();
        let q = p.clone();
        spawn(async move {
            match call.await {
                Ok(v) => q.resolve(v),
                Err(e) => q.reject(e),
            }
        });
        p
    }

    fn resume(&self) {
        let step = self.0.step.borrow().clone();
        if let Some(step) = step {
            step(self.clone());
        }
    }

    /// `await q` in the async function this is the promise of: it resumes a job after `q` settles.
    pub fn await_on<U: Clone + 'static>(&self, q: &Promise<U>) {
        let (a, b) = (self.clone(), self.clone());
        q.react(move |_| a.resume(), move |e| {
            *b.0.await_error.borrow_mut() = Some(e);
            b.resume()
        });
    }

    /// The same, keeping the value (`store` writes the local the `await` reads).
    pub fn await_with<U: Clone + 'static>(&self, q: &Promise<U>, store: impl FnOnce(U) + 'static) {
        let (a, b) = (self.clone(), self.clone());
        q.react(move |v| {
            store(v);
            a.resume()
        }, move |e| {
            *b.0.await_error.borrow_mut() = Some(e);
            b.resume()
        });
    }

    /// Where the function resumes: the error the awaited promise rejected with, thrown there.
    pub fn check(&self) -> Result<(), JsError> {
        match self.0.await_error.borrow_mut().take() {
            Some(e) => Err(e),
            None => Ok(()),
        }
    }
}

impl Promise<()> {
    pub fn create_void(executor: impl FnOnce(Rc<dyn Fn()>, Rc<dyn Fn(JsError)>) -> Result<(), JsError>) -> Promise<()> {
        let p = Promise::new();
        let (a, b) = (p.clone(), p.clone());
        if let Err(e) = executor(Rc::new(move || a.resolve(())), Rc::new(move |e| b.reject(e))) {
            p.reject(e);
        }
        p
    }
}

/// An async function's promise: `step` runs its body up to its first `await` at once, as JavaScript does.
pub fn js_async<T: Clone + 'static>(step: impl Fn(Promise<T>) + 'static) -> Promise<T> {
    let p = Promise::new();
    let step: Rc<dyn Fn(Promise<T>)> = Rc::new(step);
    *p.0.step.borrow_mut() = Some(step.clone());
    step(p.clone());
    p
}

/// `delay(ms)`: a promise a timer resolves.
pub fn js_delay(ms: f64) -> Promise<()> {
    let p = Promise::new();
    let q = p.clone();
    set_timeout(Rc::new(move || q.resolve(())), ms);
    p
}

/// Runs a future on the executor, polled at once.
fn spawn(task: impl Future<Output = ()> + 'static) {
    let id = next_id();
    TASKS.with(|tasks| tasks.borrow_mut().insert(id, Box::pin(task)));
    poll(id);
}

/// Runs `work` on a new thread and `done` with its result on the UI thread.
pub(crate) fn off_thread<T: Send + 'static>(work: impl FnOnce() -> T + Send + 'static, done: impl FnOnce(T) + 'static) {
    let id = next_id();
    PENDING.with(|pending| pending.borrow_mut().insert(id, Box::new(move |result| done(*result.downcast::<T>().unwrap()))));
    std::thread::spawn(move || {
        let result = work();
        FINISHED.lock().unwrap().push((id, Box::new(result)));
        notify();
    });
}

/// A value that arrives later on the UI thread.
struct Later<T> {
    slot: Rc<RefCell<(Option<T>, Option<Waker>)>>,
}

impl<T> Later<T> {
    /// The future and the function that completes it.
    fn new() -> (Later<T>, impl FnOnce(T)) {
        let slot = Rc::new(RefCell::new((None, None::<Waker>)));
        let fill = slot.clone();
        (Later { slot }, move |value| {
            let waker = {
                let mut slot = fill.borrow_mut();
                slot.0 = Some(value);
                slot.1.take()
            };
            if let Some(waker) = waker {
                waker.wake();
            }
        })
    }
}

impl<T> Future for Later<T> {
    type Output = T;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<T> {
        let mut slot = self.slot.borrow_mut();
        match slot.0.take() {
            Some(value) => Poll::Ready(value),
            None => {
                slot.1 = Some(cx.waker().clone());
                Poll::Pending
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Timers
// ---------------------------------------------------------------------------

/// Resolves after `ms` milliseconds.
pub async fn delay(ms: f64) {
    let (later, done) = Later::new();
    let done = RefCell::new(Some(done));
    add_timer(ms.max(0.0) as u64, Rc::new(move || if let Some(done) = done.take() { done(()) }));
    later.await
}

// JavaScript's timer order on every backend: by due time, then by when each was set (GLib, for one, dispatches
// timeouts that are due together in its own order). The backend has one timer, for the earliest.
type TimerKey = (u64, u64);

thread_local! {
    static TIMERS: RefCell<std::collections::BTreeMap<TimerKey, Rc<dyn Fn()>>> = RefCell::default();
    static TIMER_SEQ: Cell<u64> = const { Cell::new(0) };
    /// The backend timer set for the earliest due time: (due, its id).
    static ARMED: Cell<Option<(u64, u64)>> = const { Cell::new(None) };
}

fn now_ms() -> u64 {
    super::js::js_now() as u64
}

fn add_timer(ms: u64, job: Rc<dyn Fn()>) -> TimerKey {
    let key = (now_ms() + ms, TIMER_SEQ.with(|s| s.replace(s.get() + 1)));
    TIMERS.with(|t| t.borrow_mut().insert(key, job));
    arm_timers();
    key
}

fn remove_timer(key: TimerKey) {
    TIMERS.with(|t| t.borrow_mut().remove(&key));
}

fn arm_timers() {
    let Some((due, _)) = TIMERS.with(|t| t.borrow().keys().next().copied()) else { return };
    if let Some((at, id)) = ARMED.with(Cell::get) {
        if at <= due {
            return;
        }
        backend().clear_timer(id);
    }
    let id = backend().set_timer(due.saturating_sub(now_ms()), Box::new(fire_timers));
    ARMED.with(|a| a.set(Some((due, id))));
}

/// Runs the timers that are due, each as a task of its own, in order.
fn fire_timers() {
    ARMED.with(|a| a.set(None));
    let now = now_ms();
    loop {
        let job = TIMERS.with(|t| {
            let mut t = t.borrow_mut();
            let key = *t.keys().next()?;
            if key.0 > now { None } else { t.remove(&key) }
        });
        match job {
            Some(job) => job(),
            None => break,
        }
    }
    arm_timers();
}

struct TimerState {
    key: Cell<TimerKey>,
    cancelled: Cell<bool>,
}

#[derive(Clone)]
pub struct Timer(Rc<TimerState>);

pub fn set_timeout(callback: Rc<dyn Fn()>, ms: f64) -> Timer {
    let timer = Timer(Rc::new(TimerState { key: Cell::new((0, 0)), cancelled: Cell::new(false) }));
    let state = timer.0.clone();
    let key = add_timer(ms.max(0.0) as u64, Rc::new(move || {
        if !state.cancelled.get() {
            // A timer is a task of its own: the microtasks before it run first, and those it queues after it.
            drain_microtasks();
            callback();
            drain_microtasks();
        }
    }));
    timer.0.key.set(key);
    timer
}

pub fn set_interval(callback: Rc<dyn Fn()>, ms: f64) -> Timer {
    fn arm(state: Rc<TimerState>, callback: Rc<dyn Fn()>, ms: u64) {
        let next = state.clone();
        let key = add_timer(ms, Rc::new(move || {
            if next.cancelled.get() {
                return;
            }
            drain_microtasks();
            callback();
            drain_microtasks();
            if !next.cancelled.get() {
                arm(next.clone(), callback.clone(), ms);
            }
        }));
        state.key.set(key);
    }
    let timer = Timer(Rc::new(TimerState { key: Cell::new((0, 0)), cancelled: Cell::new(false) }));
    arm(timer.0.clone(), callback, (ms as u64).max(1));
    timer
}

pub fn clear_timeout(timer: Timer) {
    timer.0.cancelled.set(true);
    remove_timer(timer.0.key.get());
}

pub fn clear_interval(timer: Timer) {
    clear_timeout(timer)
}

#[derive(Clone)]
pub struct Frame(u64);

/// Runs `callback` before the next frame is drawn; `time` is in milliseconds, as `Date.now()` counts them.
pub fn request_animation_frame(callback: Rc<dyn Fn(f64)>) -> Frame {
    Frame(backend().request_frame(Box::new(move || callback(super::js::js_now()))))
}

pub fn cancel_animation_frame(frame: Frame) {
    backend().cancel_frame(frame.0);
}

pub fn console_log(values: &[&str]) {
    backend().log(&values.join(" "), false);
}

// ---------------------------------------------------------------------------
// fetch
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct Response {
    pub status: i64,
    body: Rc<str>,
}

impl Response {
    pub fn ok(&self) -> bool {
        (200..300).contains(&self.status)
    }

    pub async fn text(&self) -> Result<String, JsError> {
        Ok(self.body.to_string())
    }

    /// Decodes the body with the decoder the compiler generated for `json<T>()`.
    pub async fn json<T>(&self, decode: impl FnOnce(&super::jsondate::JsJson) -> Result<T, JsError>) -> Result<T, JsError> {
        decode(&super::jsondate::js_json_parse(&self.body)?)
    }
}

/// fetch()'s options. `method` defaults to GET.
#[derive(Default)]
pub struct FetchInit {
    pub method: Option<String>,
    pub body: Option<String>,
    pub headers: Option<Map<String>>,
}

#[cfg(not(target_arch = "wasm32"))]
fn request(url: &str, method: &str, body: Option<String>, headers: &[(String, String)]) -> Result<ureq::http::Response<ureq::Body>, String> {
    // A 404 is a response, as with fetch(): only a failed exchange is an error.
    let agent = ureq::Agent::new_with_config(ureq::Agent::config_builder().http_status_as_error(false).build());
    let mut builder = ureq::http::Request::builder().method(method).uri(url);
    for (name, value) in headers {
        builder = builder.header(name, value);
    }
    let sent = match body {
        Some(body) => builder.body(body).map_err(|e| e.to_string()).and_then(|r| agent.run(r).map_err(|e| e.to_string())),
        None => builder.body(()).map_err(|e| e.to_string()).and_then(|r| agent.run(r).map_err(|e| e.to_string())),
    };
    sent
}

/// An HTTP exchange on its own thread; the caller resumes on the UI thread.
#[cfg(not(target_arch = "wasm32"))]
pub async fn fetch(url: &str, init: FetchInit) -> Result<Response, JsError> {
    let url = url.to_string();
    let method = init.method.unwrap_or_else(|| "GET".into());
    let headers = init.headers.map(|headers| headers.entries()).unwrap_or_default();
    let (later, done) = Later::new();
    off_thread(
        move || {
            let mut response = request(&url, &method, init.body, &headers)?;
            let text = response.body_mut().read_to_string().map_err(|e| e.to_string())?;
            Ok::<_, String>((response.status().as_u16() as i64, text))
        },
        done,
    );
    let (status, text) = later.await.map_err(JsError::new)?;
    Ok(Response { status, body: text.into() })
}

/// An HTTP exchange the web host makes with the browser's fetch.
#[cfg(target_arch = "wasm32")]
pub async fn fetch(url: &str, init: FetchInit) -> Result<Response, JsError> {
    let (later, done) = Later::new();
    let request = super::backend::HttpRequest {
        method: init.method.unwrap_or_else(|| "GET".into()),
        url: url.to_string(),
        headers: init.headers.map(|headers| headers.entries()).unwrap_or_default(),
        body: init.body,
    };
    backend().http(request, Box::new(done));
    let (status, bytes) = later.await.map_err(JsError::new)?;
    Ok(Response { status, body: String::from_utf8_lossy(&bytes).into_owned().into() })
}

/// Calls a function of the platform's own code (the web host's `declare function`s): arguments and result as JSON.
pub fn host_call_sync(name: &str, args: Vec<Json>) -> Result<Json, JsError> {
    let text = backend().call_sync(name, &Json::Array(args).to_string()).map_err(JsError::new)?;
    serde_json::from_str(&text).map_err(|e| JsError::new(format!("{name} returned something that is not JSON: {e}")))
}

/// The same for a function that returns a promise.
pub async fn host_call(name: &str, args: Vec<Json>) -> Result<Json, JsError> {
    let (later, done) = Later::new();
    backend().call(name, &Json::Array(args).to_string(), Box::new(done));
    let text = later.await.map_err(JsError::new)?;
    serde_json::from_str(&text).map_err(|e| JsError::new(format!("{name} returned something that is not JSON: {e}")))
}

/// An image's bytes, for `img({ src })`, on the UI thread (`None`: it did not download). The web host
/// never gets here: its images load through `Backend::set_image_url`.
pub(crate) fn download_async(url: String, done: impl FnOnce(Option<Vec<u8>>) + 'static) {
    #[cfg(not(target_arch = "wasm32"))]
    off_thread(move || download(&url), done);
    #[cfg(target_arch = "wasm32")]
    {
        let _ = url;
        done(None);
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn download(url: &str) -> Option<Vec<u8>> {
    // A file the app wrote (a photo it took), as the other platforms' images read it.
    if let Some(path) = url.strip_prefix("file://") {
        return std::fs::read(path).ok();
    }
    let mut response = request(url, "GET", None, &[]).ok()?;
    if !response.status().is_success() {
        return None;
    }
    response.body_mut().read_to_vec().ok()
}

// ---------------------------------------------------------------------------
// JSON
// ---------------------------------------------------------------------------

pub type Json = serde_json::Value;

/// What the generated decoders call, one per type: a wrong shape is an error, never a default. They read any
/// `JsonValue`: `JsJson` (JSON.parse, `res.json()`: JavaScript's grammar and key order) or serde's (host calls).
pub mod json {
    use super::{Arr, JsError, Json, Map};

    /// A parsed JSON value the decoders read.
    pub trait JsonValue: Sized + 'static {
        /// A field of an object (null when it is missing); None when this is not an object.
        fn field(&self, key: &str) -> Option<&Self>;
        fn as_str(&self) -> Option<&str>;
        fn as_f64(&self) -> Option<f64>;
        fn as_bool(&self) -> Option<bool>;
        fn items(&self) -> Option<&[Self]>;
        fn entries(&self) -> Option<Vec<(&str, &Self)>>;
        fn is_null(&self) -> bool;
    }

    static NULL: Json = Json::Null;

    impl JsonValue for Json {
        fn field(&self, key: &str) -> Option<&Self> {
            self.as_object().map(|object| object.get(key).unwrap_or(&NULL))
        }
        fn as_str(&self) -> Option<&str> {
            Json::as_str(self)
        }
        fn as_f64(&self) -> Option<f64> {
            Json::as_f64(self)
        }
        fn as_bool(&self) -> Option<bool> {
            Json::as_bool(self)
        }
        fn items(&self) -> Option<&[Self]> {
            self.as_array().map(|a| a.as_slice())
        }
        fn entries(&self) -> Option<Vec<(&str, &Self)>> {
            self.as_object().map(|o| o.iter().map(|(k, v)| (k.as_str(), v)).collect())
        }
        fn is_null(&self) -> bool {
            Json::is_null(self)
        }
    }

    fn expected<T>(what: &str) -> Result<T, JsError> {
        Err(JsError::new(format!("Expected a JSON {what}")))
    }

    /// A field of an object: null when it is missing.
    pub fn field<'a, J: JsonValue>(value: &'a J, key: &str) -> Result<&'a J, JsError> {
        value.field(key).map_or_else(|| expected("object"), Ok)
    }
    pub fn string<J: JsonValue>(value: &J) -> Result<String, JsError> {
        value.as_str().map(str::to_string).map_or_else(|| expected("string"), Ok)
    }
    pub fn double<J: JsonValue>(value: &J) -> Result<f64, JsError> {
        value.as_f64().map_or_else(|| expected("number"), Ok)
    }
    pub fn int<J: JsonValue>(value: &J) -> Result<i64, JsError> {
        double(value).map(|number| number as i64)
    }
    pub fn bool<J: JsonValue>(value: &J) -> Result<bool, JsError> {
        value.as_bool().map_or_else(|| expected("boolean"), Ok)
    }
    pub fn array<T: Clone, J: JsonValue>(value: &J, element: impl Fn(&J) -> Result<T, JsError>) -> Result<Arr<T>, JsError> {
        match value.items() {
            Some(items) => Ok(items.iter().map(element).collect::<Result<Vec<T>, JsError>>()?.into()),
            None => expected("array"),
        }
    }
    pub fn map<T: Clone, J: JsonValue>(value: &J, element: impl Fn(&J) -> Result<T, JsError>) -> Result<Map<T>, JsError> {
        match value.entries() {
            Some(entries) => {
                let map = Map::from_pairs(Vec::new());
                for (key, value) in entries {
                    map.insert(key, element(value)?);
                }
                Ok(map)
            }
            None => expected("object"),
        }
    }
    pub fn optional<T, J: JsonValue>(value: &J, element: impl Fn(&J) -> Result<T, JsError>) -> Result<Option<T>, JsError> {
        if value.is_null() { Ok(None) } else { element(value).map(Some) }
    }
}
