//! JavaScript's typed arrays: a view (`off`, `len`) over packed shared storage. `subarray` shares the storage,
//! `slice` copies it. Writes convert as JavaScript does (ToInt8…ToUint32 wrap, Uint8Clamped rounds half to even
//! and clamps, Float32 rounds to nearest even); a write out of range is ignored. Callbacks get each value as an
//! `f64` (a JavaScript number) and its index.

use super::js::{js_num, Arr};
use std::cell::Cell;
use std::fmt;
use std::rc::Rc;

/// An element type: how it is stored, read (`N`: `i64` for the small integers, `f64` otherwise) and written.
pub trait TaKind: 'static {
    type S: Copy + Default + PartialEq;
    type N: Copy;
    const BYTES: i64;
    fn num(s: Self::S) -> Self::N;
    fn dbl(s: Self::S) -> f64;
    fn from_i(v: i64) -> Self::S;
    fn from_d(v: f64) -> Self::S;
}

/// ToInt32 (NaN and ±Infinity are 0): the low 32 bits of the integer part.
fn to_i32(d: f64) -> i32 {
    if d.is_finite() { (d % 4294967296.0) as i64 as i32 } else { 0 }
}

macro_rules! int_kind {
    ($kind:ident, $store:ty) => {
        pub struct $kind;
        impl TaKind for $kind {
            type S = $store;
            type N = i64;
            const BYTES: i64 = std::mem::size_of::<$store>() as i64;
            #[inline(always)]
            fn num(s: $store) -> i64 { s as i64 }
            #[inline(always)]
            fn dbl(s: $store) -> f64 { s as f64 }
            #[inline(always)]
            fn from_i(v: i64) -> $store { v as $store }
            #[inline(always)]
            fn from_d(v: f64) -> $store { to_i32(v) as $store }
        }
    };
}
int_kind!(TaInt8, i8);
int_kind!(TaUint8, u8);
int_kind!(TaInt16, i16);
int_kind!(TaUint16, u16);
int_kind!(TaInt32, i32);

pub struct TaUint8Clamped;
impl TaKind for TaUint8Clamped {
    type S = u8;
    type N = i64;
    const BYTES: i64 = 1;
    fn num(s: u8) -> i64 { s as i64 }
    fn dbl(s: u8) -> f64 { s as f64 }
    fn from_i(v: i64) -> u8 { v.clamp(0, 255) as u8 }
    fn from_d(v: f64) -> u8 {
        // NaN is 0; `round_ties_even` (not `round`, which rounds halves away from zero).
        if v.is_nan() { 0 } else { v.clamp(0.0, 255.0).round_ties_even() as u8 }
    }
}

pub struct TaUint32;
impl TaKind for TaUint32 {
    type S = u32;
    type N = f64;
    const BYTES: i64 = 4;
    fn num(s: u32) -> f64 { s as f64 }
    fn dbl(s: u32) -> f64 { s as f64 }
    fn from_i(v: i64) -> u32 { v as u32 }
    fn from_d(v: f64) -> u32 { to_i32(v) as u32 }
}

pub struct TaFloat32;
impl TaKind for TaFloat32 {
    type S = f32;
    type N = f64;
    const BYTES: i64 = 4;
    fn num(s: f32) -> f64 { s as f64 }
    fn dbl(s: f32) -> f64 { s as f64 }
    fn from_i(v: i64) -> f32 { v as f64 as f32 }
    fn from_d(v: f64) -> f32 { v as f32 }
}

pub struct TaFloat64;
impl TaKind for TaFloat64 {
    type S = f64;
    type N = f64;
    const BYTES: i64 = 8;
    fn num(s: f64) -> f64 { s }
    fn dbl(s: f64) -> f64 { s }
    fn from_i(v: i64) -> f64 { v as f64 }
    fn from_d(v: f64) -> f64 { v }
}

