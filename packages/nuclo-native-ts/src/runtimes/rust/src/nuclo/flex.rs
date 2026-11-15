//! The flex layout every runtime implements the same way: a port of `Flex` in the Android
//! runtime (NucloRuntime.kt), statement by statement and with the same `f32` arithmetic in the
//! same order, so the same tree and the same text sizes give the same frames.

use super::node::Node;
use super::style::{px, Align, Display, FlexDirection, FlexWrap, Justify, Position, Style};

/// "No width limit" (Android's UNSPECIFIED measure): a width at or above it is unbounded.
pub(crate) const UNBOUNDED: f32 = f32::MAX / 8.0;

/// A frame inside the box: x, y, width, height.
pub(crate) type Frame = [f32; 4];

/// Lays out `node`'s views in a box `width` wide (and `height` tall when definite); fills
/// `frames` when given. The size returned is the box's; with `fit`, its width is what the
/// content needs (a box in a row, an absolute box), which for a column is its widest child
/// before stretching.
pub(crate) fn layout(node: &Node, width: f32, height: Option<f32>, frames: Option<&mut Vec<(Node, Frame)>>, fit: bool) -> [f32; 2] {
    let s = node.computed.get();
    let [pt, pr, pb, pl] = s.insets();
    let inner_w = if width >= UNBOUNDED { width } else { (width - pl - pr).max(0.0) };
    let inner_h = height.map(|h| (h - pt - pb).max(0.0));
    let items = node.items.borrow().clone();
    let flow: Vec<&Node> = items.iter().filter(|item| item.in_flow()).collect();
    let mut out: Vec<Frame> = vec![[0.0; 4]; flow.len()];
    let content = if s.flex_direction == Some(FlexDirection::Row) { row(&s, &flow, inner_w, inner_h, pt, pl, &mut out) } else { column(&s, &flow, inner_w, inner_h, pt, pl, &mut out, fit) };
    let natural = [content[0] + pl + pr, content[1] + pt + pb];
    let w = if width < UNBOUNDED { width.min(natural[0]) } else { natural[0] };
    let h = height.unwrap_or(natural[1]);

    if let Some(frames) = frames {
        frames.extend(flow.iter().zip(out).map(|(child, frame)| ((*child).clone(), frame)));
        // An absolute child is placed in the padding box, as in CSS.
        let b = px(s.border_width.unwrap_or(0.0));
        let box_w = (if width < UNBOUNDED { width } else { natural[0] }) - 2.0 * b;
        for child in &items {
            let cs = child.computed.get();
            if cs.position == Some(Position::Absolute) && cs.display != Some(Display::None) {
                let mut frame = absolute_frame(child, box_w, h - 2.0 * b);
                frame[0] += b;
                frame[1] += b;
                frames.push((child.clone(), frame));
            }
        }
    }
    [w, h]
}

fn cross_align(s: &Style, child: &Style) -> Align {
    child.align_self.or(s.align_items).unwrap_or(Align::Stretch)
}

fn clamp_height(h: f32, s: &Style) -> f32 {
    let mut v = h;
    if let Some(max) = s.max_height {
        v = v.min(px(max));
    }
    if let Some(min) = s.min_height {
        v = v.max(px(min));
    }
    v
}

