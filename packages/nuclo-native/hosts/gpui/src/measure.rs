//! Text and leaf sizes the contract's way (src/layout.ts): Inter, line height 1.35 × size on the
//! browser's 1/64 device-pixel grid, lines broken at spaces, baselines where the browser puts them.
//!
//! JS asks for sizes (`__nuclo_measure`) in the middle of a render, before the host has applied
//! that render's ops, so the measurer keeps its own copy of what it needs from every batch.
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use gpui::{Font, FontWeight, TextRun, TextSystem, WindowTextSystem, font, px};
use serde_json::Value;

#[derive(Clone, Copy, PartialEq, Debug)]
pub struct TextStyle {
    pub size: f32,
    pub bold: bool,
    pub system: bool,
}

impl Default for TextStyle {
    fn default() -> Self {
        Self { size: 14., bold: false, system: false }
    }
}

impl TextStyle {
    pub fn font(&self) -> Font {
        let mut f = font(if self.system { ".SystemUIFont" } else { "Inter" });
        f.weight = if self.bold { FontWeight::BOLD } else { FontWeight::NORMAL };
        f
    }
}

/// A line height: 1.35 × size, on the browser's 1/64 device-pixel grid.
pub fn line_height(size: f32, scale: f32) -> f32 {
    ((size as f64 * 1.35 * scale as f64 * 64. + 1e-6).floor() / (scale as f64 * 64.)) as f32
}

/// Where the browser puts the baseline in a line: ascent and descent rounded to device pixels,
/// then half the leading above them, floored to a device pixel.
pub fn baseline(ascent: f32, descent: f32, line: f32, scale: f32) -> f32 {
    let (a, d) = ((ascent * scale).round(), (descent * scale).round());
    (a + ((line * scale - a - d) / 2.).floor()) / scale
}

pub struct Line {
    pub text: String,
    pub width: f32,
}

#[derive(Default)]
struct Leaf {
    kind: String,
    text: String,
    src: String,
    style: TextStyle,
}

pub struct Measurer {
    system: WindowTextSystem,
    leaves: HashMap<u32, Leaf>,
    dir: PathBuf,
    /// Device pixels per point.
    pub scale: f32,
}

impl Measurer {
    pub fn new(text_system: Arc<TextSystem>, dir: PathBuf) -> Self {
        Self { system: WindowTextSystem::new(text_system), leaves: HashMap::new(), dir, scale: 2. }
    }

    /// Keeps what sizes depend on from a batch of ops.
    pub fn observe(&mut self, json: &str) {
        let Ok(Value::Array(ops)) = serde_json::from_str::<Value>(json) else { return };
        for op in ops {
            let Some(op) = op.as_array() else { continue };
            let id = op.get(1).and_then(Value::as_u64).unwrap_or(0) as u32;
            let arg = |i: usize| op.get(i).and_then(Value::as_str).unwrap_or("").to_string();
            match op.first().and_then(Value::as_str).unwrap_or("") {
                "create" => {
                    self.leaves.insert(id, Leaf { kind: arg(2), ..Leaf::default() });
                }
                "remove" => {
                    self.leaves.remove(&id);
                }
                "set" => {
                    let Some(leaf) = self.leaves.get_mut(&id) else { continue };
                    match arg(2).as_str() {
                        "text" => leaf.text = arg(3),
                        "src" => leaf.src = arg(3),
                        _ => {}
                    }
                }
                "style" => {
                    let Some(leaf) = self.leaves.get_mut(&id) else { continue };
                    apply_style(&mut leaf.style, &arg(2), &arg(3));
                }
                _ => {}
            }
        }
    }

