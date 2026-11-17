//! `JSON.parse` / `JSON.stringify` with JavaScript's grammar and output, and `Date`.

use std::cell::Cell;
use std::rc::Rc;

use super::js::{js_num, Arr, Map};
use super::task::{json::JsonValue, JsError};

// ---------------------------------------------------------------------------
// JSON.parse
// ---------------------------------------------------------------------------

/// A JSON value as `JSON.parse` reads it: an object keeps its keys in source order (a repeated key keeps its first
/// place and its last value); the decoders apply JavaScript's key order where they make a map.
#[derive(Clone, Debug, PartialEq)]
pub enum JsJson {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<JsJson>),
    Obj(Vec<(String, JsJson)>),
}

static JS_JSON_NULL: JsJson = JsJson::Null;

impl JsonValue for JsJson {
    fn field(&self, key: &str) -> Option<&Self> {
        match self {
            JsJson::Obj(entries) => Some(entries.iter().find(|(k, _)| k == key).map_or(&JS_JSON_NULL, |(_, v)| v)),
            _ => None,
        }
    }
    fn as_str(&self) -> Option<&str> {
        if let JsJson::Str(s) = self { Some(s) } else { None }
    }
    fn as_f64(&self) -> Option<f64> {
        if let JsJson::Num(n) = self { Some(*n) } else { None }
    }
    fn as_bool(&self) -> Option<bool> {
        if let JsJson::Bool(b) = self { Some(*b) } else { None }
    }
    fn items(&self) -> Option<&[Self]> {
        if let JsJson::Arr(items) = self { Some(items) } else { None }
    }
    fn entries(&self) -> Option<Vec<(&str, &Self)>> {
        if let JsJson::Obj(entries) = self { Some(entries.iter().map(|(k, v)| (k.as_str(), v)).collect()) } else { None }
    }
    fn is_null(&self) -> bool {
        matches!(self, JsJson::Null)
    }
}

/// `JSON.parse(text)`: JavaScript's JSON grammar, a SyntaxError otherwise.
pub fn js_json_parse(text: &str) -> Result<JsJson, JsError> {
    let units: Vec<u16> = text.encode_utf16().collect();
    let mut p = Parser { s: &units, i: 0 };
    p.ws();
    let v = p.value()?;
    p.ws();
    if p.i != units.len() {
        return Err(p.fail());
    }
    Ok(v)
}

struct Parser<'a> {
    s: &'a [u16],
    i: usize,
}