pub type Int8Array = TypedArray<TaInt8>;
pub type Uint8Array = TypedArray<TaUint8>;
pub type Uint8ClampedArray = TypedArray<TaUint8Clamped>;
pub type Int16Array = TypedArray<TaInt16>;
pub type Uint16Array = TypedArray<TaUint16>;
pub type Int32Array = TypedArray<TaInt32>;
pub type Uint32Array = TypedArray<TaUint32>;
pub type Float32Array = TypedArray<TaFloat32>;
pub type Float64Array = TypedArray<TaFloat64>;

pub struct TypedArray<K: TaKind> {
    buf: Rc<[Cell<K::S>]>,
    off: usize,
    len: usize,
}

impl<K: TaKind> Clone for TypedArray<K> {
    fn clone(&self) -> Self {
        TypedArray { buf: self.buf.clone(), off: self.off, len: self.len }
    }
}

impl<K: TaKind> PartialEq for TypedArray<K> {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.buf, &other.buf) && self.off == other.off && self.len == other.len
    }
}

impl<K: TaKind> Default for TypedArray<K> {
    fn default() -> Self {
        Self::new(0)
    }
}

impl<K: TaKind> fmt::Display for TypedArray<K> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.join(","))
    }
}

impl<K: TaKind> fmt::Debug for TypedArray<K> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.join(","))
    }
}

/// ToIntegerOrInfinity of a relative index, clamped to `0..=len` (negative counts from the end).
fn rel(d: f64, len: usize) -> usize {
    let t = if d.is_nan() { 0.0 } else { d.trunc() };
    let r = if t < 0.0 { (len as f64 + t).max(0.0) } else { t.min(len as f64) };
    r as usize
}

/// A stable merge sort with JavaScript's comparator contract (`cmp(a, b) > 0` puts b first); never panics on an
/// inconsistent comparator (Rust's `sort_by` may).
fn merge_sort(v: &mut Vec<f64>, cmp: &dyn Fn(f64, f64) -> f64) {
    let n = v.len();
    let mut tmp = v.clone();
    let mut width = 1;
    while width < n {
        let mut lo = 0;
        while lo < n {
            let (mid, hi) = ((lo + width).min(n), (lo + 2 * width).min(n));
            let (mut i, mut j, mut k) = (lo, mid, lo);
            while i < mid && j < hi {
                if cmp(v[j], v[i]) < 0.0 { tmp[k] = v[j]; j += 1 } else { tmp[k] = v[i]; i += 1 }
                k += 1;
            }
            while i < mid { tmp[k] = v[i]; i += 1; k += 1 }
            while j < hi { tmp[k] = v[j]; j += 1; k += 1 }
            lo = hi;
        }
        std::mem::swap(v, &mut tmp);
        width *= 2;
    }
}

impl<K: TaKind> TypedArray<K> {
    pub const BYTES_PER_ELEMENT: i64 = K::BYTES;

