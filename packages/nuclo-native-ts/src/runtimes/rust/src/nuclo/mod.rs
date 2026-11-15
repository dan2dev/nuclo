//! The backend-independent runtime for apps compiled by nuclo-native-ts.
//!
//! The model is nuclo's: builders create views once; `update()` re-runs the dynamic values
//! (each dirty-checked against its last value before a view is touched) and reconciles list(),
//! when() and region() in place. There is no virtual DOM and no JavaScript.
//!
//!   js       JavaScript's values: shared variables, arrays, maps, number formatting
//!   style    Style, css(), cx(), variants()
//!   node     the node tree, bindings, update(), list/when/region/into
//!   flex     the flex layout, identical to the Android and iOS runtimes'
//!   router   navigation stacks and tabs
//!   task     async functions, timers, fetch, JSON
//!   backend  the interface a UI toolkit implements (start there to add one)

#![allow(dead_code)] // An app uses the part of the runtime it needs.

pub mod backend;
mod flex;
mod js;
mod node;
mod router;
mod style;
mod task;

use std::rc::Rc;

/// Installs the backend. Call it on the UI thread before the app's entry point.
pub fn start(backend: Rc<dyn backend::Backend>) {
    backend::install(backend);
    task::start();
}

/// Everything the generated code names.
#[allow(unused_imports)]
pub mod prelude {
    pub use super::js::*;
    pub use super::backend::NativeView;
    pub use super::node::{
        article, aside, button, checkbox, div, el, em, footer, force_update, form, h1, h2, h3, h4, header, img, input, into, label, li, list, main, native_view, nav, p, region, render, scope,
        section, select_event, small, span, strong, textarea, ul, update, when, InputTarget, KeyboardEvent, Mod, NativeComponent, NativeElement, NativeEvent, Node, PanEvent, Params, PinchEvent, PointerEvent,
        ScrollEvent, WhenBuilder, A,
    };
    pub use super::router::{render_outlet, Outlet, Route, Router, Tab};
    pub use super::style::*;
    pub use super::task::{
        cancel_animation_frame, clear_interval, clear_timeout, console_log, delay, fetch, host_call, host_call_sync, js_error_message, json, launch, request_animation_frame, set_interval, set_timeout, FetchInit, Frame,
        JsError, Json, Response, Timer,
    };
    pub use std::rc::Rc;
}
