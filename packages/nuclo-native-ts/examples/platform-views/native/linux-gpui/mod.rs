// The GPUI side of examples/platform-views, copied into the generated Cargo project as its `native` module.
//
// GPUI draws and embeds nothing: WebView fetches the page and draws its title and text, DatePicker is a drawn
// stepper (‹ the day ›, a press on either side moves a day), and share() puts the text on the clipboard.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::RefCell;
use std::rc::Rc;
use std::time::{SystemTime, UNIX_EPOCH};

use gpui::{fill, point, px, size, App, Bounds, ContentMask, Pixels, Window};

use crate::app::{DatePickerProps, WebViewProps};
use crate::gpui_backend::{copy_text, hsla, native, paint_label, Draw};
use crate::nuclo::backend::PointerPhase;
use crate::nuclo::prelude::*;

/// The page as drawn: its title and text.
#[derive(Default)]
struct Page {
    title: RefCell<String>,
    text: RefCell<String>,
}

#[derive(Default)]
pub struct WebView {
    url: String,
    page: Rc<Page>,
}

impl NativeComponent<WebViewProps> for WebView {
    fn create(&mut self) -> NativeView {
        native(self.page.clone())
    }

    fn update(&mut self, _: &NativeView, props: &Rc<WebViewProps>) {
        let url = props.url.get();
        if url == self.url {
            return;
        }
        self.url = url.clone();
        *self.page.title.borrow_mut() = String::new();
        *self.page.text.borrow_mut() = "Loading…".to_string();
        let (page, props) = (self.page.clone(), props.clone());
        launch(async move {
            let (title, text) = match fetch(&url, FetchInit::default()).await {
                Ok(response) => reader(&response.text().await?),
                Err(error) => (String::new(), format!("Could not load {url}: {}", js_error_message(&error))),
            };
            // A newer address may have been asked for meanwhile: only the page still wanted is shown.
            if props.url.get() == url {
                *page.title.borrow_mut() = title.clone();
                *page.text.borrow_mut() = text;
                // The app updates on onLoad, which draws the page.
                (props.onLoad.get())(title);
            }
            Ok::<(), JsError>(())
        });
    }
}

impl Draw for Page {
    fn measure(&self, max_width: f32) -> (f32, f32) {
        (max_width, 300.0)
    }

    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, cx: &mut App) {
        window.paint_quad(fill(bounds, hsla(Color::WHITE, opacity)));
        let inner = Bounds::new(point(bounds.origin.x + px(12.0), bounds.origin.y + px(12.0)), size(bounds.size.width - px(24.0), bounds.size.height - px(24.0)));
        let below = Bounds::new(point(inner.origin.x, inner.origin.y + px(28.0)), size(inner.size.width, inner.size.height - px(28.0)));
        // What does not fit is cut off: there is no scrolling here.
        window.with_content_mask(Some(ContentMask { bounds }), |window| {
            paint_label(&self.title.borrow(), 15.0, true, Color(0x0f17_2aff), false, inner, opacity, window, cx);
            paint_label(&self.text.borrow(), 13.0, false, Color(0x3341_55ff), false, below, opacity, window, cx);
        });
    }
}

/// A page's title and its text: what is between the tags, without scripts and styles, its white space collapsed.
fn reader(html: &str) -> (String, String) {
    let lower = html.to_ascii_lowercase();
    let title = lower.find("<title").and_then(|start| {
        let open = start + lower[start..].find('>')? + 1;
        let close = open + lower[open..].find("</title")?;
        Some(entities(html[open..close].trim()))
    });
    let mut text = String::new();
    let mut rest = &html[lower.find("<body").unwrap_or(0)..];
    while let Some(open) = rest.find('<') {
        text.push_str(&rest[..open]);
        text.push(' ');
        let tag = rest[open..].to_ascii_lowercase();
        // A script's or a style's content is not text.
        let skip = ["script", "style"].iter().find(|name| tag[1..].starts_with(*name)).and_then(|name| tag.find(&format!("</{name}")));
        let after = match skip {
            Some(end) => open + end,
            None => open,
        };
        let Some(close) = rest[after..].find('>') else { break };
        // Block tags end a line.
        if ["<p", "<br", "<div", "<li", "<h1", "<h2", "<h3", "<tr", "</p", "</div", "</li", "</tr"].iter().any(|block| tag.starts_with(block)) {
            text.push('\n');
        }
        rest = &rest[after + close + 1..];
    }
    let lines = text.lines().map(|line| line.split_whitespace().collect::<Vec<_>>().join(" ")).filter(|line| !line.is_empty());
    (title.unwrap_or_default(), entities(&lines.collect::<Vec<_>>().join("\n")))
}

fn entities(text: &str) -> String {
    text.replace("&nbsp;", " ").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'").replace("&#x27;", "'").replace("&amp;", "&")
}

