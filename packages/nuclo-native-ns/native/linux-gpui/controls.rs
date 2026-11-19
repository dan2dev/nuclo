// nuclo-native-ns: GPUI draws every view; it has no controls of its own, so kit.ns draws these.
use crate::nuclo::prelude as nu;
use std::rc::Rc;

pub const HAS: bool = false;

pub fn segmented(_options: Vec<String>, _at: Rc<dyn Fn() -> i32>, _pick: Rc<dyn Fn(i32)>) -> nu::Node {
  nu::div(vec![])
}

pub fn chip(_label: String, _on: Rc<dyn Fn() -> bool>, _pick: Rc<dyn Fn()>) -> nu::Node {
  nu::div(vec![])
}

pub fn slider(_value: Rc<dyn Fn() -> f64>, _change: Rc<dyn Fn(f64)>) -> nu::Node {
  nu::div(vec![])
}