    /// `new X(n)`: n zeros.
    pub fn new(n: i64) -> Self {
        assert!(n >= 0, "RangeError: Invalid typed array length: {n}");
        let buf: Rc<[Cell<K::S>]> = (0..n).map(|_| Cell::new(K::S::default())).collect();
        TypedArray { buf, off: 0, len: n as usize }
    }
    fn from_fn(n: usize, f: impl Fn(usize) -> K::S) -> Self {
        TypedArray { buf: (0..n).map(|i| Cell::new(f(i))).collect(), off: 0, len: n }
    }
    /// `new X(numbers)`, `X.of(…)`, `X.from(numbers)`.
    pub fn from_doubles(xs: Arr<f64>) -> Self {
        let v = xs.to_vec();
        Self::from_fn(v.len(), |i| K::from_d(v[i]))
    }
    /// `new X(typedArray)`: each value converted.
    pub fn from_ta<K2: TaKind>(src: &TypedArray<K2>) -> Self {
        Self::from_fn(src.len, |i| K::from_d(src.dbl(i)))
    }
    #[inline(always)]
    fn cell(&self, i: usize) -> &Cell<K::S> {
        &self.buf[self.off + i]
    }
    #[inline(always)]
    fn dbl(&self, i: usize) -> f64 {
        K::dbl(self.cell(i).get())
    }
    pub fn length(&self) -> i64 {
        self.len as i64
    }
    pub fn byte_length(&self) -> i64 {
        self.len as i64 * K::BYTES
    }
    pub fn byte_offset(&self) -> i64 {
        self.off as i64 * K::BYTES
    }
    /// `ta[i]!`: traps out of range, as an array read does.
    #[inline(always)]
    pub fn get(&self, i: i64) -> K::N {
        assert!(i >= 0 && (i as usize) < self.len, "typed array index out of range");
        K::num(self.cell(i as usize).get())
    }
    /// `ta[i]`: undefined out of range.
    #[inline(always)]
    pub fn opt(&self, i: i64) -> Option<K::N> {
        if i >= 0 && (i as usize) < self.len { Some(K::num(self.cell(i as usize).get())) } else { None }
    }
    /// `ta[i] = v` of a whole number; ignored out of range.
    #[inline(always)]
    pub fn put(&self, i: i64, v: i64) {
        if i >= 0 && (i as usize) < self.len {
            self.cell(i as usize).set(K::from_i(v))
        }
    }
    #[inline(always)]
    pub fn put_d(&self, i: i64, v: f64) {
        if i >= 0 && (i as usize) < self.len {
            self.cell(i as usize).set(K::from_d(v))
        }
    }
    /// `at(i)`.
    pub fn js_at(&self, i: f64) -> Option<K::N> {
        let t = if i.is_nan() { 0.0 } else { i.trunc() };
        let k = if t < 0.0 { self.len as f64 + t } else { t };
        if k >= 0.0 && k < self.len as f64 { Some(K::num(self.cell(k as usize).get())) } else { None }
    }
    pub fn fill(&self, v: f64, start: f64, end: f64) -> Self {
        let s = K::from_d(v);
        let (a, b) = (rel(start, self.len), rel(end, self.len));
        for i in a..b.max(a) {
            self.cell(i).set(s);
        }
        self.clone()
    }
    pub fn subarray(&self, start: f64, end: f64) -> Self {
        let (a, b) = (rel(start, self.len), rel(end, self.len));
        TypedArray { buf: self.buf.clone(), off: self.off + a, len: b.max(a) - a }
    }
    pub fn slice(&self, start: f64, end: f64) -> Self {
        let (a, b) = (rel(start, self.len), rel(end, self.len));
        Self::from_fn(b.max(a) - a, |i| self.cell(a + i).get())
    }
    fn set_values(&self, values: Vec<f64>, offset: f64) {
        let o = if offset.is_nan() { 0.0 } else { offset.trunc() };
        assert!(o >= 0.0 && o + values.len() as f64 <= self.len as f64, "RangeError: offset is out of bounds");
        for (i, v) in values.into_iter().enumerate() {
            self.cell(o as usize + i).set(K::from_d(v));
        }
    }
    /// `set(numbers, offset)`.
    pub fn set_from(&self, xs: Arr<f64>, offset: f64) {
        self.set_values(xs.to_vec(), offset)
    }
    /// `set(typedArray, offset)`: read first, so an overlapping view of the same storage copies as if through a temporary.
    pub fn set_from_ta<K2: TaKind>(&self, src: &TypedArray<K2>, offset: f64) {
        self.set_values((0..src.len).map(|i| src.dbl(i)).collect(), offset)
    }
    pub fn copy_within(&self, target: f64, start: f64, end: f64) -> Self {
        let (t, s, e) = (rel(target, self.len), rel(start, self.len), rel(end, self.len));
        let count = e.saturating_sub(s).min(self.len - t);
        let items: Vec<K::S> = (s..s + count).map(|i| self.cell(i).get()).collect();
        for (i, v) in items.into_iter().enumerate() {
            self.cell(t + i).set(v);
        }
        self.clone()
    }
    pub fn reverse(&self) -> Self {
        let n = self.len;
        for i in 0..n / 2 {
            self.cell(i).swap(self.cell(n - 1 - i));
        }
        self.clone()
    }
    fn write_all(&self, v: Vec<f64>) {
        for (i, x) in v.into_iter().enumerate() {
            self.cell(i).set(K::from_d(x));
        }
    }
    /// `sort()`: numeric, -0 before +0, NaN last.
    pub fn sort_num(&self) -> Self {
        let mut v = self.to_vec();
        v.sort_by(|a, b| match (a.is_nan(), b.is_nan()) {
            (true, true) => std::cmp::Ordering::Equal,
            (true, false) => std::cmp::Ordering::Greater,
            (false, true) => std::cmp::Ordering::Less,
            _ if a == b => (b.is_sign_negative()).cmp(&a.is_sign_negative()),
            _ => a.partial_cmp(b).unwrap(),
        });
        self.write_all(v);
        self.clone()
    }
    /// `sort(cmp)`: stable; a NaN result is 0.
    pub fn sort_by(&self, cmp: impl Fn(f64, f64) -> f64) -> Self {
        let mut v = self.to_vec();
        merge_sort(&mut v, &|a, b| cmp(a, b));
        self.write_all(v);
        self.clone()
    }
    fn to_vec(&self) -> Vec<f64> {
        (0..self.len).map(|i| self.dbl(i)).collect()
    }
    /// `[...ta]`.
    pub fn to_array(&self) -> Arr<f64> {
        self.to_vec().into()
    }
    fn from_index(&self, from: f64) -> usize {
        rel(from, self.len)
    }
    pub fn index_of(&self, v: f64, from: f64) -> i64 {
        (self.from_index(from)..self.len).find(|&i| self.dbl(i) == v).map_or(-1, |i| i as i64)
    }
    pub fn last_index_of(&self, v: f64, from: f64) -> i64 {
        let t = if from.is_nan() { 0.0 } else { from.trunc() };
        let k = if t < 0.0 { self.len as f64 + t } else { t.min(self.len as f64 - 1.0) };
        if k < 0.0 {
            return -1;
        }
        (0..=k as usize).rev().find(|&i| self.dbl(i) == v).map_or(-1, |i| i as i64)
    }
    /// SameValueZero: NaN is found.
    pub fn includes(&self, v: f64, from: f64) -> bool {
        (self.from_index(from)..self.len).any(|i| { let x = self.dbl(i); x == v || (x.is_nan() && v.is_nan()) })
    }
    pub fn join(&self, sep: &str) -> String {
        (0..self.len).map(|i| js_num(self.dbl(i))).collect::<Vec<_>>().join(sep)
    }
    pub fn map(&self, f: impl Fn(f64, i64) -> f64) -> Self {
        Self::from_fn(self.len, |i| K::from_d(f(self.dbl(i), i as i64)))
    }
    pub fn filter(&self, f: impl Fn(f64, i64) -> bool) -> Self {
        let kept: Vec<K::S> = (0..self.len).filter(|&i| f(self.dbl(i), i as i64)).map(|i| self.cell(i).get()).collect();
        Self::from_fn(kept.len(), |i| kept[i])
    }
    pub fn for_each(&self, f: impl Fn(f64, i64)) {
        for i in 0..self.len {
            f(self.dbl(i), i as i64)
        }
    }
    pub fn some(&self, f: impl Fn(f64, i64) -> bool) -> bool {
        (0..self.len).any(|i| f(self.dbl(i), i as i64))
    }
    pub fn every(&self, f: impl Fn(f64, i64) -> bool) -> bool {
        (0..self.len).all(|i| f(self.dbl(i), i as i64))
    }
    pub fn find(&self, f: impl Fn(f64, i64) -> bool) -> Option<K::N> {
        (0..self.len).find(|&i| f(self.dbl(i), i as i64)).map(|i| K::num(self.cell(i).get()))
    }
    pub fn find_index(&self, f: impl Fn(f64, i64) -> bool) -> i64 {
        (0..self.len).find(|&i| f(self.dbl(i), i as i64)).map_or(-1, |i| i as i64)
    }
    pub fn reduce<A>(&self, init: A, f: impl Fn(A, f64) -> A) -> A {
        (0..self.len).fold(init, |acc, i| f(acc, self.dbl(i)))
    }
}

