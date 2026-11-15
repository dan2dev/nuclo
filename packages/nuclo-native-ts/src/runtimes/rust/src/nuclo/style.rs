//! `Style`, css(), cx() and variants(): the same merge rules as the other runtimes.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;


#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FlexDirection { Row, Column }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Align { FlexStart, Center, FlexEnd, Stretch }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Justify { FlexStart, Center, FlexEnd, SpaceBetween, SpaceAround, SpaceEvenly }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FlexWrap { Nowrap, Wrap }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Overflow { Visible, Hidden, Scroll }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Easing { Linear, Ease, EaseIn, EaseOut, EaseInOut, Spring }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Position { Relative, Absolute }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum Display { Flex, None }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FontWeight { Normal, Bold }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum TextAlign { Left, Center, Right }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FontStyle { Normal, Italic }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum TextDecoration { None, Underline, LineThrough }
/// `monospace`, `serif` and `sans-serif` are the platform's own; this runtime has no other names.
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FontFamily { SansSerif, Serif, Monospace }

pub fn css_font(name: &str) -> Option<FontFamily> {
    match name {
        "monospace" => Some(FontFamily::Monospace),
        "serif" => Some(FontFamily::Serif),
        _ => Some(FontFamily::SansSerif),
    }
}

/// A colour as 0xRRGGBBAA.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Color(pub u32);

impl Color {
    pub const BLACK: Color = Color(0x0000_00ff);
    pub const WHITE: Color = Color(0xffff_ffff);
    pub const TRANSPARENT: Color = Color(0);

    /// Red, green, blue, alpha in 0..=1.
    pub fn rgba(self) -> [f32; 4] {
        [24, 16, 8, 0].map(|shift| ((self.0 >> shift) & 0xff) as f32 / 255.0)
    }
}

/// `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` and the few names the other runtimes know. Anything
/// else is no colour, so the default shows.
pub fn css_color(value: &str) -> Option<Color> {
    let v = value.trim().to_lowercase();
    match v.as_str() {
        "transparent" => return Some(Color::TRANSPARENT),
        "white" => return Some(Color::WHITE),
        "black" => return Some(Color::BLACK),
        "red" => return Some(Color(0xff00_00ff)),
        _ => {}
    }
    let mut hex = v.strip_prefix('#')?.to_string();
    if hex.len() == 3 || hex.len() == 4 {
        hex = hex.chars().flat_map(|c| [c, c]).collect();
    }
    let n = u32::from_str_radix(&hex, 16).ok()?;
    match hex.len() {
        6 => Some(Color((n << 8) | 0xff)),
        8 => Some(Color(n)),
        _ => None,
    }
}

/// The style subset every runtime lays out the same way, in points. Colours are parsed when the
/// style is built, which makes a `Style` plain data: merging and comparing copy no strings.
#[derive(Clone, Copy, PartialEq, Default, Debug)]
pub struct Style {
    pub flex_direction: Option<FlexDirection>,
    pub align_items: Option<Align>,
    pub align_self: Option<Align>,
    pub justify_content: Option<Justify>,
    pub flex_wrap: Option<FlexWrap>,
    pub flex: Option<f64>,
    pub gap: Option<f64>,
    pub margin: Option<f64>,
    pub margin_top: Option<f64>,
    pub margin_right: Option<f64>,
    pub margin_bottom: Option<f64>,
    pub margin_left: Option<f64>,
    pub padding: Option<f64>,
    pub padding_top: Option<f64>,
    pub padding_right: Option<f64>,
    pub padding_bottom: Option<f64>,
    pub padding_left: Option<f64>,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub min_width: Option<f64>,
    pub max_width: Option<f64>,
    pub min_height: Option<f64>,
    pub max_height: Option<f64>,
    pub aspect_ratio: Option<f64>,
    pub overflow: Option<Overflow>,
    pub position: Option<Position>,
    pub top: Option<f64>,
    pub right: Option<f64>,
    pub bottom: Option<f64>,
    pub left: Option<f64>,
    pub z_index: Option<f64>,
    pub display: Option<Display>,
    pub background_color: Option<Color>,
    pub color: Option<Color>,
    pub opacity: Option<f64>,
    pub border_radius: Option<f64>,
    pub border_width: Option<f64>,
    pub border_color: Option<Color>,
    pub shadow_color: Option<Color>,
    pub shadow_radius: Option<f64>,
    pub shadow_offset_x: Option<f64>,
    pub shadow_offset_y: Option<f64>,
    pub font_size: Option<f64>,
    pub font_weight: Option<FontWeight>,
    pub font_style: Option<FontStyle>,
    pub font_family: Option<FontFamily>,
    pub line_height: Option<f64>,
    pub letter_spacing: Option<f64>,
    pub text_align: Option<TextAlign>,
    pub text_decoration: Option<TextDecoration>,
    pub number_of_lines: Option<f64>,
    pub translate_x: Option<f64>,
    pub translate_y: Option<f64>,
    pub scale: Option<f64>,
    pub rotate: Option<f64>,
    pub transition_duration: Option<f64>,
    pub transition_delay: Option<f64>,
    pub transition_easing: Option<Easing>,
    pub pressed: Option<StateStyle>,
    pub hover: Option<StateStyle>,
    pub focused: Option<StateStyle>,
}

