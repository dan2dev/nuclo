//! Async for the generated code: a single-threaded executor for `async` functions, timers,
//! fetch (on a thread, resumed on the UI thread), JSON decoding and console.log.

use std::any::Any;
use std::cell::{Cell, RefCell};
use std::collections::HashMap;
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
#[derive(Clone, Debug)]
pub struct JsError {
    pub message: String,
}

impl JsError {
    pub fn new(message: impl Into<String>) -> JsError {
        JsError { message: message.into() }
    }
}

/// `String(e)`, as the other runtimes print it.
pub fn js_error_message(error: &JsError) -> String {
    format!("Error: {}", error.message)
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
            backend().log(&format!("nuclo: uncaught error in an async function: {}", error.message), true);
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
    backend().set_timer(ms.max(0.0) as u64, Box::new(move || done(())));
    later.await
}

struct TimerState {
    id: Cell<u64>,
    cancelled: Cell<bool>,
}

#[derive(Clone)]
pub struct Timer(Rc<TimerState>);

pub fn set_timeout(callback: Rc<dyn Fn()>, ms: f64) -> Timer {
    let timer = Timer(Rc::new(TimerState { id: Cell::new(0), cancelled: Cell::new(false) }));
    let state = timer.0.clone();
    let id = backend().set_timer(ms.max(0.0) as u64, Box::new(move || {
        if !state.cancelled.get() {
            callback();
        }
    }));
    timer.0.id.set(id);
    timer
}

pub fn set_interval(callback: Rc<dyn Fn()>, ms: f64) -> Timer {
    fn arm(state: Rc<TimerState>, callback: Rc<dyn Fn()>, ms: u64) {
        let next = state.clone();
        let id = backend().set_timer(ms, Box::new(move || {
            if next.cancelled.get() {
                return;
            }
            callback();
            if !next.cancelled.get() {
                arm(next, callback, ms);
            }
        }));
        state.id.set(id);
    }
    let timer = Timer(Rc::new(TimerState { id: Cell::new(0), cancelled: Cell::new(false) }));
    arm(timer.0.clone(), callback, (ms as u64).max(1));
    timer
}

pub fn clear_timeout(timer: Timer) {
    timer.0.cancelled.set(true);
    backend().clear_timer(timer.0.id.get());
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
    pub async fn json<T>(&self, decode: impl FnOnce(&Json) -> Result<T, JsError>) -> Result<T, JsError> {
        let json: Json = serde_json::from_str(&self.body).map_err(|e| JsError::new(format!("Invalid JSON: {e}")))?;
        decode(&json)
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

/// What the generated decoders call, one per type: a wrong shape is an error, never a default.
pub mod json {
    use super::{Arr, JsError, Json, Map};

    static NULL: Json = Json::Null;

    fn expected<T>(what: &str) -> Result<T, JsError> {
        Err(JsError::new(format!("Expected a JSON {what}")))
    }

    /// A field of an object: null when it is missing.
    pub fn field<'a>(value: &'a Json, key: &str) -> Result<&'a Json, JsError> {
        match value {
            Json::Object(object) => Ok(object.get(key).unwrap_or(&NULL)),
            _ => expected("object"),
        }
    }
    pub fn string(value: &Json) -> Result<String, JsError> {
        value.as_str().map(str::to_string).map_or_else(|| expected("string"), Ok)
    }
    pub fn double(value: &Json) -> Result<f64, JsError> {
        value.as_f64().map_or_else(|| expected("number"), Ok)
    }
    pub fn int(value: &Json) -> Result<i64, JsError> {
        double(value).map(|number| number as i64)
    }
    pub fn bool(value: &Json) -> Result<bool, JsError> {
        value.as_bool().map_or_else(|| expected("boolean"), Ok)
    }
    pub fn array<T: Clone>(value: &Json, element: impl Fn(&Json) -> Result<T, JsError>) -> Result<Arr<T>, JsError> {
        match value {
            Json::Array(items) => Ok(items.iter().map(element).collect::<Result<Vec<T>, JsError>>()?.into()),
            _ => expected("array"),
        }
    }
    pub fn map<T: Clone>(value: &Json, element: impl Fn(&Json) -> Result<T, JsError>) -> Result<Map<T>, JsError> {
        match value {
            Json::Object(object) => {
                let map = Map::from_pairs(Vec::new());
                for (key, value) in object {
                    map.insert(key, element(value)?);
                }
                Ok(map)
            }
            _ => expected("object"),
        }
    }
    pub fn optional<T>(value: &Json, element: impl Fn(&Json) -> Result<T, JsError>) -> Result<Option<T>, JsError> {
        if value.is_null() { Ok(None) } else { element(value).map(Some) }
    }
}