// ---------------------------------------------------------------------------
// ArrayBuffer and DataView (lib4)
// ---------------------------------------------------------------------------

use super::bigint::JsBigInt;
use super::task::JsError;

/// `ArrayBuffer`: the byte store `Uint8Array` / `Uint8ClampedArray` views share (`new Uint8Array(buffer, …)`, `.buffer`).
#[derive(Clone)]
pub struct ArrayBuffer(Rc<[Cell<u8>]>);

impl PartialEq for ArrayBuffer {
    fn eq(&self, other: &Self) -> bool {
        Rc::ptr_eq(&self.0, &other.0)
    }
}

impl Default for ArrayBuffer {
    fn default() -> Self {
        ArrayBuffer(Rc::from(Vec::new()))
    }
}

fn range(message: &str) -> JsError {
    JsError::named("RangeError", message.to_string())
}

/// ToIndex, with the message of the RangeError for a negative value.
fn to_index(d: f64, negative: &str) -> Result<usize, JsError> {
    let t = if d.is_nan() { 0.0 } else { d.trunc() };
    if t < 0.0 {
        return Err(range(negative));
    }
    if t > 9007199254740991.0 {
        return Err(range("length larger than (2 ** 53) - 1"));
    }
    Ok(t as usize)
}

fn zeros(n: usize) -> Rc<[Cell<u8>]> {
    (0..n).map(|_| Cell::new(0u8)).collect()
}