/// A row: one line, or several when it wraps. Returns the content size.
fn row(s: &Style, flow: &[&Node], inner_w: f32, inner_h: Option<f32>, pt: f32, pl: f32, out: &mut [Frame]) -> [f32; 2] {
    let n = flow.len();
    let bounded = inner_w < UNBOUNDED;
    let gap = px(s.gap.unwrap_or(0.0));
    let styles: Vec<Style> = flow.iter().map(|child| child.computed.get()).collect();
    let margins: Vec<[f32; 4]> = styles.iter().map(Style::margins).collect();
    let flexes: Vec<f32> = styles.iter().map(|cs| if bounded { cs.flex.unwrap_or(0.0) as f32 } else { 0.0 }).collect();
    let mut sizes: Vec<[f32; 2]> = (0..n)
        .map(|i| if flexes[i] > 0.0 { [0.0, 0.0] } else { flow[i].measure(if bounded { (inner_w - margins[i][1] - margins[i][3]).max(0.0) } else { inner_w }, false) })
        .collect();
    // Lines: an item that does not fit after the ones before it starts the next line.
    let wrap = s.flex_wrap == Some(FlexWrap::Wrap) && bounded;
    let mut starts: Vec<usize> = Vec::new();
    if n > 0 {
        starts.push(0);
    }
    if wrap {
        let mut used = 0.0;
        for i in 0..n {
            let w = sizes[i][0] + margins[i][1] + margins[i][3];
            let first = *starts.last().unwrap();
            if i > first && used + gap + w > inner_w + 0.5 {
                starts.push(i);
                used = w;
            } else {
                used += (if i > first { gap } else { 0.0 }) + w;
            }
        }
    }
    let justify = s.justify_content.unwrap_or(Justify::FlexStart);
    let mut y = pt;
    let mut content_w: f32 = 0.0;
    for li in 0..starts.len() {
        let from = starts[li];
        let to = if li + 1 < starts.len() { starts[li + 1] } else { n };
        let count = to - from;
        let mut fixed = gap * (count as f32 - 1.0);
        let mut total_flex = 0.0;
        for i in from..to {
            fixed += sizes[i][0] + margins[i][1] + margins[i][3];
            total_flex += flexes[i];
        }
        let space = if bounded { (inner_w - fixed).max(0.0) } else { 0.0 };
        if total_flex > 0.0 {
            for i in from..to {
                if flexes[i] > 0.0 {
                    sizes[i] = flow[i].measure(space * flexes[i] / total_flex, true);
                }
            }
        }
        let mut line_h: f32 = 0.0;
        for i in from..to {
            line_h = line_h.max(sizes[i][1] + margins[i][0] + margins[i][2]);
        }
        if let (false, Some(inner_h)) = (wrap, inner_h) {
            line_h = inner_h;
        }
        let free = if total_flex > 0.0 { 0.0 } else { space };
        let mut x = pl;
        let mut spacing = gap;
        match justify {
            Justify::Center => x += free / 2.0,
            Justify::FlexEnd => x += free,
            Justify::SpaceBetween => {
                if count > 1 {
                    spacing += free / (count as f32 - 1.0);
                }
            }
            Justify::SpaceAround => {
                spacing += free / count as f32;
                x += free / count as f32 / 2.0;
            }
            Justify::SpaceEvenly => {
                spacing += free / (count as f32 + 1.0);
                x += free / (count as f32 + 1.0);
            }
            Justify::FlexStart => {}
        }
        for i in from..to {
            let m = margins[i];
            let cs = &styles[i];
            let w = sizes[i][0];
            let mut h = sizes[i][1];
            let mut cy = y + m[0];
            match cross_align(s, cs) {
                Align::Stretch => {
                    if cs.height.is_none() && cs.aspect_ratio.is_none() {
                        h = clamp_height(line_h - m[0] - m[2], cs);
                    }
                }
                Align::Center => cy += (line_h - h - m[0] - m[2]) / 2.0,
                Align::FlexEnd => cy += line_h - h - m[0] - m[2],
                Align::FlexStart => {}
            }
            out[i] = [x + m[3], cy, w, h];
            x += w + m[1] + m[3] + spacing;
        }
        let mut line_w = gap * (count as f32 - 1.0);
        for i in from..to {
            line_w += sizes[i][0] + margins[i][1] + margins[i][3];
        }
        content_w = content_w.max(if total_flex > 0.0 { inner_w } else { line_w });
        y += line_h + (if li + 1 < starts.len() { gap } else { 0.0 });
    }
    [content_w, y - pt]
}

