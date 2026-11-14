//! The host's copy of the live tree, built from the ops in src/dom.ts.
use std::collections::{HashMap, HashSet};

use gpui::{Rgba, rgb};
use serde_json::Value;

use crate::measure::{TextStyle, apply_style};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Kind {
    View,
    Text,
    Button,
    Input,
    Checkbox,
    Image,
    Screen,
    Stack,
    Tabs,
}

impl Kind {
    fn parse(kind: &str) -> Self {
        match kind {
            "text" => Kind::Text,
            "button" => Kind::Button,
            "input" => Kind::Input,
            "checkbox" => Kind::Checkbox,
            "image" => Kind::Image,
            "screen" => Kind::Screen,
            "stack" => Kind::Stack,
            "tabs" => Kind::Tabs,
            _ => Kind::View,
        }
    }
}

/// Paint and text styles. Layout styles are JS's (src/layout.ts): they arrive as frames.
#[derive(Clone, Debug)]
pub struct Style {
    /// Insets a text from its box.
    pub padding: f32,
    pub color: Option<Rgba>,
    pub background: Option<Rgba>,
    pub radius: f32,
    pub text: TextStyle,
    /// left, center or right.
    pub text_align: String,
    pub opacity: f32,
}

impl Default for Style {
    fn default() -> Self {
        Self {
            padding: 0.,
            color: None,
            background: None,
            radius: 0.,
            text: TextStyle::default(),
            text_align: "left".into(),
            opacity: 1.,
        }
    }
}

#[derive(Debug)]
pub struct Node {
    pub kind: Kind,
    pub parent: u32,
    pub children: Vec<u32>,
    pub text: String,
    pub value: String,
    pub checked: bool,
    pub placeholder: String,
    pub password: bool,
    pub disabled: bool,
    pub src: String,
    pub title: String,
    pub icon: String,
    pub selected: usize,
    pub style: Style,
    pub click: bool,
    /// The box JS laid out, relative to the parent's: [x, y, w, h].
    pub frame: Option<[f32; 4]>,
}

impl Node {
    fn new(kind: Kind) -> Self {
        Self {
            kind,
            parent: 0,
            children: Vec::new(),
            text: String::new(),
            value: String::new(),
            checked: false,
            placeholder: String::new(),
            password: false,
            disabled: false,
            src: String::new(),
            title: String::new(),
            icon: String::new(),
            selected: 0,
            style: Style::default(),
            click: false,
            frame: None,
        }
    }
}

/// What an op batch changed, for the host to act on.
#[derive(Default)]
pub struct Changes {
    pub created_inputs: Vec<u32>,
    pub values: Vec<u32>,
    pub stacks: HashSet<u32>,
    pub frames: bool,
}

pub struct Tree {
    pub nodes: HashMap<u32, Node>,
    /// The router's tabs or stack, once inserted into the body.
    pub root_nav: Option<u32>,
    /// The body's background: every screen's background.
    pub page: Option<Rgba>,
    /// Screens removed by JS, kept until their pop transition is over.
    pub retired: HashSet<u32>,
}

impl Tree {
    pub fn new() -> Self {
        let mut nodes = HashMap::new();
        nodes.insert(1, Node::new(Kind::View));
        Self { nodes, root_nav: None, page: None, retired: HashSet::new() }
    }

    pub fn get(&self, id: u32) -> Option<&Node> {
        self.nodes.get(&id)
    }

    pub fn apply(&mut self, json: &str, changes: &mut Changes) {
        let Ok(Value::Array(ops)) = serde_json::from_str::<Value>(json) else { return };
        for op in ops {
            let Some(op) = op.as_array() else { continue };
            let id = op.get(1).and_then(Value::as_u64).unwrap_or(0) as u32;
            let arg = |i: usize| op.get(i).cloned().unwrap_or(Value::Null);
            match op.first().and_then(Value::as_str).unwrap_or("") {
                "create" => {
                    let kind = Kind::parse(arg(2).as_str().unwrap_or(""));
                    self.nodes.insert(id, Node::new(kind));
                    if kind == Kind::Input {
                        changes.created_inputs.push(id);
                    }
                }
                "insert" => self.insert(id, arg(2).as_u64().unwrap_or(0) as u32, arg(3).as_u64().unwrap_or(0) as u32, changes),
                "remove" => self.remove(id, changes),
                "set" => self.set(id, arg(2).as_str().unwrap_or(""), arg(3), changes),
                "style" => self.style(id, arg(2).as_str().unwrap_or(""), arg(3).as_str().unwrap_or("")),
                "frame" => {
                    let n = |i: usize| op.get(i).and_then(Value::as_f64).unwrap_or(0.) as f32;
                    if let Some(node) = self.nodes.get_mut(&id) {
                        node.frame = Some([n(2), n(3), n(4), n(5)]);
                        changes.frames = true;
                    }
                }
                "listen" => {
                    if arg(2).as_str() == Some("click")
                        && let Some(node) = self.nodes.get_mut(&id)
                    {
                        node.click = true;
                    }
                }
                _ => {}
            }
        }
    }