pub fn js_new_array_buffer(n: f64) -> Result<ArrayBuffer, JsError> {
    Ok(ArrayBuffer(zeros(to_index(n, "length cannot be negative")?)))
}
pub fn js_ab_byte_length(b: &ArrayBuffer) -> f64 {
    b.0.len() as f64
}
pub fn js_ab_slice(b: &ArrayBuffer, start: f64, end: f64) -> ArrayBuffer {
    let s = rel(start, b.0.len());
    let e = rel(end, b.0.len()).max(s);
    ArrayBuffer(b.0[s..e].iter().map(|c| Cell::new(c.get())).collect())
}

fn u8_view<K: TaKind<S = u8>>(b: &ArrayBuffer, off: f64, len: Option<f64>) -> Result<TypedArray<K>, JsError> {
    let o = to_index(off, "byteOffset cannot be negative")?;
    let n = match len {
        Some(l) => Some(to_index(l, "length cannot be negative")?),
        None => None,
    };
    if o > b.0.len() || o + n.unwrap_or(0) > b.0.len() {
        return Err(range("Length out of range of buffer"));
    }
    Ok(TypedArray { buf: b.0.clone(), off: o, len: n.unwrap_or(b.0.len() - o) })
}
/// `new Uint8Array(buffer, byteOffset, length?)` (and Uint8ClampedArray): a view sharing the buffer's bytes.
pub fn js_new_uint8_array(b: &ArrayBuffer, off: f64) -> Result<Uint8Array, JsError> {
    u8_view(b, off, None)
}
pub fn js_new_uint8_array_len(b: &ArrayBuffer, off: f64, len: f64) -> Result<Uint8Array, JsError> {
    u8_view(b, off, Some(len))
}
pub fn js_new_uint8_clamped_array(b: &ArrayBuffer, off: f64) -> Result<Uint8ClampedArray, JsError> {
    u8_view(b, off, None)
}
pub fn js_new_uint8_clamped_array_len(b: &ArrayBuffer, off: f64, len: f64) -> Result<Uint8ClampedArray, JsError> {
    u8_view(b, off, Some(len))
}
pub fn js_ta_buffer<K: TaKind<S = u8>>(t: &TypedArray<K>) -> ArrayBuffer {
    ArrayBuffer(t.buf.clone())
}

/// `DataView`: reads and writes numbers of any size and byte order in a window of an ArrayBuffer.
#[derive(Clone, PartialEq, Default)]
pub struct DataView {
    buffer: ArrayBuffer,
    off: usize,
    len: usize,
}