/// A style merged over the box while it is pressed, hovered or focused. It is a handle into a
/// table of the distinct state styles the app uses, which keeps `Style` plain data: two handles
/// are equal exactly when their styles are.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct StateStyle(u32);

thread_local!(static STATE_STYLES: RefCell<Vec<Style>> = const { RefCell::new(Vec::new()) });

pub fn css_state(style: Style) -> Option<StateStyle> {
    STATE_STYLES.with(|styles| {
        let mut styles = styles.borrow_mut();
        let at = styles.iter().position(|known| *known == style).unwrap_or_else(|| {
            styles.push(style);
            styles.len() - 1
        });
        Some(StateStyle(at as u32))
    })
}

impl StateStyle {
    pub(crate) fn get(self) -> Style {
        STATE_STYLES.with(|styles| styles.borrow()[self.0 as usize])
    }
}

impl Style {
    /// `o`'s set values win, as later declarations do in CSS; a `padding` or `margin` shorthand resets the sides before it.
    pub fn merged(&self, o: &Style) -> Style {
        let side = |theirs: Option<f64>, ours: Option<f64>| theirs.or(if o.padding.is_some() { None } else { ours });
        let margin = |theirs: Option<f64>, ours: Option<f64>| theirs.or(if o.margin.is_some() { None } else { ours });
        Style {
            flex_direction: o.flex_direction.or(self.flex_direction),
            align_items: o.align_items.or(self.align_items),
            align_self: o.align_self.or(self.align_self),
            justify_content: o.justify_content.or(self.justify_content),
            flex_wrap: o.flex_wrap.or(self.flex_wrap),
            flex: o.flex.or(self.flex),
            gap: o.gap.or(self.gap),
            margin: o.margin.or(self.margin),
            margin_top: margin(o.margin_top, self.margin_top),
            margin_right: margin(o.margin_right, self.margin_right),
            margin_bottom: margin(o.margin_bottom, self.margin_bottom),
            margin_left: margin(o.margin_left, self.margin_left),
            padding: o.padding.or(self.padding),
            padding_top: side(o.padding_top, self.padding_top),
            padding_right: side(o.padding_right, self.padding_right),
            padding_bottom: side(o.padding_bottom, self.padding_bottom),
            padding_left: side(o.padding_left, self.padding_left),
            width: o.width.or(self.width),
            height: o.height.or(self.height),
            min_width: o.min_width.or(self.min_width),
            max_width: o.max_width.or(self.max_width),
            min_height: o.min_height.or(self.min_height),
            max_height: o.max_height.or(self.max_height),
            aspect_ratio: o.aspect_ratio.or(self.aspect_ratio),
            overflow: o.overflow.or(self.overflow),
            z_index: o.z_index.or(self.z_index),
            shadow_color: o.shadow_color.or(self.shadow_color),
            shadow_radius: o.shadow_radius.or(self.shadow_radius),
            shadow_offset_x: o.shadow_offset_x.or(self.shadow_offset_x),
            shadow_offset_y: o.shadow_offset_y.or(self.shadow_offset_y),
            number_of_lines: o.number_of_lines.or(self.number_of_lines),
            translate_x: o.translate_x.or(self.translate_x),
            translate_y: o.translate_y.or(self.translate_y),
            scale: o.scale.or(self.scale),
            rotate: o.rotate.or(self.rotate),
            transition_duration: o.transition_duration.or(self.transition_duration),
            transition_delay: o.transition_delay.or(self.transition_delay),
            transition_easing: o.transition_easing.or(self.transition_easing),
            pressed: o.pressed.or(self.pressed),
            hover: o.hover.or(self.hover),
            focused: o.focused.or(self.focused),
            position: o.position.or(self.position),
            top: o.top.or(self.top),
            right: o.right.or(self.right),
            bottom: o.bottom.or(self.bottom),
            left: o.left.or(self.left),
            display: o.display.or(self.display),
            background_color: o.background_color.or(self.background_color),
            color: o.color.or(self.color),
            opacity: o.opacity.or(self.opacity),
            border_radius: o.border_radius.or(self.border_radius),
            border_width: o.border_width.or(self.border_width),
            border_color: o.border_color.or(self.border_color),
            font_size: o.font_size.or(self.font_size),
            font_weight: o.font_weight.or(self.font_weight),
            font_style: o.font_style.or(self.font_style),
            font_family: o.font_family.or(self.font_family),
            line_height: o.line_height.or(self.line_height),
            letter_spacing: o.letter_spacing.or(self.letter_spacing),
            text_align: o.text_align.or(self.text_align),
            text_decoration: o.text_decoration.or(self.text_decoration),
        }
    }