/// ‹ the day ›: a press on the left third goes a day back, on the right third a day on.
#[derive(Default)]
pub struct DatePicker(Rc<Stepper>);

#[derive(Default)]
struct Stepper(RefCell<Option<Rc<DatePickerProps>>>);

impl NativeComponent<DatePickerProps> for DatePicker {
    fn create(&mut self) -> NativeView {
        native(self.0.clone())
    }

    fn update(&mut self, _: &NativeView, props: &Rc<DatePickerProps>) {
        *self.0 .0.borrow_mut() = Some(props.clone());
    }
}

const MONTHS: [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

impl Draw for Stepper {
    fn measure(&self, max_width: f32) -> (f32, f32) {
        (max_width.min(170.0), 36.0)
    }

    fn paint(&self, bounds: Bounds<Pixels>, opacity: f32, window: &mut Window, cx: &mut App) {
        let Some(p) = self.0.borrow().clone() else { return };
        window.paint_quad(fill(bounds, hsla(Color(0xf1f5_f9ff), opacity)).corner_radii(px(8.0)));
        let label = match ymd(&p.value.get()) {
            Some((y, m, d)) => format!("{} {d}, {y}", MONTHS[(m.clamp(1, 12) - 1) as usize]),
            None => p.value.get(),
        };
        let ink = Color(0x0f17_2aff);
        paint_label(&label, 15.0, false, ink, true, bounds, opacity, window, cx);
        let side = |x: Pixels| Bounds::new(point(x, bounds.origin.y), size(px(24.0), bounds.size.height));
        paint_label("‹", 20.0, true, Color(0x4338_caff), true, side(bounds.origin.x + px(4.0)), opacity, window, cx);
        paint_label("›", 20.0, true, Color(0x4338_caff), true, side(bounds.origin.x + bounds.size.width - px(28.0)), opacity, window, cx);
    }

    fn pointer(&self, phase: PointerPhase, x: f32, _: f32, (width, _): (f32, f32)) {
        // The props are let go of before `onChange` runs: it comes back into `update`.
        let props = self.0.borrow().clone();
        let (Some(p), PointerPhase::Down) = (props, phase) else { return };
        let step = if x < width / 3.0 { -1 } else if x > width * 2.0 / 3.0 { 1 } else { return };
        let Some((y, m, d)) = ymd(&p.value.get()) else { return };
        let (y, m, d) = civil_from_days(days_from_civil(y, m, d) + step);
        (p.onChange.get())(format!("{y:04}-{m:02}-{d:02}"));
    }
}

fn ymd(date: &str) -> Option<(i64, i64, i64)> {
    let mut parts = date.split('-').map(|part| part.parse::<i64>().ok());
    Some((parts.next()??, parts.next()??, parts.next()??))
}

/// Days since 1970-01-01 of a date in the proleptic Gregorian calendar (Howard Hinnant's days_from_civil).
fn days_from_civil(y: i64, m: i64, d: i64) -> i64 {
    let y = if m <= 2 { y - 1 } else { y };
    let era = y.div_euclid(400);
    let yoe = y - era * 400;
    let doy = (153 * (m + if m > 2 { -3 } else { 9 }) + 2) / 5 + d - 1;
    era * 146_097 + yoe * 365 + yoe / 4 - yoe / 100 + doy - 719_468
}

/// The date of a day since 1970-01-01 (its inverse, civil_from_days).
fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + if m <= 2 { 1 } else { 0 }, m, d)
}

/// Today's day since 1970 in the local time zone. ponytail: the offset is asked of `date` once, so a change of
/// time zone while the app runs is not seen.
fn today() -> i64 {
    thread_local!(static OFFSET: i64 = {
        let out = std::process::Command::new("date").arg("+%z").output().ok();
        let text = out.map(|out| String::from_utf8_lossy(&out.stdout).trim().to_string()).unwrap_or_default();
        let sign = if text.starts_with('-') { -1 } else { 1 };
        let digits: i64 = text.trim_start_matches(['+', '-']).parse().unwrap_or(0);
        sign * (digits / 100 * 3600 + digits % 100 * 60)
    });
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0);
    (now + OFFSET.with(|offset| *offset)).div_euclid(86_400)
}

pub fn daysUntil(date: String) -> i64 {
    ymd(&date).map_or(0, |(y, m, d)| days_from_civil(y, m, d) - today())
}

pub async fn share(text: String) -> String {
    copy_text(text);
    "Copied to the clipboard".to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn days_round_trip() {
        assert_eq!(days_from_civil(1970, 1, 1), 0);
        assert_eq!(days_from_civil(2026, 12, 24) - days_from_civil(2026, 11, 15), 39);
        assert_eq!(civil_from_days(days_from_civil(2024, 2, 29) + 1), (2024, 3, 1));
        assert_eq!(civil_from_days(days_from_civil(2026, 12, 31) + 1), (2027, 1, 1));
    }
}