impl Parser<'_> {
    fn fail(&self) -> JsError {
        JsError::named("SyntaxError", if self.i < self.s.len() { "JSON Parse error: Unexpected character" } else { "JSON Parse error: Unexpected EOF" })
    }
    fn at(&self, c: u8) -> bool {
        self.i < self.s.len() && self.s[self.i] == c as u16
    }
    fn ws(&mut self) {
        while self.i < self.s.len() && matches!(self.s[self.i], 32 | 9 | 10 | 13) {
            self.i += 1;
        }
    }
    fn lit(&mut self, w: &str) -> Result<(), JsError> {
        for c in w.bytes() {
            if !self.at(c) {
                return Err(self.fail());
            }
            self.i += 1;
        }
        Ok(())
    }
    fn digits(&mut self) -> bool {
        let d = self.i;
        while self.i < self.s.len() && (48..=57).contains(&self.s[self.i]) {
            self.i += 1;
        }
        self.i > d
    }
    fn value(&mut self) -> Result<JsJson, JsError> {
        if self.i >= self.s.len() {
            return Err(self.fail());
        }
        match self.s[self.i] {
            123 => {
                self.i += 1;
                let mut o: Vec<(String, JsJson)> = Vec::new();
                self.ws();
                if self.at(b'}') {
                    self.i += 1;
                    return Ok(JsJson::Obj(o));
                }
                loop {
                    self.ws();
                    if !self.at(b'"') {
                        return Err(self.fail());
                    }
                    let k = self.str()?;
                    self.ws();
                    self.lit(":")?;
                    self.ws();
                    let v = self.value()?;
                    match o.iter_mut().find(|(key, _)| *key == k) {
                        Some(slot) => slot.1 = v,
                        None => o.push((k, v)),
                    }
                    self.ws();
                    if self.at(b',') {
                        self.i += 1;
                        continue;
                    }
                    if !self.at(b'}') {
                        return Err(self.fail());
                    }
                    self.i += 1;
                    return Ok(JsJson::Obj(o));
                }
            }
            91 => {
                self.i += 1;
                let mut a = Vec::new();
                self.ws();
                if self.at(b']') {
                    self.i += 1;
                    return Ok(JsJson::Arr(a));
                }
                loop {
                    self.ws();
                    a.push(self.value()?);
                    self.ws();
                    if self.at(b',') {
                        self.i += 1;
                        continue;
                    }
                    if !self.at(b']') {
                        return Err(self.fail());
                    }
                    self.i += 1;
                    return Ok(JsJson::Arr(a));
                }
            }
            34 => Ok(JsJson::Str(self.str()?)),
            116 => self.lit("true").map(|_| JsJson::Bool(true)),
            102 => self.lit("false").map(|_| JsJson::Bool(false)),
            110 => self.lit("null").map(|_| JsJson::Null),
            _ => {
                let start = self.i;
                if self.at(b'-') {
                    self.i += 1;
                }
                if self.at(b'0') {
                    self.i += 1;
                } else if !self.digits() {
                    return Err(self.fail());
                }
                if self.at(b'.') {
                    self.i += 1;
                    if !self.digits() {
                        return Err(self.fail());
                    }
                }
                if self.at(b'e') || self.at(b'E') {
                    self.i += 1;
                    if self.at(b'+') || self.at(b'-') {
                        self.i += 1;
                    }
                    if !self.digits() {
                        return Err(self.fail());
                    }
                }
                let text = String::from_utf16_lossy(&self.s[start..self.i]);
                Ok(JsJson::Num(text.parse::<f64>().unwrap_or(f64::NAN)))
            }
        }
    }
    fn str(&mut self) -> Result<String, JsError> {
        self.i += 1;
        let mut u: Vec<u16> = Vec::new();
        loop {
            if self.i >= self.s.len() {
                return Err(self.fail());
            }
            let c = self.s[self.i];
            self.i += 1;
            if c == 34 {
                return Ok(String::from_utf16_lossy(&u));
            }
            if c < 32 {
                self.i -= 1;
                return Err(self.fail());
            }
            if c != 92 {
                u.push(c);
                continue;
            }
            if self.i >= self.s.len() {
                return Err(self.fail());
            }
            let e = self.s[self.i];
            self.i += 1;
            match e {
                34 | 92 | 47 => u.push(e),
                98 => u.push(8),
                102 => u.push(12),
                110 => u.push(10),
                114 => u.push(13),
                116 => u.push(9),
                117 => {
                    let mut v: u16 = 0;
                    for _ in 0..4 {
                        let h = if self.i < self.s.len() && self.s[self.i] < 128 { (self.s[self.i] as u8 as char).to_digit(16) } else { None };
                        let Some(h) = h else { return Err(self.fail()) };
                        v = v << 4 | h as u16;
                        self.i += 1;
                    }
                    u.push(v);
                }
                _ => return Err(self.fail()),
            }
        }
    }
}

// ---------------------------------------------------------------------------
// JSON.stringify
// ---------------------------------------------------------------------------

/// What `JSON.stringify` writes into: the generated encoders call it value by value, it lays out `gap` as JavaScript does.
pub struct JsonOut {
    out: String,
    gap: String,
    counts: Vec<usize>,
    arrays: Vec<bool>,
}