    /// The properties a child takes from its parent unless it sets them.
    pub(crate) fn inherited(&self) -> Style {
        Style {
            color: self.color,
            font_size: self.font_size,
            font_weight: self.font_weight,
            font_style: self.font_style,
            font_family: self.font_family,
            line_height: self.line_height,
            letter_spacing: self.letter_spacing,
            text_align: self.text_align,
            ..Style::default()
        }
    }

    /// Padding plus border, in px: top, right, bottom, left.
    pub(crate) fn insets(&self) -> [f32; 4] {
        let b = self.border_width.unwrap_or(0.0);
        let p = self.padding.unwrap_or(0.0);
        [self.padding_top, self.padding_right, self.padding_bottom, self.padding_left].map(|side| px(side.unwrap_or(p) + b))
    }

    /// Margins in px: top, right, bottom, left.
    pub(crate) fn margins(&self) -> [f32; 4] {
        let m = self.margin.unwrap_or(0.0);
        [self.margin_top, self.margin_right, self.margin_bottom, self.margin_left].map(|side| px(side.unwrap_or(m)))
    }
}

/// Points to pixels. GTK and GPUI work in logical pixels and scale for the display themselves.
pub(crate) fn px(points: f64) -> f32 {
    points as f32
}

/// What the browser (and nuclo-native) give each tag before any style.
pub(crate) fn tag_style(tag: &str) -> Style {
    let d = Style::default();
    let bold = Some(FontWeight::Bold);
    let italic = Some(FontStyle::Italic);
    let mono = Some(FontFamily::Monospace);
    match tag {
        "h1" => Style { font_size: Some(32.0), font_weight: bold, ..d },
        "h2" => Style { font_size: Some(22.0), font_weight: bold, ..d },
        "h3" => Style { font_size: Some(19.0), font_weight: bold, ..d },
        "h4" => Style { font_size: Some(17.0), font_weight: bold, ..d },
        "h5" => Style { font_size: Some(15.0), font_weight: bold, ..d },
        "h6" => Style { font_size: Some(13.0), font_weight: bold, ..d },
        "strong" | "b" | "dt" => Style { font_weight: bold, ..d },
        "th" => Style { flex: Some(1.0), font_weight: bold, ..d },
        "td" => Style { flex: Some(1.0), ..d },
        "tr" => Style { flex_direction: Some(FlexDirection::Row), ..d },
        "small" | "sub" | "sup" => Style { font_size: Some(12.0), ..d },
        "em" | "i" | "cite" | "dfn" | "var" => Style { font_style: italic, ..d },
        "u" | "ins" => Style { text_decoration: Some(TextDecoration::Underline), ..d },
        "s" | "del" => Style { text_decoration: Some(TextDecoration::LineThrough), ..d },
        "mark" => Style { background_color: css_color("#fef08a"), ..d },
        "code" | "pre" | "kbd" | "samp" => Style { font_family: mono, ..d },
        "a" => Style { color: css_color("#2563eb"), ..d },
        "hr" => Style { height: Some(1.0), background_color: css_color("#cbd5e1"), ..d },
        "button" => Style { padding_top: Some(8.0), padding_right: Some(14.0), padding_bottom: Some(8.0), padding_left: Some(14.0), color: css_color("#2563eb"), ..d },
        "input" | "textarea" => Style { padding: Some(8.0), ..d },
        _ => d,
    }
}

