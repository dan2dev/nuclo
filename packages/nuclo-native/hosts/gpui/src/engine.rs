//! The JS side: QuickJS running the nuclo bundle.
//!
//! `__nuclo_host(json)` only queues the batch. The host applies queued batches
//! after the JS call returns, so JS never re-enters the host mid-render.
use std::cell::RefCell;
use std::rc::Rc;

use rquickjs::{Context, Ctx, Function, Runtime};

/// An event value sent with `__nuclo_event`.
pub enum Value {
    None,
    Text(String),
    Bool(bool),
    Number(f64),
}

pub struct Engine {
    runtime: Runtime,
    context: Context,
    queue: Rc<RefCell<Vec<String>>>,
}

impl Engine {
    pub fn new() -> Self {
        let runtime = Runtime::new().expect("QuickJS runtime");
        let context = Context::full(&runtime).expect("QuickJS context");
        let queue = Rc::new(RefCell::new(Vec::new()));
        context.with(|ctx| {
            let globals = ctx.globals();
            let batches = queue.clone();
            let host = Function::new(ctx.clone(), move |json: String| batches.borrow_mut().push(json)).unwrap();
            globals.set("__nuclo_host", host).unwrap();
            let log = Function::new(ctx.clone(), |line: String| log::info!("JS: {line}")).unwrap();
            globals.set("__nuclo_log", log).unwrap();
            ctx.eval::<(), _>("globalThis.console = { log: (...a) => __nuclo_log(a.join(' ')) }; console.error = console.warn = console.info = console.log;")
                .unwrap();
        });
        Self { runtime, context, queue }
    }

    /// Runs the bundle; returns the batches it sent.
    pub fn eval(&self, source: String) -> Vec<String> {
        self.context.with(|ctx| {
            let result = ctx.eval::<(), _>(source);
            report(&ctx, result);
        });
        self.drain()
    }

    /// `__nuclo_event(id, type, value?)`; returns the batches JS sent back.
    pub fn emit(&self, id: u32, kind: &str, value: Value) -> Vec<String> {
        self.context.with(|ctx| {
            let event: Function = ctx.globals().get("__nuclo_event").unwrap();
            let result = match value {
                Value::None => event.call::<_, ()>((id, kind)),
                Value::Text(text) => event.call((id, kind, text)),
                Value::Bool(on) => event.call((id, kind, on)),
                Value::Number(n) => event.call((id, kind, n)),
            };
            report(&ctx, result);
        });
        self.drain()
    }

    fn drain(&self) -> Vec<String> {
        while self.runtime.execute_pending_job().unwrap_or(false) {}
        self.queue.borrow_mut().drain(..).collect()
    }
}

fn report(ctx: &Ctx, result: rquickjs::Result<()>) {
    if let Err(error) = result {
        let caught = ctx.catch();
        let detail = caught
            .as_exception()
            .map(|e| format!("{} {}", e.message().unwrap_or_default(), e.stack().unwrap_or_default()))
            .unwrap_or_else(|| format!("{error}"));
        log::error!("JS error: {detail}");
        eprintln!("JS error: {detail}");
    }
}