impl JsonOut {
    fn line(&mut self) {
        if !self.gap.is_empty() {
            self.out.push('\n');
            for _ in 0..self.counts.len() {
                self.out.push_str(&self.gap);
            }
        }
    }
    fn next(&mut self) {
        let n = self.counts.len() - 1;
        if self.counts[n] > 0 {
            self.out.push(',');
        }
        self.counts[n] += 1;
        self.line();
    }
    fn pre(&mut self) {
        if self.arrays.last() == Some(&true) {
            self.next();
        }
    }
    pub fn key(&mut self, k: &str) {
        self.next();
        self.quote(k);
        self.out.push_str(if self.gap.is_empty() { ":" } else { ": " });
    }
    pub fn null(&mut self) {
        self.pre();
        self.out.push_str("null");
    }
    pub fn bool(&mut self, b: bool) {
        self.pre();
        self.out.push_str(if b { "true" } else { "false" });
    }
    pub fn num(&mut self, d: f64) {
        self.pre();
        if d.is_finite() { self.out.push_str(&js_num(d)) } else { self.out.push_str("null") }
    }
    pub fn str(&mut self, s: &str) {
        self.pre();
        self.quote(s);
    }
    pub fn date(&mut self, d: &JsDate) {
        match d.to_json() {
            Some(s) => self.str(&s),
            None => self.null(),
        }
    }
    fn open(&mut self, c: char, array: bool) {
        self.pre();
        self.out.push(c);
        self.counts.push(0);
        self.arrays.push(array);
    }
    fn close(&mut self, c: char) {
        self.arrays.pop();
        if self.counts.pop().unwrap_or(0) > 0 {
            self.line();
        }
        self.out.push(c);
    }
    pub fn obj(&mut self, body: impl FnOnce(&mut JsonOut)) {
        self.open('{', false);
        body(self);
        self.close('}');
    }
    pub fn arr<T: Clone>(&mut self, xs: &Arr<T>, f: impl Fn(&mut JsonOut, T)) {
        self.open('[', true);
        for x in xs.to_vec() {
            f(self, x);
        }
        self.close(']');
    }
    pub fn map<T: Clone>(&mut self, m: &Map<T>, f: impl Fn(&mut JsonOut, T)) {
        self.open('{', false);
        for (k, v) in m.entries() {
            self.key(&k);
            f(self, v);
        }
        self.close('}');
    }
    /// An object's field: left out when it is undefined.
    pub fn field<T>(&mut self, k: &str, v: Option<T>, f: impl FnOnce(&mut JsonOut, T)) {
        if let Some(v) = v {
            self.key(k);
            f(self, v);
        }
    }
    pub fn opt<T>(&mut self, v: Option<T>, f: impl FnOnce(&mut JsonOut, T)) {
        match v {
            Some(v) => f(self, v),
            None => self.null(),
        }
    }
    fn quote(&mut self, s: &str) {
        self.out.push('"');
        for c in s.chars() {
            match c {
                '"' => self.out.push_str("\\\""),
                '\\' => self.out.push_str("\\\\"),
                '\u{8}' => self.out.push_str("\\b"),
                '\u{c}' => self.out.push_str("\\f"),
                '\n' => self.out.push_str("\\n"),
                '\r' => self.out.push_str("\\r"),
                '\t' => self.out.push_str("\\t"),
                c if (c as u32) < 32 => self.out.push_str(&format!("\\u{:04x}", c as u32)),
                c => self.out.push(c),
            }
        }
        self.out.push('"');
    }
}