/// A reusable style, applied as a child: `div(card, "Hello")`.
#[derive(Clone, PartialEq)]
pub struct StyleClass(pub(crate) Rc<Style>);

pub fn css(style: Style) -> StyleClass {
    StyleClass(Rc::new(style))
}

/// Merges classes left to right; `None` entries are skipped.
pub fn cx(classes: Vec<Option<StyleClass>>) -> StyleClass {
    css(classes.iter().flatten().fold(Style::default(), |acc, class| acc.merged(&class.0)))
}

pub struct Compound {
    matches: Vec<(String, String)>,
    style: Style,
}

impl Compound {
    pub fn new(matches: &[(&str, &str)], style: Style) -> Compound {
        Compound { matches: matches.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect(), style }
    }
}

struct Recipe {
    base: Style,
    /// Groups in declaration order: a later group wins where two set the same property.
    groups: Vec<(String, Vec<(String, Style)>)>,
    defaults: Vec<(String, String)>,
    compounds: Vec<Compound>,
    cache: RefCell<HashMap<String, StyleClass>>,
}

/// A variants() recipe: base, then each selected value in declaration order, then the matching compounds.
#[derive(Clone)]
pub struct Variants(Rc<Recipe>);

impl Variants {
    pub fn new(base: Style, groups: Vec<(&str, Vec<(&str, Style)>)>, defaults: &[(&str, &str)], compounds: Vec<Compound>) -> Variants {
        Variants(Rc::new(Recipe {
            base,
            groups: groups.into_iter().map(|(name, values)| (name.to_string(), values.into_iter().map(|(k, v)| (k.to_string(), v)).collect())).collect(),
            defaults: defaults.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect(),
            compounds,
            cache: RefCell::new(HashMap::new()),
        }))
    }

    pub fn select(&self, selection: &[(&str, &str)]) -> StyleClass {
        let recipe = &self.0;
        // One choice per group: the selection, else the default, else "false" for a boolean group.
        let chosen: Vec<(&str, Option<&str>)> = recipe
            .groups
            .iter()
            .map(|(group, values)| {
                let pick = selection.iter().rev().find(|(k, _)| k == group).map(|(_, v)| *v);
                let default = || recipe.defaults.iter().find(|(k, _)| k == group).map(|(_, v)| v.as_str());
                let boolean = || values.iter().any(|(k, _)| k == "false").then_some("false");
                (group.as_str(), pick.or_else(default).or_else(boolean))
            })
            .collect();
        let key = chosen.iter().map(|(group, value)| format!("{group}={}", value.unwrap_or(""))).collect::<Vec<_>>().join(";");
        if let Some(class) = recipe.cache.borrow().get(&key) {
            return class.clone();
        }
        let mut style = recipe.base;
        for ((_, values), (_, value)) in recipe.groups.iter().zip(&chosen) {
            if let Some((_, variant)) = values.iter().find(|(k, _)| Some(k.as_str()) == *value) {
                style = style.merged(variant);
            }
        }
        for compound in &recipe.compounds {
            if compound.matches.iter().all(|(k, v)| chosen.iter().any(|(group, value)| group == k && *value == Some(v.as_str()))) {
                style = style.merged(&compound.style);
            }
        }
        let class = css(style);
        recipe.cache.borrow_mut().insert(key, class.clone());
        class
    }
}
