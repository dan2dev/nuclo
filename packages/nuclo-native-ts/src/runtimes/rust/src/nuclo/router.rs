//! The router's state: a navigation stack per tab, route patterns, params and titles. The
//! backend mirrors it in the platform's own navigation (`Backend::nav_*`) and reports what the
//! user does there (`host::nav_popped`, `host::nav_tab_selected`).

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use super::backend::{backend, Screen, TabInfo, ViewId};
use super::js::Map;
use super::node::{self, p, Node, Params, A};

pub struct Route {
    parts: Vec<String>,
    view: Rc<dyn Fn(Params) -> Node>,
    title: Option<Rc<dyn Fn(Params) -> String>>,
    modal: bool,
    header: bool,
    on_end_reached: Option<Rc<dyn Fn(Params)>>,
}

impl Route {
    /// `presentation` is "push" or "modal"; `header: false` hides the navigation bar on the screen;
    /// `on_end_reached` runs when the screen is scrolled near its end (or is too short to scroll).
    pub fn new(
        pattern: &str,
        view: Rc<dyn Fn(Params) -> Node>,
        title: Option<Rc<dyn Fn(Params) -> String>>,
        presentation: &str,
        header: bool,
        on_end_reached: Option<Rc<dyn Fn(Params)>>,
    ) -> Route {
        Route { parts: pattern.split('/').map(str::to_string).collect(), view, title, modal: presentation == "modal", header, on_end_reached }
    }

    /// The params when `path` matches the pattern (`/posts/:id`).
    fn matches(&self, path: &str) -> Option<Params> {
        let segments: Vec<&str> = path.split('/').collect();
        if segments.len() != self.parts.len() {
            return None;
        }
        let mut params = Vec::new();
        for (part, segment) in self.parts.iter().zip(segments) {
            match part.strip_prefix(':') {
                Some(name) => params.push((name, segment.to_string())),
                None if part != segment => return None,
                None => {}
            }
        }
        Some(Map::from_pairs(params))
    }
}

pub struct Tab {
    path: String,
    title: String,
    icon: String,
}

impl Tab {
    pub fn new(path: &str, title: &str, icon: &str) -> Tab {
        Tab { path: path.into(), title: title.into(), icon: icon.into() }
    }
}

struct Entry {
    path: String,
    node: Node,
    title: String,
    modal: bool,
    header: bool,
}

impl Entry {
    fn view(&self) -> ViewId {
        self.node.view.expect("a route's view must be a tag builder's node")
    }

    fn screen(&self) -> Screen<'_> {
        Screen { root: self.view(), title: &self.title, modal: self.modal, header: self.header }
    }
}

struct State {
    routes: Vec<Route>,
    tabs: Vec<Tab>,
    initial: String,
    stacks: RefCell<Vec<Vec<Entry>>>,
    active: Cell<usize>,
}

/// Navigation stacks per tab. The router owns the stacks; the backend shows them.
#[derive(Clone)]
pub struct Router(Rc<State>);

/// What render() takes: the router itself.
pub type Outlet = Router;

thread_local!(static SHOWN: RefCell<Option<Router>> = const { RefCell::new(None) });

/// How long the backend's pop transition may take: the popped screen is destroyed after it.
const POP_MS: u64 = 400;

impl Router {
    pub fn new(routes: Vec<Route>, tabs: Vec<Tab>, initial: Option<&str>) -> Router {
        Router(Rc::new(State { routes, tabs, initial: initial.unwrap_or("/").to_string(), stacks: RefCell::default(), active: Cell::new(0) }))
    }

    pub fn outlet(&self) -> Outlet {
        self.clone()
    }

    pub fn path(&self) -> String {
        let stacks = self.0.stacks.borrow();
        stacks.get(self.0.active.get()).and_then(|stack| stack.last()).map_or_else(|| self.0.initial.clone(), |top| top.path.clone())
    }

    pub fn can_go_back(&self) -> bool {
        self.0.stacks.borrow().get(self.0.active.get()).is_some_and(|stack| stack.len() > 1)
    }

    /// Pushes a screen onto the current tab's stack.
    pub fn go(&self, path: &str) {
        let tab = self.0.active.get();
        self.attach_top(false);
        self.push(tab, path, true);
        self.attach_top(true);
        node::update(&[]);
    }

    pub fn back(&self) {
        let tab = self.0.active.get();
        if self.can_go_back() {
            // The stack first: the backend reports the pop back, and must find it done.
            self.drop_top(tab);
            backend().nav_pop(tab, true);
        }
    }

    /// Selects the tab that owns `path` and makes it the only screen there.
    pub fn reset(&self, path: &str) {
        self.attach_top(false);
        if let Some(tab) = self.tab_of(path) {
            self.0.active.set(tab);
            backend().nav_select_tab(tab);
        }
        self.replace_stack(path);
    }