    fn insert(&mut self, parent: u32, child: u32, before: u32, changes: &mut Changes) {
        self.detach(child, changes);
        if parent == 1 && matches!(self.nodes.get(&child).map(|n| n.kind), Some(Kind::Stack | Kind::Tabs)) {
            self.root_nav = Some(child);
        }
        let Some(node) = self.nodes.get_mut(&parent) else { return };
        let at = node.children.iter().position(|&c| c == before).unwrap_or(node.children.len());
        node.children.insert(at, child);
        if node.kind == Kind::Stack {
            changes.stacks.insert(parent);
        }
        if let Some(node) = self.nodes.get_mut(&child) {
            node.parent = parent;
        }
    }

    /// Takes a node out of its parent's children.
    pub fn detach(&mut self, id: u32, changes: &mut Changes) {
        let Some(parent) = self.nodes.get(&id).map(|n| n.parent) else { return };
        if let Some(node) = self.nodes.get_mut(&parent) {
            node.children.retain(|&c| c != id);
            if node.kind == Kind::Stack {
                changes.stacks.insert(parent);
            }
        }
        if let Some(node) = self.nodes.get_mut(&id) {
            node.parent = 0;
        }
    }

    fn remove(&mut self, id: u32, changes: &mut Changes) {
        self.detach(id, changes);
        if self.root_nav == Some(id) {
            self.root_nav = None;
        }
        // A screen may still be on screen, sliding out.
        if self.nodes.get(&id).map(|n| n.kind) == Some(Kind::Screen) {
            self.retired.insert(id);
        } else {
            self.delete(id);
        }
    }

    /// Drops a subtree.
    pub fn delete(&mut self, id: u32) {
        if let Some(node) = self.nodes.remove(&id) {
            for child in node.children {
                self.delete(child);
            }
        }
    }

    fn set(&mut self, id: u32, key: &str, value: Value, changes: &mut Changes) {
        let Some(node) = self.nodes.get_mut(&id) else { return };
        let text = match &value {
            Value::String(s) => s.clone(),
            Value::Null => String::new(),
            other => other.to_string(),
        };
        match key {
            "text" => node.text = text,
            "value" => {
                node.value = text;
                changes.values.push(id);
            }
            "checked" => node.checked = value.as_bool().unwrap_or(false),
            "placeholder" => {
                node.placeholder = text;
                changes.values.push(id);
            }
            "type" => {
                node.password = text == "password";
                changes.values.push(id);
            }
            "disabled" => node.disabled = value.as_bool().unwrap_or(false),
            "src" => node.src = text,
            "title" => node.title = text,
            "icon" => node.icon = text,
            "selected" => node.selected = text.parse().unwrap_or(0),
            _ => {}
        }
    }

    fn style(&mut self, id: u32, key: &str, value: &str) {
        if id == 1 && key == "backgroundColor" {
            self.page = color(value);
        }
        let Some(node) = self.nodes.get_mut(&id) else { return };
        let s = &mut node.style;
        match key {
            "padding" => s.padding = number(value),
            "color" => s.color = color(value),
            "backgroundColor" => s.background = color(value),
            "borderRadius" => s.radius = number(value),
            "textAlign" => s.text_align = value.to_string(),
            "opacity" => s.opacity = number(value),
            _ => apply_style(&mut s.text, key, value),
        }
    }

    /// Screens shown in, or animating out of, any stack.
    pub fn sweep(&mut self, keep: &HashSet<u32>) {
        let gone: Vec<u32> = self.retired.iter().copied().filter(|id| !keep.contains(id)).collect();
        for id in gone {
            self.retired.remove(&id);
            self.delete(id);
        }
    }
}

fn number(value: &str) -> f32 {
    value.trim().trim_end_matches("px").parse().unwrap_or(0.)
}

pub fn color(value: &str) -> Option<Rgba> {
    let hex = value.trim().strip_prefix('#')?;
    let full = match hex.len() {
        3 => hex.chars().flat_map(|c| [c, c]).collect(),
        6 => hex.to_string(),
        _ => return None,
    };
    u32::from_str_radix(&full, 16).ok().map(rgb)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stack_ops_track_screens_and_retire_removed_ones() {
        let mut tree = Tree::new();
        let mut changes = Changes::default();
        tree.apply(
            r##"[["create",2,"stack"],["create",3,"screen"],["set",3,"title","Home"],["insert",2,3,0],
                ["create",4,"screen"],["insert",2,4,0],["insert",1,2,0],["style",1,"backgroundColor","#f3f4f8"]]"##,
            &mut changes,
        );
        assert_eq!(tree.root_nav, Some(2));
        assert_eq!(tree.get(2).unwrap().children, vec![3, 4]);
        assert_eq!(tree.get(3).unwrap().title, "Home");
        assert!(changes.stacks.contains(&2));
        assert_eq!(tree.page, Some(rgb(0xf3f4f8)));

        tree.apply(r#"[["remove",4]]"#, &mut changes);
        assert_eq!(tree.get(2).unwrap().children, vec![3]);
        assert!(tree.retired.contains(&4) && tree.get(4).is_some());
        tree.sweep(&HashSet::new());
        assert!(tree.get(4).is_none());
    }
}