/// A column. Returns the content size.
#[allow(clippy::too_many_arguments)]
fn column(s: &Style, flow: &[&Node], inner_w: f32, inner_h: Option<f32>, pt: f32, pl: f32, out: &mut [Frame], fit: bool) -> [f32; 2] {
    let n = flow.len();
    let bounded = inner_w < UNBOUNDED;
    let gap = px(s.gap.unwrap_or(0.0));
    let gaps = gap * n.saturating_sub(1) as f32;
    let styles: Vec<Style> = flow.iter().map(|child| child.computed.get()).collect();
    let margins: Vec<[f32; 4]> = styles.iter().map(Style::margins).collect();
    let flexes: Vec<f32> = styles.iter().map(|cs| cs.flex.unwrap_or(0.0) as f32).collect();
    // What each child needs before stretching: the column's own width when it is asked to fit.
    let mut needs = vec![0.0f32; n];
    let mut sizes: Vec<[f32; 2]> = (0..n)
        .map(|i| {
            let cs = &styles[i];
            let available = if bounded { (inner_w - margins[i][1] - margins[i][3]).max(0.0) } else { inner_w };
            // A stretched child is as wide as the column; one with its own width or alignment keeps its measure.
            let stretched = bounded && cross_align(s, cs) == Align::Stretch && cs.width.is_none() && cs.width_pct.is_none() && !(cs.aspect_ratio.is_some() && cs.height.is_some());
            let size = flow[i].measure(available, stretched);
            needs[i] = if stretched && fit { flow[i].measure(available, false)[0] } else { size[0] };
            size
        })
        .collect();
    let mut total_flex = 0.0;
    let mut content = gaps;
    for i in 0..n {
        total_flex += flexes[i];
        content += sizes[i][1] + margins[i][0] + margins[i][2];
    }
    let mut free = 0.0;
    if let Some(inner_h) = inner_h {
        if total_flex > 0.0 {
            let mut basis = gaps;
            for i in 0..n {
                basis += margins[i][0] + margins[i][2] + (if flexes[i] > 0.0 { 0.0 } else { sizes[i][1] });
            }
            let space = (inner_h - basis).max(0.0);
            for i in 0..n {
                if flexes[i] > 0.0 {
                    sizes[i][1] = clamp_height(space * flexes[i] / total_flex, &styles[i]);
                }
            }
        } else {
            free = (inner_h - content).max(0.0);
        }
    }
    let mut y = pt;
    let mut spacing = gap;
    match s.justify_content.unwrap_or(Justify::FlexStart) {
        Justify::Center => y += free / 2.0,
        Justify::FlexEnd => y += free,
        Justify::SpaceBetween => {
            if n > 1 {
                spacing += free / (n as f32 - 1.0);
            }
        }
        Justify::SpaceAround => {
            if n > 0 {
                spacing += free / n as f32;
                y += free / n as f32 / 2.0;
            }
        }
        Justify::SpaceEvenly => {
            spacing += free / (n as f32 + 1.0);
            y += free / (n as f32 + 1.0);
        }
        Justify::FlexStart => {}
    }
    let mut content_w: f32 = 0.0;
    for i in 0..n {
        let m = margins[i];
        let [w, h] = sizes[i];
        let mut x = pl + m[3];
        if bounded {
            match cross_align(s, &styles[i]) {
                Align::Center => x += (inner_w - w - m[1] - m[3]) / 2.0,
                Align::FlexEnd => x += inner_w - w - m[1] - m[3],
                _ => {}
            }
        }
        y += m[0];
        out[i] = [x, y, w, h];
        y += h + m[2] + spacing;
        content_w = content_w.max((if fit { needs[i] } else { w }) + m[1] + m[3]);
    }
    [content_w, inner_h.unwrap_or(content)]
}

fn absolute_frame(child: &Node, bw: f32, bh: f32) -> Frame {
    let s = child.computed.get();
    let (l, r, t, b) = (s.left.map(px), s.right.map(px), s.top.map(px), s.bottom.map(px));
    let w = s.width.map(px).or_else(|| s.width_pct.map(|pct| bw * pct as f32 / 100.0)).unwrap_or_else(|| match (l, r) {
        (Some(l), Some(r)) => bw - l - r,
        _ => child.measure(bw, false)[0],
    });
    let h = s.height.map(px).unwrap_or_else(|| match (t, b) {
        (Some(t), Some(b)) => bh - t - b,
        _ => child.measure(w, true)[1],
    });
    let x = l.unwrap_or_else(|| r.map_or(0.0, |r| bw - r - w));
    let y = t.unwrap_or_else(|| b.map_or(0.0, |b| bh - b - h));
    [x, y, w, h]
}