    /// Replaces the current screen, without a transition.
    pub fn replace(&self, path: &str) {
        let tab = self.0.active.get();
        self.attach_top(false);
        if !self.can_go_back() {
            return self.replace_stack(path);
        }
        let gone = self.0.stacks.borrow_mut()[tab].pop().unwrap();
        backend().nav_pop(tab, false);
        node::remove_root(&gone.node);
        self.push(tab, path, false);
        self.attach_top(true);
        node::update(&[]);
    }

    fn replace_stack(&self, path: &str) {
        let tab = self.0.active.get();
        let mut old = std::mem::take(&mut self.0.stacks.borrow_mut()[tab]);
        let keep = if old[0].path == path { old.remove(0) } else { self.entry(path) };
        backend().nav_replace(tab, &keep.screen());
        self.0.stacks.borrow_mut()[tab].push(keep);
        for entry in old {
            node::remove_root(&entry.node);
        }
        self.attach_top(true);
        node::update(&[]);
    }

    fn push(&self, tab: usize, path: &str, animated: bool) {
        let entry = self.entry(path);
        backend().nav_push(tab, &entry.screen(), animated);
        self.0.stacks.borrow_mut()[tab].push(entry);
    }

    /// The top screen of `tab` left its stack: the one under it shows, and it is destroyed once it has slid out.
    fn drop_top(&self, tab: usize) {
        let gone = self.0.stacks.borrow_mut()[tab].pop().unwrap();
        node::set_attached(&gone.node, false);
        backend().set_timer(POP_MS, Box::new(move || node::remove_root(&gone.node)));
        self.attach_top(true);
        node::update(&[]);
    }

    /// Only the top screen of the active tab is on screen (its onMount may run).
    fn attach_top(&self, attached: bool) {
        let top = self.0.stacks.borrow()[self.0.active.get()].last().map(|entry| entry.node.clone());
        if let Some(node) = top {
            node::set_attached(&node, attached);
        }
    }

    fn entry(&self, path: &str) -> Entry {
        let found = self.0.routes.iter().find_map(|route| route.matches(path).map(|params| (route, params)));
        let (node, title, modal, header) = match &found {
            Some((route, params)) => ((route.view)(params.clone()), route.title.as_ref().map_or_else(String::new, |title| title(params.clone())), route.modal, route.header),
            None => (p(vec![A::text(&format!("No route matches {path}"))]), "Not found".to_string(), false, true),
        };
        node::add_root(&node, false, false);
        if let Some((Route { on_end_reached: Some(end), .. }, params)) = found {
            let (end, params) = (end.clone(), params);
            node::on_end_reached(&node, Rc::new(move || end(params.clone())));
        }
        Entry { path: path.to_string(), node, title, modal, header }
    }

    /// The tab whose path owns `path`: the longest prefix wins.
    fn tab_of(&self, path: &str) -> Option<usize> {
        let tabs = &self.0.tabs;
        let mut best: Option<usize> = None;
        for (i, tab) in tabs.iter().enumerate() {
            let owns = tab.path == "/" || path == tab.path || path.starts_with(&format!("{}/", tab.path));
            if owns && best.is_none_or(|b| tab.path.len() > tabs[b].path.len()) {
                best = Some(i);
            }
        }
        best
    }
}

/// render(router.outlet): builds each tab's root screen and shows the navigation.
pub fn render_outlet(router: Outlet) {
    let state = &router.0;
    node::claim_main();
    let roots: Vec<String> = if state.tabs.is_empty() { vec![state.initial.clone()] } else { state.tabs.iter().map(|tab| tab.path.clone()).collect() };
    let active = router.tab_of(&state.initial).unwrap_or(0);
    state.active.set(active);
    let tabs: Vec<TabInfo> = state.tabs.iter().map(|tab| TabInfo { title: tab.title.clone(), icon: tab.icon.clone() }).collect();
    backend().nav_create(&tabs, active);
    *state.stacks.borrow_mut() = roots.iter().map(|_| Vec::new()).collect();
    for (tab, root) in roots.iter().enumerate() {
        router.push(tab, root, false);
        if tab == active && *root != state.initial {
            router.push(tab, &state.initial, false);
        }
    }
    router.attach_top(true);
    SHOWN.with(|shown| *shown.borrow_mut() = Some(router.clone()));
    node::settle();
}

fn shown() -> Option<Router> {
    SHOWN.with(|shown| shown.borrow().clone())
}

/// The user popped `root` with the platform's controls. Ignored when the router popped it itself.
pub(crate) fn popped(tab: usize, root: ViewId) {
    let Some(router) = shown() else { return };
    let is_top = router.0.stacks.borrow().get(tab).is_some_and(|stack| stack.len() > 1 && stack.last().unwrap().view() == root);
    if is_top {
        router.drop_top(tab);
    }
}

pub(crate) fn tab_selected(tab: usize) {
    let Some(router) = shown() else { return };
    if tab != router.0.active.get() && tab < router.0.stacks.borrow().len() {
        router.attach_top(false);
        router.0.active.set(tab);
        router.attach_top(true);
        node::update(&[]);
    }
}