/// `JSON.stringify(v, null, gap)`: `write` writes `v`.
pub fn js_json_stringify(gap: String, write: impl FnOnce(&mut JsonOut)) -> String {
    let mut o = JsonOut { out: String::new(), gap, counts: Vec::new(), arrays: Vec::new() };
    write(&mut o);
    o.out
}
/// The indent of `JSON.stringify(v, null, n)`: up to 10 spaces.
pub fn js_json_gap(n: f64) -> String {
    if n >= 1.0 { " ".repeat(n.min(10.0) as usize) } else { String::new() }
}
/// The indent of `JSON.stringify(v, null, s)`: the first 10 code units of s.
pub fn js_json_gap_str(s: &str) -> String {
    String::from_utf16_lossy(&s.encode_utf16().take(10).collect::<Vec<u16>>())
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

/// A JavaScript Date: a shared, mutable time value (ms since 1970 UTC, NaN when invalid); `===` is identity.
/// Local time is the system zone (localtime_r, which reads TZ); on wasm, UTC.
#[derive(Clone)]
pub struct JsDate(Rc<Cell<f64>>);

impl PartialEq for JsDate {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

const DAY: f64 = 86_400_000.0;
const WEEKDAYS: [&str; 7] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS: [&str; 12] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

impl JsDate {
    pub fn new(t: f64) -> JsDate {
        JsDate(Rc::new(Cell::new(js_time_clip(t))))
    }
    pub fn now() -> JsDate {
        JsDate::new(super::js::js_now())
    }
    pub fn parts(a: &[f64]) -> JsDate {
        JsDate::new(js_utc_from_local(js_make_parts(a)))
    }
    pub fn time(&self) -> f64 {
        self.0.get()
    }
    /// A field: 0 year, 1 month, 2 date, 3 hours, 4 minutes, 5 seconds, 6 ms, 7 weekday.
    pub fn get(&self, field: usize, local: bool) -> f64 {
        let t = self.0.get();
        if t.is_nan() {
            return f64::NAN;
        }
        date_fields(if local { t + js_local_offset(t) } else { t })[field]
    }
    /// The setters: `args` replace the fields from `from` on (setFullYear 0 … setMilliseconds 6).
    pub fn set(&self, from: usize, local: bool, args: &[f64]) -> f64 {
        let mut base = self.0.get();
        if base.is_nan() {
            if from != 0 {
                return f64::NAN;
            }
            base = 0.0;
        } else if local {
            base += js_local_offset(base);
        }
        let mut f = date_fields(base);
        for (n, a) in args.iter().enumerate() {
            f[from + n] = *a;
        }
        let v = make_date(make_day(f[0], f[1], f[2]), make_time(f[3], f[4], f[5], f[6]));
        let t = js_time_clip(if local { js_utc_from_local(v) } else { v });
        self.0.set(t);
        t
    }
    pub fn set_time(&self, v: f64) -> f64 {
        self.0.set(js_time_clip(v));
        self.0.get()
    }
    pub fn timezone_offset(&self) -> f64 {
        let t = self.0.get();
        if t.is_nan() { f64::NAN } else { -js_local_offset(t) / 60000.0 + 0.0 }
    }
    pub fn to_iso_string(&self) -> Result<String, JsError> {
        self.to_json().ok_or_else(|| JsError::named("RangeError", "Invalid Date"))
    }
    pub fn to_json(&self) -> Option<String> {
        let t = self.0.get();
        if t.is_nan() {
            return None;
        }
        let f = date_fields(t);
        let y = f[0] as i64;
        let year = if (0..=9999).contains(&y) { format!("{y:04}") } else { format!("{}{:06}", if y < 0 { "-" } else { "+" }, y.abs()) };
        Some(format!("{year}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z", f[1] as i64 + 1, f[2] as i64, f[3] as i64, f[4] as i64, f[5] as i64, f[6] as i64))
    }
    pub fn to_utc_string(&self) -> String {
        let t = self.0.get();
        if t.is_nan() {
            return "Invalid Date".to_string();
        }
        let f = date_fields(t);
        let y = f[0] as i64;
        format!("{}, {:02} {} {}{:04} {:02}:{:02}:{:02} GMT", WEEKDAYS[f[7] as usize], f[2] as i64, MONTHS[f[1] as usize], if y < 0 { "-" } else { "" }, y.abs(), f[3] as i64, f[4] as i64, f[5] as i64)
    }
    pub fn to_date_string(&self) -> String {
        let t = self.0.get();
        if t.is_nan() {
            return "Invalid Date".to_string();
        }
        let f = date_fields(t + js_local_offset(t));
        let y = f[0] as i64;
        format!("{} {} {:02} {}{:04}", WEEKDAYS[f[7] as usize], MONTHS[f[1] as usize], f[2] as i64, if y < 0 { "-" } else { "" }, y.abs())
    }
}

/// TimeClip: NaN past ±8.64e15 ms, else the whole number toward zero (+0, never -0).
pub fn js_time_clip(t: f64) -> f64 {
    if !t.is_finite() || t.abs() > 8.64e15 { f64::NAN } else { t.trunc() + 0.0 }
}
/// Date.UTC(y, m?, …) / the local parts of `new Date(y, m, …)` (years 0 to 99 are 1900 to 1999).
fn js_make_parts(a: &[f64]) -> f64 {
    let mut f = [f64::NAN, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0];
    for (n, v) in a.iter().take(7).enumerate() {
        f[n] = *v;
    }
    if f[0].is_finite() {
        let y = f[0].trunc();
        if (0.0..=99.0).contains(&y) {
            f[0] = 1900.0 + y;
        }
    }
    make_date(make_day(f[0], f[1], f[2]), make_time(f[3], f[4], f[5], f[6]))
}
pub fn js_date_utc(a: &[f64]) -> f64 {
    js_time_clip(js_make_parts(a))
}
fn make_day(y: f64, m: f64, d: f64) -> f64 {
    if !y.is_finite() || !m.is_finite() || !d.is_finite() {
        return f64::NAN;
    }
    let mi = m.trunc();
    days_from_civil(y.trunc() + (mi / 12.0).floor(), mi - (mi / 12.0).floor() * 12.0 + 1.0, 1.0) + d.trunc() - 1.0
}
fn make_time(h: f64, m: f64, s: f64, ms: f64) -> f64 {
    if !h.is_finite() || !m.is_finite() || !s.is_finite() || !ms.is_finite() {
        return f64::NAN;
    }
    h.trunc() * 3_600_000.0 + m.trunc() * 60000.0 + s.trunc() * 1000.0 + ms.trunc()
}
fn make_date(day: f64, time: f64) -> f64 {
    if day.is_finite() && time.is_finite() { day * DAY + time } else { f64::NAN }
}
fn days_from_civil(y0: f64, m: f64, d: f64) -> f64 {
    let y = if m <= 2.0 { y0 - 1.0 } else { y0 };
    let era = (y / 400.0).floor();
    let yoe = y - era * 400.0;
    let doy = ((153.0 * (if m > 2.0 { m - 3.0 } else { m + 9.0 }) + 2.0) / 5.0).floor() + d - 1.0;
    let doe = yoe * 365.0 + (yoe / 4.0).floor() - (yoe / 100.0).floor() + doy;
    era * 146_097.0 + doe - 719_468.0
}
/// Year, month (0 to 11), date, hours, minutes, seconds, ms and weekday of a time value.
fn date_fields(t: f64) -> [f64; 8] {
    let day = (t / DAY).floor();
    let mut ms = t - day * DAY;
    let z = day + 719_468.0;
    let era = (z / 146_097.0).floor();
    let doe = z - era * 146_097.0;
    let yoe = ((doe - (doe / 1460.0).floor() + (doe / 36524.0).floor() - (doe / 146_096.0).floor()) / 365.0).floor();
    let doy = doe - (365.0 * yoe + (yoe / 4.0).floor() - (yoe / 100.0).floor());
    let mp = ((5.0 * doy + 2.0) / 153.0).floor();
    let d = doy - ((153.0 * mp + 2.0) / 5.0).floor() + 1.0;
    let m = if mp < 10.0 { mp + 2.0 } else { mp - 10.0 };
    let y = yoe + era * 400.0 + if m <= 1.0 { 1.0 } else { 0.0 };
    let h = (ms / 3_600_000.0).floor();
    ms -= h * 3_600_000.0;
    let mi = (ms / 60000.0).floor();
    ms -= mi * 60000.0;
    let s = (ms / 1000.0).floor();
    ms -= s * 1000.0;
    let wd = day + 4.0 - ((day + 4.0) / 7.0).floor() * 7.0;
    [y, m, d, h, mi, s, ms, wd]
}

/// The system zone's offset from UTC at the instant `t`, in ms.
#[cfg(unix)]
pub fn js_local_offset(t: f64) -> f64 {
    #[repr(C)]
    struct Tm {
        sec: i32,
        min: i32,
        hour: i32,
        mday: i32,
        mon: i32,
        year: i32,
        wday: i32,
        yday: i32,
        isdst: i32,
        gmtoff: std::ffi::c_long,
        zone: *const std::ffi::c_char,
    }
    extern "C" {
        fn localtime_r(t: *const i64, tm: *mut Tm) -> *mut Tm;
        fn tzset();
    }
    static INIT: std::sync::Once = std::sync::Once::new();
    INIT.call_once(|| unsafe { tzset() });
    let secs = (t / 1000.0).floor() as i64;
    let mut tm = Tm { sec: 0, min: 0, hour: 0, mday: 0, mon: 0, year: 0, wday: 0, yday: 0, isdst: 0, gmtoff: 0, zone: std::ptr::null() };
    if unsafe { localtime_r(&secs, &mut tm) }.is_null() {
        return 0.0;
    }
    tm.gmtoff as f64 * 1000.0
}
#[cfg(not(unix))]
pub fn js_local_offset(_t: f64) -> f64 {
    0.0
}

/// UTC(t) of a local time: the earlier instant of a repeated hour, the offset before the change for a skipped one.
fn js_utc_from_local(tl: f64) -> f64 {
    if !tl.is_finite() {
        return f64::NAN;
    }
    let (a, b) = (js_local_offset(tl - DAY), js_local_offset(tl + DAY));
    let (t1, t2) = (tl - a, tl - b);
    let (ok1, ok2) = (js_local_offset(t1) == a, js_local_offset(t2) == b);
    if ok1 && ok2 {
        t1.min(t2)
    } else if ok2 && !ok1 {
        t2
    } else {
        t1
    }
}

/// Date.parse of the ISO format JavaScript reads (date-only forms are UTC, a date-time without an offset local time); NaN otherwise.
pub fn js_date_parse(text: &str) -> f64 {
    let s = text.as_bytes();
    let mut i = 0;
    let num = |i: &mut usize, n: usize| -> Option<f64> {
        if *i + n > s.len() || !s[*i..*i + n].iter().all(u8::is_ascii_digit) {
            return None;
        }
        *i += n;
        std::str::from_utf8(&s[*i - n..*i]).ok()?.parse().ok()
    };
    let at = |i: &mut usize, c: u8| -> bool {
        if *i < s.len() && s[*i] == c {
            *i += 1;
            true
        } else {
            false
        }
    };
    let y = if i < s.len() && (s[i] == b'+' || s[i] == b'-') {
        let neg = s[i] == b'-';
        i += 1;
        let Some(v) = num(&mut i, 6) else { return f64::NAN };
        if neg && v == 0.0 {
            return f64::NAN;
        }
        if neg { -v } else { v }
    } else {
        let Some(v) = num(&mut i, 4) else { return f64::NAN };
        v
    };
    let (mut mo, mut d, mut h, mut mi, mut sec, mut ms) = (1.0, 1.0, 0.0, 0.0, 0.0, 0.0);
    if at(&mut i, b'-') {
        match num(&mut i, 2) {
            Some(v) if (1.0..=12.0).contains(&v) => mo = v,
            _ => return f64::NAN,
        }
        if at(&mut i, b'-') {
            match num(&mut i, 2) {
                Some(v) if (1.0..=31.0).contains(&v) => d = v,
                _ => return f64::NAN,
            }
        }
    }
    let mut offset = Some(0.0);
    if i < s.len() && matches!(s[i], b'T' | b't' | b' ') {
        i += 1;
        let Some(hh) = num(&mut i, 2) else { return f64::NAN };
        if !at(&mut i, b':') {
            return f64::NAN;
        }
        match num(&mut i, 2) {
            Some(v) if v <= 59.0 => (h, mi) = (hh, v),
            _ => return f64::NAN,
        }
        if at(&mut i, b':') {
            match num(&mut i, 2) {
                Some(v) if v <= 59.0 => sec = v,
                _ => return f64::NAN,
            }
            if at(&mut i, b'.') {
                let start = i;
                while i < s.len() && s[i].is_ascii_digit() {
                    i += 1;
                }
                if i == start {
                    return f64::NAN;
                }
                let digits = std::str::from_utf8(&s[start..i.min(start + 3)]).unwrap_or("0");
                ms = format!("{digits:0<3}").parse().unwrap_or(0.0);
            }
        }
        if !(h < 24.0 || (h == 24.0 && mi == 0.0 && sec == 0.0 && ms == 0.0)) {
            return f64::NAN;
        }
        offset = None;
        if at(&mut i, b'Z') || at(&mut i, b'z') {
            offset = Some(0.0);
        } else if i < s.len() && (s[i] == b'+' || s[i] == b'-') {
            let sign = if s[i] == b'-' { -1.0 } else { 1.0 };
            i += 1;
            let oh = match num(&mut i, 2) {
                Some(v) if v <= 23.0 => v,
                _ => return f64::NAN,
            };
            at(&mut i, b':');
            let om = match num(&mut i, 2) {
                Some(v) if v <= 59.0 => v,
                _ => return f64::NAN,
            };
            offset = Some(sign * (oh * 60.0 + om) * 60000.0);
        }
    }
    if i != s.len() {
        return f64::NAN;
    }
    let local = make_date(make_day(y, mo - 1.0, d), make_time(h, mi, sec, ms));
    js_time_clip(match offset {
        Some(o) => local - o,
        None => js_utc_from_local(local),
    })
}

/// `JSON.parse(text) as T`: `decode` is T's generated decoder.
pub fn js_json_decode<T>(text: &str, decode: impl FnOnce(&JsJson) -> Result<T, JsError>) -> Result<T, JsError> {
    decode(&js_json_parse(text)?)
}