    /// `__nuclo_measure(id, maxWidth)` → "w h"; maxWidth < 0: unconstrained.
    pub fn measure(&self, id: u32, max_width: f64) -> String {
        let Some(leaf) = self.leaves.get(&id) else { return "0 0".into() };
        let (w, h) = match leaf.kind.as_str() {
            "image" => image::image_dimensions(self.dir.join(&leaf.src)).map_or((0., 0.), |(w, h)| (w as f32, h as f32)),
            _ if leaf.text.is_empty() => (0., 0.),
            _ => {
                let lines = self.lines(&leaf.text, &leaf.style, (max_width >= 0.).then_some(max_width as f32));
                let widest = lines.iter().map(|l| l.width).fold(0., f32::max);
                // Widths round up, so the box JS sends back always fits the text.
                ((widest * 100. - 0.001).ceil() / 100., lines.len() as f32 * line_height(leaf.style.size, self.scale))
            }
        };
        format!("{w} {h}")
    }

    /// The text broken into lines at most `max_width` wide (CSS: at spaces; a longer word overflows).
    /// Widths leave out trailing spaces, as CSS lets them hang.
    pub fn lines(&self, text: &str, style: &TextStyle, max_width: Option<f32>) -> Vec<Line> {
        let run = TextRun { len: text.len(), font: style.font(), color: gpui::black(), background_color: None, underline: None, strikethrough: None };
        let layout = self.system.layout_line(text, px(style.size), &[run], None);
        let x = |i: usize| f32::from(layout.x_for_index(i));
        let trim = |end: usize| text[..end].trim_end().len();
        // Where a line may start: after a run of spaces.
        let starts: Vec<usize> = text.char_indices().filter(|&(i, c)| c != ' ' && i > 0 && text[..i].ends_with(' ')).map(|(i, _)| i).collect();
        let mut lines = Vec::new();
        let mut start = 0;
        while start < text.len() {
            let mut end = text.len();
            if let Some(max) = max_width {
                let fits = |end: usize| x(trim(end)) - x(start) <= max + 0.01;
                let candidates = starts.iter().copied().filter(|&s| s > start).chain([text.len()]);
                let mut chosen = None;
                for candidate in candidates {
                    if fits(candidate) {
                        chosen = Some(candidate);
                    } else {
                        chosen = chosen.or(Some(candidate));
                        break;
                    }
                }
                end = chosen.unwrap_or(text.len());
            }
            let content = trim(end);
            lines.push(Line { text: text[start..content].to_string(), width: x(content) - x(start) });
            start = end;
        }
        lines
    }

    /// The font's ascent and descent at `style` (the browser's baseline), and those GPUI centres
    /// a shaped line with when it paints.
    pub fn metrics(&self, style: &TextStyle) -> ((f32, f32), (f32, f32)) {
        let id = self.system.resolve_font(&style.font());
        let font = (f32::from(self.system.ascent(id, px(style.size))), f32::from(self.system.descent(id, px(style.size))).abs());
        let run = TextRun { len: 1, font: style.font(), color: gpui::black(), background_color: None, underline: None, strikethrough: None };
        let line = self.system.layout_line("H", px(style.size), &[run], None);
        (font, (f32::from(line.ascent), f32::from(line.descent).abs()))
    }
}

pub fn apply_style(style: &mut TextStyle, key: &str, value: &str) {
    match key {
        "fontSize" => style.size = value.trim_end_matches("px").parse().unwrap_or(14.),
        "fontWeight" => style.bold = value == "bold" || value.parse::<u32>().is_ok_and(|w| w >= 600),
        "fontFamily" => style.system = value == "system",
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn line_heights_and_baselines_follow_the_browser() {
        // Chrome at 2×: 12 px → 16.1953 tall, baseline 12; 14 px → 18.8984, 14; 13 px → 13.5.
        assert!((line_height(12., 2.) - 16.1953).abs() < 1e-3);
        assert!((line_height(14., 2.) - 18.8984).abs() < 1e-3);
        let inter = |size: f32| baseline(0.96875 * size, 0.2412109375 * size, line_height(size, 2.), 2.);
        assert_eq!(inter(12.), 12.);
        assert_eq!(inter(13.), 13.5);
        assert_eq!(inter(14.), 14.);
        assert_eq!(inter(40.), 41.5);
    }
}