pub fn js_new_data_view(b: &ArrayBuffer, off: f64) -> Result<DataView, JsError> {
    data_view(b, off, None)
}
pub fn js_new_data_view_len(b: &ArrayBuffer, off: f64, len: f64) -> Result<DataView, JsError> {
    data_view(b, off, Some(len))
}
fn data_view(b: &ArrayBuffer, off: f64, len: Option<f64>) -> Result<DataView, JsError> {
    let o = to_index(off, "byteOffset cannot be negative")?;
    if o > b.0.len() {
        return Err(range("byteOffset exceeds source ArrayBuffer byteLength"));
    }
    let n = match len {
        None => b.0.len() - o,
        Some(l) => {
            let n = to_index(l, "byteLength cannot be negative")?;
            if o + n > b.0.len() {
                return Err(range("Length out of range of buffer"));
            }
            n
        }
    };
    Ok(DataView { buffer: b.clone(), off: o, len: n })
}
pub fn js_dv_buffer(d: &DataView) -> ArrayBuffer {
    d.buffer.clone()
}
pub fn js_dv_byte_length(d: &DataView) -> f64 {
    d.len as f64
}
pub fn js_dv_byte_offset(d: &DataView) -> f64 {
    d.off as f64
}

const DV_SIZES: [usize; 8] = [1, 1, 2, 2, 4, 4, 4, 8];

/// The bytes [at, at + size) of the view as an unsigned integer in the given byte order.
fn dv_load(d: &DataView, at: f64, size: usize, little: bool) -> Result<u64, JsError> {
    let i = to_index(at, "byteOffset cannot be negative")?;
    if i + size > d.len {
        return Err(range("Out of bounds access"));
    }
    let mut v = 0u64;
    for k in 0..size {
        v |= (d.buffer.0[d.off + i + if little { k } else { size - 1 - k }].get() as u64) << (8 * k);
    }
    Ok(v)
}
fn dv_store(d: &DataView, at: f64, size: usize, little: bool, v: u64) -> Result<(), JsError> {
    let i = to_index(at, "byteOffset cannot be negative")?;
    if i + size > d.len {
        return Err(range("Out of bounds access"));
    }
    for k in 0..size {
        d.buffer.0[d.off + i + if little { k } else { size - 1 - k }].set((v >> (8 * k)) as u8);
    }
    Ok(())
}
/// `getInt8` … `getFloat64` (kind 0 Int8, 1 Uint8, 2 Int16, 3 Uint16, 4 Int32, 5 Uint32, 6 Float32, 7 Float64).
pub fn js_dv_get(d: &DataView, kind: i64, at: f64, little: bool) -> Result<f64, JsError> {
    let v = dv_load(d, at, DV_SIZES[kind as usize], little)?;
    Ok(match kind {
        0 => v as u8 as i8 as f64,
        2 => v as u16 as i16 as f64,
        4 => v as u32 as i32 as f64,
        6 => f32::from_bits(v as u32) as f64,
        7 => f64::from_bits(v),
        _ => v as f64,
    })
}
/// `setInt8` … `setFloat64`: the number converted as a typed array of that kind converts it (NaN stored canonical).
pub fn js_dv_set(d: &DataView, kind: i64, at: f64, x: f64, little: bool) -> Result<(), JsError> {
    let v = match kind {
        6 => if x.is_nan() { 0x7fc0_0000 } else { (x as f32).to_bits() as u64 },
        7 => if x.is_nan() { 0x7ff8_0000_0000_0000 } else { x.to_bits() },
        _ => to_i32(x) as u32 as u64,
    };
    dv_store(d, at, DV_SIZES[kind as usize], little, v)
}
pub fn js_dv_get_big(d: &DataView, signed: bool, at: f64, little: bool) -> Result<JsBigInt, JsError> {
    let v = dv_load(d, at, 8, little)?;
    Ok(if signed { JsBigInt::from(v as i64) } else { JsBigInt::as_uint_n(64, JsBigInt::from(v as i64)) })
}
pub fn js_dv_set_big(d: &DataView, signed: bool, at: f64, x: JsBigInt, little: bool) -> Result<(), JsError> {
    let _ = signed;
    let v: i64 = JsBigInt::as_int_n(64, x).to_string().parse().unwrap();
    dv_store(d, at, 8, little, v as u64)
}
