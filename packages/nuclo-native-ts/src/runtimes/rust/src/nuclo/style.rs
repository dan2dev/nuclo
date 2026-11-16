//! `Style`, css(), cx() and variants(): the same merge rules as the other runtimes.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::thread::LocalKey;


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
pub enum FontWeight { Light, Normal, Medium, Semibold, Bold }

impl FontWeight {
    /// As CSS numbers it: 300 to 700.
    pub fn css(self) -> u16 {
        match self {
            FontWeight::Light => 300,
            FontWeight::Normal => 400,
            FontWeight::Medium => 500,
            FontWeight::Semibold => 600,
            FontWeight::Bold => 700,
        }
    }

    /// For a toolkit that only has regular and bold faces.
    pub fn bold(self) -> bool {
        self.css() >= 600
    }
}
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum TextAlign { Left, Center, Right }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum FontStyle { Normal, Italic }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum TextDecoration { None, Underline, LineThrough }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum TextTransform { None, Uppercase, Lowercase, Capitalize }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum ObjectFit { Cover, Contain, Fill }
#[derive(Clone, Copy, PartialEq, Debug)]
pub enum PointerEvents { Auto, None }
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
    if let Some((name, args)) = v.strip_suffix(')').and_then(|call| call.split_once('(')) {
        return functional_color(name.trim(), args);
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

/// `rgb()` / `rgba()` / `hsl()` / `hsla()`, with commas or spaces, and an alpha after a comma or a `/`.
fn functional_color(name: &str, args: &str) -> Option<Color> {
    let parts: Vec<&str> = args.split(|c: char| c == ',' || c == '/' || c.is_whitespace()).filter(|part| !part.is_empty()).collect();
    // A percentage is a share of `full`; a plain number is already in the channel's unit.
    let number = |part: &str, full: f64| match part.strip_suffix('%') {
        Some(percent) => percent.parse::<f64>().ok().map(|p| p / 100.0 * full),
        None => part.parse::<f64>().ok(),
    };
    let alpha = match parts.get(3) {
        Some(part) => number(part, 1.0)?,
        None => 1.0,
    };
    let (r, g, b) = match name {
        "rgb" | "rgba" => (number(parts.first()?, 255.0)?, number(parts.get(1)?, 255.0)?, number(parts.get(2)?, 255.0)?),
        "hsl" | "hsla" => {
            let hue = parts.first()?.trim_end_matches("deg").parse::<f64>().ok()?.rem_euclid(360.0) / 360.0;
            let (sat, light) = (number(parts.get(1)?, 1.0)?.clamp(0.0, 1.0), number(parts.get(2)?, 1.0)?.clamp(0.0, 1.0));
            let q = if light < 0.5 { light * (1.0 + sat) } else { light + sat - light * sat };
            let p = 2.0 * light - q;
            let channel = |t: f64| {
                let t = t.rem_euclid(1.0);
                let v = if t < 1.0 / 6.0 { p + (q - p) * 6.0 * t } else if t < 0.5 { q } else if t < 2.0 / 3.0 { p + (q - p) * (2.0 / 3.0 - t) * 6.0 } else { p };
                v * 255.0
            };
            (channel(hue + 1.0 / 3.0), channel(hue), channel(hue - 1.0 / 3.0))
        }
        _ => return None,
    };
    let byte = |v: f64| v.round().clamp(0.0, 255.0) as u32;
    Some(Color(byte(r) << 24 | byte(g) << 16 | byte(b) << 8 | byte(alpha * 255.0)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn functional_colors() {
        assert_eq!(css_color("rgba(15, 23, 42, 0.55)"), Some(Color(0x0f17_2a8c)));
        assert_eq!(css_color("rgb(255 0 0 / 50%)"), Some(Color(0xff00_0080)));
        assert_eq!(css_color("hsl(262, 83%, 58%)"), Some(Color(0x7c3b_edff)));
        assert_eq!(css_color("hsl(0, 100%, 50%)"), Some(Color(0xff00_00ff)));
        assert_eq!(css_color("rgba(1, 2)"), None);
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
    pub width_pct: Option<f64>,
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
    pub border_top_width: Option<f64>,
    pub border_right_width: Option<f64>,
    pub border_bottom_width: Option<f64>,
    pub border_left_width: Option<f64>,
    pub border_top_color: Option<Color>,
    pub border_right_color: Option<Color>,
    pub border_bottom_color: Option<Color>,
    pub border_left_color: Option<Color>,
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
    pub text_transform: Option<TextTransform>,
    pub number_of_lines: Option<f64>,
    pub placeholder_color: Option<Color>,
    pub object_fit: Option<ObjectFit>,
    pub pointer_events: Option<PointerEvents>,
    pub translate_x: Option<f64>,
    pub translate_y: Option<f64>,
    pub scale: Option<f64>,
    pub rotate: Option<f64>,
    pub transition_duration: Option<f64>,
    pub transition_delay: Option<f64>,
    pub transition_easing: Option<Easing>,
    pub animation: Option<Animation>,
    pub media: Option<Media>,
    pub pressed: Option<StateStyle>,
    pub hover: Option<StateStyle>,
    pub focused: Option<StateStyle>,
    pub disabled: Option<StateStyle>,
    pub enabled: Option<StateStyle>,
    pub checked: Option<StateStyle>,
    pub placeholder_shown: Option<StateStyle>,
    pub first: Option<StateStyle>,
    pub last: Option<StateStyle>,
    pub only: Option<StateStyle>,
    pub odd: Option<StateStyle>,
    pub even: Option<StateStyle>,
    pub empty: Option<StateStyle>,
}

// The values a `Style` holds that are not plain data (state styles, media rules, keyframes) live
// in tables of the distinct ones the app uses, and the style holds an index: that keeps `Style`
// `Copy`, and two indices are equal exactly when their values are.

thread_local! {
    static STATE_STYLES: RefCell<Vec<Style>> = const { RefCell::new(Vec::new()) };
    static MEDIA: RefCell<Vec<Vec<MediaRule>>> = const { RefCell::new(Vec::new()) };
    static ANIMATIONS: RefCell<Vec<Rc<StyleAnimation>>> = const { RefCell::new(Vec::new()) };
}

fn intern<T: PartialEq>(table: &'static LocalKey<RefCell<Vec<T>>>, value: T) -> u32 {
    table.with(|table| {
        let mut table = table.borrow_mut();
        let at = table.iter().position(|known| *known == value).unwrap_or_else(|| {
            table.push(value);
            table.len() - 1
        });
        at as u32
    })
}

/// A style merged over the box while a state holds (pressed, hovered, disabled, first…).
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct StateStyle(u32);

pub fn css_state(style: Style) -> Option<StateStyle> {
    Some(StateStyle(intern(&STATE_STYLES, style)))
}

impl StateStyle {
    pub(crate) fn get(self) -> Style {
        STATE_STYLES.with(|styles| styles.borrow()[self.0 as usize])
    }
}

/// A style merged while the window's width is within `min`…`max` (`@media`, a theme's screens).
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct MediaRule {
    min: Option<f64>,
    max: Option<f64>,
    pub(crate) style: Style,
}

impl MediaRule {
    pub fn new(min: Option<f64>, max: Option<f64>, style: Style) -> MediaRule {
        MediaRule { min, max, style }
    }

    pub(crate) fn matches(&self, width: f64) -> bool {
        self.min.is_none_or(|min| width >= min) && self.max.is_none_or(|max| width <= max)
    }
}

/// A style's media rules, in order.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Media(u32);

pub fn css_media(rules: Vec<MediaRule>) -> Option<Media> {
    Some(Media(intern(&MEDIA, rules)))
}

impl Media {
    pub(crate) fn rules(self) -> Vec<MediaRule> {
        MEDIA.with(|media| media.borrow()[self.0 as usize].clone())
    }
}

/// A keyframes() stop: `at` in 0…1.
#[derive(Clone, Copy, PartialEq, Debug)]
pub struct KeyframeStop {
    pub(crate) at: f64,
    pub(crate) style: Style,
}

impl KeyframeStop {
    pub fn new(at: f64, style: Style) -> KeyframeStop {
        KeyframeStop { at, style }
    }
}

/// A style's `animation`: keyframes, in milliseconds; `iterations` -1 runs forever.
#[derive(Clone, PartialEq, Debug)]
pub struct StyleAnimation {
    pub(crate) frames: Vec<KeyframeStop>,
    pub(crate) duration: f64,
    pub(crate) delay: f64,
    pub(crate) easing: Easing,
    pub(crate) iterations: i64,
    pub(crate) alternate: bool,
}

impl StyleAnimation {
    pub fn new(mut frames: Vec<KeyframeStop>, duration: f64, delay: f64, easing: Easing, iterations: i64, alternate: bool) -> StyleAnimation {
        frames.sort_by(|a, b| a.at.total_cmp(&b.at));
        // As in CSS, a missing 0% or 100% is the box's own style.
        if frames.first().is_some_and(|first| first.at > 0.0) {
            frames.insert(0, KeyframeStop::new(0.0, Style::default()));
        }
        if frames.last().is_some_and(|last| last.at < 1.0) {
            frames.push(KeyframeStop::new(1.0, Style::default()));
        }
        StyleAnimation { frames, duration, delay, easing, iterations, alternate }
    }
}

#[derive(Clone, Copy, PartialEq, Debug)]
pub struct Animation(u32);

pub fn css_animation(animation: StyleAnimation) -> Option<Animation> {
    Some(Animation(intern(&ANIMATIONS, Rc::new(animation))))
}

impl Animation {
    pub(crate) fn get(self) -> Rc<StyleAnimation> {
        ANIMATIONS.with(|animations| animations.borrow()[self.0 as usize].clone())
    }
}

/// Both state styles merged, as CSS rules for the same state are.
fn merged_state(ours: Option<StateStyle>, theirs: Option<StateStyle>) -> Option<StateStyle> {
    match (ours, theirs) {
        (Some(ours), Some(theirs)) if ours != theirs => css_state(ours.get().merged(&theirs.get())),
        _ => theirs.or(ours),
    }
}

impl Style {
    /// `o`'s set values win, as later declarations do in CSS; a `padding`, `margin`, `borderWidth` or
    /// `borderColor` shorthand resets the sides before it. Media rules add up.
    pub fn merged(&self, o: &Style) -> Style {
        let side = |theirs: Option<f64>, ours: Option<f64>| theirs.or(if o.padding.is_some() { None } else { ours });
        let margin = |theirs: Option<f64>, ours: Option<f64>| theirs.or(if o.margin.is_some() { None } else { ours });
        let border = |theirs: Option<f64>, ours: Option<f64>| theirs.or(if o.border_width.is_some() { None } else { ours });
        let border_color = |theirs: Option<Color>, ours: Option<Color>| theirs.or(if o.border_color.is_some() { None } else { ours });
        let media = match (self.media, o.media) {
            (Some(ours), Some(theirs)) => css_media([ours.rules(), theirs.rules()].concat()),
            (ours, theirs) => theirs.or(ours),
        };
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
            width: if o.width_pct.is_some() { None } else { o.width.or(self.width) },
            width_pct: if o.width.is_some() { None } else { o.width_pct.or(self.width_pct) },
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
            animation: o.animation.or(self.animation),
            media,
            pressed: merged_state(self.pressed, o.pressed),
            hover: merged_state(self.hover, o.hover),
            focused: merged_state(self.focused, o.focused),
            disabled: merged_state(self.disabled, o.disabled),
            enabled: merged_state(self.enabled, o.enabled),
            checked: merged_state(self.checked, o.checked),
            placeholder_shown: merged_state(self.placeholder_shown, o.placeholder_shown),
            first: merged_state(self.first, o.first),
            last: merged_state(self.last, o.last),
            only: merged_state(self.only, o.only),
            odd: merged_state(self.odd, o.odd),
            even: merged_state(self.even, o.even),
            empty: merged_state(self.empty, o.empty),
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
            border_top_width: border(o.border_top_width, self.border_top_width),
            border_right_width: border(o.border_right_width, self.border_right_width),
            border_bottom_width: border(o.border_bottom_width, self.border_bottom_width),
            border_left_width: border(o.border_left_width, self.border_left_width),
            border_top_color: border_color(o.border_top_color, self.border_top_color),
            border_right_color: border_color(o.border_right_color, self.border_right_color),
            border_bottom_color: border_color(o.border_bottom_color, self.border_bottom_color),
            border_left_color: border_color(o.border_left_color, self.border_left_color),
            text_transform: o.text_transform.or(self.text_transform),
            placeholder_color: o.placeholder_color.or(self.placeholder_color),
            object_fit: o.object_fit.or(self.object_fit),
            pointer_events: o.pointer_events.or(self.pointer_events),
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
            text_transform: self.text_transform,
            ..Style::default()
        }
    }

    /// The border's width on each side, in px: a side's own, or `borderWidth`. Top, right, bottom, left.
    pub(crate) fn borders(&self) -> [f32; 4] {
        let b = self.border_width.unwrap_or(0.0);
        [self.border_top_width, self.border_right_width, self.border_bottom_width, self.border_left_width].map(|side| px(side.unwrap_or(b)))
    }

    /// The border's colour on each side.
    pub(crate) fn border_colors(&self) -> [Color; 4] {
        let c = self.border_color.unwrap_or(Color::BLACK);
        [self.border_top_color, self.border_right_color, self.border_bottom_color, self.border_left_color].map(|side| side.unwrap_or(c))
    }

    /// Padding plus border, in px: top, right, bottom, left.
    pub(crate) fn insets(&self) -> [f32; 4] {
        let p = self.padding.unwrap_or(0.0);
        let b = self.borders();
        let sides = [self.padding_top, self.padding_right, self.padding_bottom, self.padding_left];
        std::array::from_fn(|i| px(sides[i].unwrap_or(p)) + b[i])
    }

    /// `lineHeight` in px: a bare number under 4 is a multiple of the font size, as in CSS.
    pub(crate) fn line_height_px(&self) -> f32 {
        let size = self.font_size.unwrap_or(15.0);
        px(match self.line_height {
            Some(lh) if lh < 4.0 => (size * lh).round(),
            Some(lh) => lh,
            None => (size * 1.2).round(),
        })
    }

    /// Whether the style changes with the box's place among its siblings.
    pub(crate) fn structural(&self) -> bool {
        self.first.is_some() || self.last.is_some() || self.only.is_some() || self.odd.is_some() || self.even.is_some()
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

thread_local!(static GLOBAL_STYLES: RefCell<HashMap<String, Style>> = RefCell::default());

/// globalStyle(): by tag name, and "body" for the screens and what every root inherits.
pub fn global_style(selector: &str, style: Style) {
    GLOBAL_STYLES.with(|styles| {
        let mut styles = styles.borrow_mut();
        for tag in selector.split(',').map(str::trim) {
            let tag = if matches!(tag, "html" | ":root" | "*") { "body" } else { tag };
            let entry = styles.entry(tag.to_string()).or_default();
            *entry = entry.merged(&style);
        }
    })
}

/// What globalStyle() gave `tag`.
pub(crate) fn global(tag: &str) -> Option<Style> {
    GLOBAL_STYLES.with(|styles| styles.borrow().get(tag).copied())
}

/// What the browser (and nuclo-native) give each tag before any style, and what globalStyle() adds.
pub(crate) fn tag_style(tag: &str) -> Style {
    let own = builtin_tag_style(tag);
    global(tag).map_or(own, |global| own.merged(&global))
}

fn builtin_tag_style(tag: &str) -> Style {
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
        "head" | "base" | "link" | "meta" | "script" | "style" | "title" | "template" | "noscript" | "datalist" | "area" | "source" | "track" | "wbr" => Style { display: Some(Display::None), ..d },
        "br" => Style { height: Some(16.0), ..d },
        "select" => Style {
            overflow: Some(Overflow::Hidden),
            background_color: css_color("#ffffff"),
            border_radius: Some(8.0),
            border_width: Some(1.0),
            border_color: css_color("#cbd5e1"),
            ..d
        },
        "progress" | "meter" => Style {
            flex_direction: Some(FlexDirection::Row),
            width: Some(if tag == "meter" { 80.0 } else { 160.0 }),
            height: Some(16.0),
            overflow: Some(Overflow::Hidden),
            background_color: css_color("#e5e7eb"),
            border_radius: Some(8.0),
            ..d
        },
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
