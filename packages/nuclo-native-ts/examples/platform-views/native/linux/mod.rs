// The Linux (GTK 4) side of examples/platform-views, copied into the generated Cargo project as its `native` module.
//
// GTK 4 embeds no browser (that takes WebKitGTK), so WebView fetches the page and shows its title and text. The date
// picker is GTK's own calendar, in a popover. GTK has no share sheet: share() puts the text on the clipboard.
#![allow(non_snake_case)] // The `declare function`s keep the names the app calls them by.

use std::cell::RefCell;
use std::rc::Rc;

use gtk::glib;
use gtk::prelude::*;

use crate::app::{DatePickerProps, WebViewProps};
use crate::gtk_backend::{native, widget};
use crate::nuclo::prelude::*;

#[derive(Default)]
pub struct WebView {
    url: String,
    page: Option<gtk::Label>,
}

impl NativeComponent<WebViewProps> for WebView {
    fn create(&mut self) -> NativeView {
        let page = gtk::Label::new(Some("Loading…"));
        page.set_wrap(true);
        page.set_xalign(0.0);
        page.set_yalign(0.0);
        page.set_selectable(true);
        page.set_margin_start(12);
        page.set_margin_end(12);
        page.set_margin_top(12);
        page.set_margin_bottom(12);
        let scroller = gtk::ScrolledWindow::new();
        scroller.set_child(Some(&page));
        self.page = Some(page);
        native(scroller)
    }

    fn update(&mut self, view: &NativeView, props: &Rc<WebViewProps>) {
        let url = props.url.get();
        if url == self.url {
            return;
        }
        self.url = url.clone();
        let Some(page) = self.page.clone() else { return };
        page.set_text("Loading…");
        widget::<gtk::ScrolledWindow>(view).vadjustment().set_value(0.0);
        let props = props.clone();
        launch(async move {
            let (title, text) = match fetch(&url, FetchInit::default()).await {
                Ok(response) => reader(&response.text().await?),
                Err(error) => (String::new(), format!("Could not load {url}: {}", js_error_message(&error))),
            };
            // A newer address may have been asked for meanwhile: only the page still wanted is shown.
            if props.url.get() == url {
                page.set_markup(&format!("<b>{}</b>\n\n{}", glib::markup_escape_text(&title), glib::markup_escape_text(&text)));
                (props.onLoad.get())(title);
            }
            Ok::<(), JsError>(())
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

/// GTK's calendar in a popover, opened from a button that shows the date.
#[derive(Default)]
pub struct DatePicker {
    props: Rc<RefCell<Option<Rc<DatePickerProps>>>>,
    calendar: Option<gtk::Calendar>,
}

impl NativeComponent<DatePickerProps> for DatePicker {
    fn create(&mut self) -> NativeView {
        let calendar = gtk::Calendar::new();
        let popover = gtk::Popover::new();
        popover.set_child(Some(&calendar));
        let button = gtk::MenuButton::new();
        button.set_popover(Some(&popover));
        let props = self.props.clone();
        calendar.connect_day_selected(move |calendar| {
            let date = calendar.date();
            let props = props.borrow().clone();
            if let (Some(p), Ok(iso)) = (props, date.format("%Y-%m-%d")) {
                popover.popdown();
                if iso != p.value.get() {
                    (p.onChange.get())(iso.to_string());
                }
            }
        });
        self.calendar = Some(calendar);
        native(button)
    }

    fn update(&mut self, view: &NativeView, props: &Rc<DatePickerProps>) {
        *self.props.borrow_mut() = Some(props.clone());
        let Some((y, m, d)) = ymd(&props.value.get()) else { return };
        let Ok(date) = glib::DateTime::from_local(y as i32, m as i32, d as i32, 0, 0, 0.0) else { return };
        let button: gtk::MenuButton = widget(view);
        button.set_label(&date.format("%b %e, %Y").map(|s| s.to_string()).unwrap_or_default());
        if let Some(calendar) = &self.calendar {
            if calendar.date().format("%Y-%m-%d").ok().as_deref() != Some(props.value.get().as_str()) {
                calendar.select_day(&date);
            }
        }
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

pub fn daysUntil(date: String) -> i64 {
    let Some((y, m, d)) = ymd(&date) else { return 0 };
    let Ok(now) = glib::DateTime::now_local() else { return 0 };
    days_from_civil(y, m, d) - days_from_civil(now.year() as i64, now.month() as i64, now.day_of_month() as i64)
}

pub async fn share(text: String) -> String {
    match gtk::gdk::Display::default() {
        Some(display) => {
            display.clipboard().set_text(&text);
            "Copied to the clipboard".to_string()
        }
        None => "Not shared".to_string(),
    }
}
