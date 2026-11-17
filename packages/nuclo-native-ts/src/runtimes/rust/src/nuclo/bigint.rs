//! JavaScript's `bigint` and `symbol`.
//!
//! `JsBigInt` is an arbitrary-precision signed integer. A value that fits in an i64 (but i64::MIN) is held in
//! `small` with `mag` None, so arithmetic on small values never allocates (checked i64 ops, then the slow path);
//! a larger one keeps its magnitude in `mag` (little-endian 32-bit limbs, no high zero limb, shared by clones)
//! and its sign in `small` (1 or -1). Each value has exactly one representation, so the derived `==` and `Hash`
//! compare values. The same algorithms as the Swift runtime's `JsBigInt` (schoolbook multiplication, Knuth's
//! division), checked against JavaScript on random values.

use std::cmp::Ordering;
use std::fmt;
use std::ops::{Add, BitAnd, BitOr, BitXor, Div, Mul, Neg, Not, Rem, Shl, Shr, Sub};
use std::rc::Rc;

use super::js::js_trim;
use super::task::JsError;

#[derive(Clone, PartialEq, Eq, Hash)]
pub struct JsBigInt {
    small: i64,
    mag: Option<Rc<[u32]>>,
}

impl From<i64> for JsBigInt {
    fn from(v: i64) -> JsBigInt {
        if v == i64::MIN { JsBigInt { small: -1, mag: Some(Rc::from(vec![0, 0x8000_0000])) } } else { JsBigInt { small: v, mag: None } }
    }
}

fn cmp_mag(a: &[u32], b: &[u32]) -> Ordering {
    a.len().cmp(&b.len()).then_with(|| a.iter().rev().cmp(b.iter().rev()))
}

fn add_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
    let (x, y) = if a.len() >= b.len() { (a, b) } else { (b, a) };
    let mut r = Vec::with_capacity(x.len() + 1);
    let mut carry = 0u64;
    for i in 0..x.len() {
        let s = x[i] as u64 + y.get(i).copied().unwrap_or(0) as u64 + carry;
        r.push(s as u32);
        carry = s >> 32;
    }
    if carry != 0 {
        r.push(carry as u32);
    }
    r
}

/// a - b, where a >= b.
fn sub_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
    let mut r = Vec::with_capacity(a.len());
    let mut borrow = 0i64;
    for i in 0..a.len() {
        let mut d = a[i] as i64 - b.get(i).copied().unwrap_or(0) as i64 - borrow;
        borrow = (d < 0) as i64;
        if d < 0 {
            d += 1 << 32;
        }
        r.push(d as u32);
    }
    r
}

fn mul_mag(a: &[u32], b: &[u32]) -> Vec<u32> {
    if a.is_empty() || b.is_empty() {
        return Vec::new();
    }
    let mut r = vec![0u32; a.len() + b.len()];
    for i in 0..a.len() {
        let ai = a[i] as u64;
        if ai == 0 {
            continue;
        }
        let mut carry = 0u64;
        for j in 0..b.len() {
            let t = ai * b[j] as u64 + r[i + j] as u64 + carry;
            r[i + j] = t as u32;
            carry = t >> 32;
        }
        r[i + b.len()] = carry as u32;
    }
    r
}

fn shl_mag(a: &[u32], n: usize) -> Vec<u32> {
    if a.is_empty() {
        return Vec::new();
    }
    let (limbs, bits) = (n / 32, n % 32);
    let mut r = vec![0u32; limbs];
    r.reserve(a.len() + 1);
    if bits == 0 {
        r.extend_from_slice(a);
        return r;
    }
    let mut carry = 0u32;
    for &x in a {
        r.push(x << bits | carry);
        carry = x >> (32 - bits);
    }
    if carry != 0 {
        r.push(carry);
    }
    r
}

fn shr_mag(a: &[u32], n: usize) -> Vec<u32> {
    let (limbs, bits) = (n / 32, n % 32);
    if limbs >= a.len() {
        return Vec::new();
    }
    let mut r = a[limbs..].to_vec();
    if bits != 0 {
        for i in 0..r.len() {
            r[i] = r[i] >> bits | if i + 1 < r.len() { r[i + 1] << (32 - bits) } else { 0 };
        }
    }
    trim(&mut r);
    r
}

fn trim(r: &mut Vec<u32>) {
    while r.last() == Some(&0) {
        r.pop();
    }
}

/// The quotient and remainder of `a` by a one-limb divisor.
fn div_small(a: &[u32], d: u32) -> (Vec<u32>, u32) {
    let mut q = vec![0u32; a.len()];
    let mut rem = 0u64;
    for i in (0..a.len()).rev() {
        let cur = rem << 32 | a[i] as u64;
        q[i] = (cur / d as u64) as u32;
        rem = cur % d as u64;
    }
    trim(&mut q);
    (q, rem as u32)
}

/// Quotient and remainder of magnitudes (b not empty): Knuth's algorithm D.
fn div_mod_mag(a: &[u32], b: &[u32]) -> (Vec<u32>, Vec<u32>) {
    if cmp_mag(a, b) == Ordering::Less {
        return (Vec::new(), a.to_vec());
    }
    if b.len() == 1 {
        let (q, r) = div_small(a, b[0]);
        return (q, if r == 0 { Vec::new() } else { vec![r] });
    }
    let s = b.last().unwrap().leading_zeros() as usize;
    let mut v = shl_mag(b, s);
    let mut u = shl_mag(a, s);
    v.truncate(b.len());
    u.resize(a.len() + 1, 0);
    let (n, m) = (v.len(), u.len() - v.len());
    let mut q = vec![0u32; m];
    let (v_top, v_next) = (v[n - 1] as u64, v[n - 2] as u64);
    for j in (0..m).rev() {
        let num = (u[j + n] as u64) << 32 | u[j + n - 1] as u64;
        let mut qhat = num / v_top;
        let mut rhat = num % v_top;
        while qhat > 0xFFFF_FFFF || qhat * v_next > (rhat << 32 | u[j + n - 2] as u64) {
            qhat -= 1;
            rhat += v_top;
            if rhat > 0xFFFF_FFFF {
                break;
            }
        }
        let (mut borrow, mut carry) = (0i64, 0u64);
        for i in 0..n {
            let p = qhat * v[i] as u64 + carry;
            carry = p >> 32;
            let t = u[i + j] as i64 - borrow - (p & 0xFFFF_FFFF) as i64;
            u[i + j] = t as u32;
            borrow = (t < 0) as i64;
        }
        let t = u[j + n] as i64 - borrow - carry as i64;
        u[j + n] = t as u32;
        if t < 0 {
            qhat -= 1;
            let mut c = 0u64;
            for i in 0..n {
                let s2 = u[i + j] as u64 + v[i] as u64 + c;
                u[i + j] = s2 as u32;
                c = s2 >> 32;
            }
            u[j + n] = (u[j + n] as u64 + c) as u32;
        }
        q[j] = qhat as u32;
    }
    trim(&mut q);
    (q, shr_mag(&u[..n], s))
}

impl JsBigInt {
    /// A literal too big for an i64 (decimal digits, maybe with a leading "-").
    pub fn lit(text: &str) -> JsBigInt {
        JsBigInt::parse(text).unwrap()
    }

    fn make(neg: bool, mut m: Vec<u32>) -> JsBigInt {
        trim(&mut m);
        if m.len() <= 2 {
            let u = m.first().copied().unwrap_or(0) as u64 | (m.get(1).copied().unwrap_or(0) as u64) << 32;
            if u <= i64::MAX as u64 {
                return JsBigInt { small: if neg { -(u as i64) } else { u as i64 }, mag: None };
            }
        }
        JsBigInt { small: if neg { -1 } else { 1 }, mag: Some(Rc::from(m)) }
    }

    fn is_neg(&self) -> bool {
        self.small < 0
    }

    pub fn is_zero(&self) -> bool {
        self.mag.is_none() && self.small == 0
    }

    /// The magnitude as limbs (allocates for a small value).
    fn limbs(&self) -> Vec<u32> {
        if let Some(m) = &self.mag {
            return m.to_vec();
        }
        let u = self.small.unsigned_abs();
        if u == 0 { vec![] } else if u >> 32 == 0 { vec![u as u32] } else { vec![u as u32, (u >> 32) as u32] }
    }

    fn add_ref(&self, b: &JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() {
            if let Some(s) = self.small.checked_add(b.small) {
                return JsBigInt::from(s);
            }
        }
        let (x, y) = (self.limbs(), b.limbs());
        if self.is_neg() == b.is_neg() {
            return JsBigInt::make(self.is_neg(), add_mag(&x, &y));
        }
        if cmp_mag(&x, &y) != Ordering::Less { JsBigInt::make(self.is_neg(), sub_mag(&x, &y)) } else { JsBigInt::make(b.is_neg(), sub_mag(&y, &x)) }
    }

    fn neg_ref(&self) -> JsBigInt {
        match &self.mag {
            None => JsBigInt::from(-self.small),
            Some(m) => JsBigInt { small: -self.small, mag: Some(m.clone()) },
        }
    }

    fn mul_ref(&self, b: &JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() {
            if let Some(p) = self.small.checked_mul(b.small) {
                return JsBigInt::from(p);
            }
        }
        JsBigInt::make(self.is_neg() != b.is_neg(), mul_mag(&self.limbs(), &b.limbs()))
    }

    /// `a ** b` for b >= 0 (`js_big_pow` checks).
    pub fn pow(&self, b: &JsBigInt) -> JsBigInt {
        if b.mag.is_some() {
            // Only 0, 1 and -1 have a power this large (`js_big_pow` fails for the others).
            return if *self == JsBigInt::from(-1) && b.limbs()[0] & 1 == 0 { JsBigInt::from(1) } else { self.clone() };
        }
        let (mut result, mut base, mut e) = (JsBigInt::from(1), self.clone(), b.small);
        while e > 0 {
            if e & 1 == 1 {
                result = result.mul_ref(&base);
            }
            e >>= 1;
            if e > 0 {
                base = base.mul_ref(&base);
            }
        }
        result
    }

    /// The value as `count` limbs of two's complement.
    fn twos(&self, count: usize) -> Vec<u32> {
        let mut t = self.limbs();
        t.resize(count, 0);
        if self.is_neg() {
            negate_twos(&mut t);
        }
        t
    }

    fn from_twos(mut t: Vec<u32>) -> JsBigInt {
        let neg = t.last().is_some_and(|top| top & 0x8000_0000 != 0);
        if neg {
            negate_twos(&mut t);
        }
        JsBigInt::make(neg, t)
    }

    fn bitwise(&self, b: &JsBigInt, f: impl Fn(u32, u32) -> u32) -> JsBigInt {
        let n = self.limbs().len().max(b.limbs().len()) + 1;
        let (x, y) = (self.twos(n), b.twos(n));
        JsBigInt::from_twos((0..n).map(|i| f(x[i], y[i])).collect())
    }

    /// A shift count: past an i64, only the sign matters (no value that big fits in memory).
    fn shift_count(&self) -> i64 {
        if self.mag.is_none() { self.small } else if self.is_neg() { -(1 << 62) } else { 1 << 62 }
    }

    /// `a * 2**n`, rounded toward -Infinity when n < 0.
    fn shl_by(&self, n: i64) -> JsBigInt {
        if self.is_zero() || n == 0 {
            return self.clone();
        }
        if n > 0 {
            if self.mag.is_none() && n < 63 {
                let s = self.small << n;
                if s >> n == self.small && s != i64::MIN {
                    return JsBigInt::from(s);
                }
            }
            assert!(n < 1 << 32, "RangeError: BigInt too big");
            return JsBigInt::make(self.is_neg(), shl_mag(&self.limbs(), n as usize));
        }
        let m = n.unsigned_abs();
        if self.mag.is_none() {
            return JsBigInt::from(if m >= 64 { if self.small < 0 { -1 } else { 0 } } else { self.small >> m });
        }
        let m = usize::try_from(m).unwrap_or(usize::MAX);
        if !self.is_neg() {
            return JsBigInt::make(false, shr_mag(&self.limbs(), m));
        }
        // floor(-x / 2^m) = -((x - 1) >> m) - 1
        JsBigInt::make(true, add_mag(&shr_mag(&sub_mag(&self.limbs(), &[1]), m), &[1]))
    }

    /// `BigInt.asUintN(bits, a)`: a modulo 2^bits.
    pub fn as_uint_n(bits: i64, a: JsBigInt) -> JsBigInt {
        a & (JsBigInt::from(1).shl_by(bits) - JsBigInt::from(1))
    }

    /// `BigInt.asIntN(bits, a)`: a modulo 2^bits, as a signed value.
    pub fn as_int_n(bits: i64, a: JsBigInt) -> JsBigInt {
        if bits == 0 {
            return JsBigInt::from(0);
        }
        let u = JsBigInt::as_uint_n(bits, a);
        if u < JsBigInt::from(1).shl_by(bits - 1) { u } else { u - JsBigInt::from(1).shl_by(bits) }
    }

    /// `Number(b)`: the nearest f64 (ties to even), as JavaScript rounds it.
    pub fn to_f64(&self) -> f64 {
        let Some(m) = &self.mag else { return self.small as f64 };
        let bits = m.len() * 32 - m.last().unwrap().leading_zeros() as usize;
        if bits > 1024 {
            return if self.is_neg() { f64::NEG_INFINITY } else { f64::INFINITY };
        }
        // The top 64 bits, with a sticky low bit for any bit below them: `as f64` then rounds as the whole would.
        let shift = bits - 64;
        let top = shr_mag(m, shift);
        let mut u = top[0] as u64 | (top.get(1).copied().unwrap_or(0) as u64) << 32;
        if shl_mag(&top, shift)[..] != m[..] {
            u |= 1;
        }
        let d = u as f64 * f64::from_bits(((1023 + shift) as u64) << 52);
        if self.is_neg() { -d } else { d }
    }

    /// `BigInt(n)` of a whole f64.
    fn from_whole(d: f64) -> JsBigInt {
        if d.abs() < 9.2e18 {
            return JsBigInt::from(d as i64);
        }
        let bits = d.to_bits();
        let v = JsBigInt::from((bits & ((1 << 52) - 1) | 1 << 52) as i64).shl_by(((bits >> 52) & 0x7ff) as i64 - 1075);
        if d < 0.0 { -v } else { v }
    }

    pub fn to_string_radix(&self, radix: u32) -> String {
        let digits = |mut u: u64, out: &mut Vec<u8>| loop {
            out.push(std::char::from_digit((u % radix as u64) as u32, radix).unwrap() as u8);
            u /= radix as u64;
            if u == 0 {
                break;
            }
        };
        let mut out = Vec::new();
        match &self.mag {
            None => digits(self.small.unsigned_abs(), &mut out),
            Some(m) => {
                // Divide by the largest power of the radix that fits in a limb, `k` digits at a time.
                let (mut chunk, mut k) = (radix, 1);
                while chunk as u64 * radix as u64 <= u32::MAX as u64 {
                    chunk *= radix;
                    k += 1;
                }
                let mut rest = m.to_vec();
                while !rest.is_empty() {
                    let (q, r) = div_small(&rest, chunk);
                    let start = out.len();
                    digits(r as u64, &mut out);
                    if !q.is_empty() {
                        out.resize(start + k, b'0');
                    }
                    rest = q;
                }
            }
        }
        if self.is_neg() {
            out.push(b'-');
        }
        out.reverse();
        String::from_utf8(out).unwrap()
    }

    /// JavaScript's StringToBigInt: decimal with an optional sign, or 0x / 0o / 0b; surrounding white space; "" is 0.
    pub fn parse(text: &str) -> Option<JsBigInt> {
        let t = js_trim(text);
        let mut s = t.as_str();
        if s.is_empty() {
            return Some(JsBigInt::from(0));
        }
        let (mut radix, mut neg) = (10u32, false);
        let b = s.as_bytes();
        let prefixed = match b.get(1) {
            Some(b'x' | b'X') => Some(16),
            Some(b'o' | b'O') => Some(8),
            Some(b'b' | b'B') => Some(2),
            _ => None,
        };
        if b.len() > 2 && b[0] == b'0' && prefixed.is_some() {
            radix = prefixed.unwrap();
            s = &s[2..];
        } else if b[0] == b'+' || b[0] == b'-' {
            neg = b[0] == b'-';
            s = &s[1..];
        }
        if s.is_empty() {
            return None;
        }
        let mut mag: Vec<u32> = Vec::new();
        for c in s.chars() {
            let d = c.to_digit(radix)?;
            let mut carry = d as u64;
            for limb in mag.iter_mut() {
                let t = *limb as u64 * radix as u64 + carry;
                *limb = t as u32;
                carry = t >> 32;
            }
            if carry != 0 {
                mag.push(carry as u32);
            }
        }
        Some(JsBigInt::make(neg, mag))
    }
}

fn negate_twos(t: &mut [u32]) {
    let mut carry = 1u64;
    for x in t.iter_mut() {
        let s = (!*x) as u64 + carry;
        *x = s as u32;
        carry = s >> 32;
    }
}

impl Ord for JsBigInt {
    fn cmp(&self, b: &JsBigInt) -> Ordering {
        if self.mag.is_none() && b.mag.is_none() {
            return self.small.cmp(&b.small);
        }
        if self.is_neg() != b.is_neg() {
            return if self.is_neg() { Ordering::Less } else { Ordering::Greater };
        }
        let c = cmp_mag(&self.limbs(), &b.limbs());
        if self.is_neg() { c.reverse() } else { c }
    }
}

impl PartialOrd for JsBigInt {
    fn partial_cmp(&self, b: &JsBigInt) -> Option<Ordering> {
        Some(self.cmp(b))
    }
}

impl fmt::Display for JsBigInt {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.mag {
            None => write!(f, "{}", self.small),
            Some(_) => f.write_str(&self.to_string_radix(10)),
        }
    }
}

impl fmt::Debug for JsBigInt {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{self}n")
    }
}

impl Add for JsBigInt {
    type Output = JsBigInt;
    fn add(self, b: JsBigInt) -> JsBigInt {
        self.add_ref(&b)
    }
}

impl Sub for JsBigInt {
    type Output = JsBigInt;
    fn sub(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() {
            if let Some(s) = self.small.checked_sub(b.small) {
                return JsBigInt::from(s);
            }
        }
        self.add_ref(&b.neg_ref())
    }
}

impl Mul for JsBigInt {
    type Output = JsBigInt;
    fn mul(self, b: JsBigInt) -> JsBigInt {
        self.mul_ref(&b)
    }
}

/// Truncates toward zero, as JavaScript does. The divisor is not zero (`js_big_div` checks).
impl Div for JsBigInt {
    type Output = JsBigInt;
    fn div(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() {
            return JsBigInt::from(self.small / b.small);
        }
        JsBigInt::make(self.is_neg() != b.is_neg(), div_mod_mag(&self.limbs(), &b.limbs()).0)
    }
}

/// Takes the sign of the dividend, as JavaScript does. The divisor is not zero.
impl Rem for JsBigInt {
    type Output = JsBigInt;
    fn rem(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() {
            return JsBigInt::from(self.small % b.small);
        }
        JsBigInt::make(self.is_neg(), div_mod_mag(&self.limbs(), &b.limbs()).1)
    }
}

impl Neg for JsBigInt {
    type Output = JsBigInt;
    fn neg(self) -> JsBigInt {
        self.neg_ref()
    }
}

/// `~a` = -a - 1.
impl Not for JsBigInt {
    type Output = JsBigInt;
    fn not(self) -> JsBigInt {
        self.neg_ref() - JsBigInt::from(1)
    }
}

impl BitAnd for JsBigInt {
    type Output = JsBigInt;
    fn bitand(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() { JsBigInt::from(self.small & b.small) } else { self.bitwise(&b, |x, y| x & y) }
    }
}

impl BitOr for JsBigInt {
    type Output = JsBigInt;
    fn bitor(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() { JsBigInt::from(self.small | b.small) } else { self.bitwise(&b, |x, y| x | y) }
    }
}

impl BitXor for JsBigInt {
    type Output = JsBigInt;
    fn bitxor(self, b: JsBigInt) -> JsBigInt {
        if self.mag.is_none() && b.mag.is_none() { JsBigInt::from(self.small ^ b.small) } else { self.bitwise(&b, |x, y| x ^ y) }
    }
}

impl Shl for JsBigInt {
    type Output = JsBigInt;
    fn shl(self, b: JsBigInt) -> JsBigInt {
        self.shl_by(b.shift_count())
    }
}

impl Shr for JsBigInt {
    type Output = JsBigInt;
    fn shr(self, b: JsBigInt) -> JsBigInt {
        self.shl_by(-b.shift_count())
    }
}

/// The errors JavaScript's BigInt operations throw (`RangeError`, `SyntaxError`), with JavaScriptCore's messages.
pub fn js_big_div(a: JsBigInt, b: JsBigInt) -> Result<JsBigInt, JsError> {
    if b.is_zero() {
        return Err(JsError::named("RangeError", "0 is an invalid divisor value."));
    }
    Ok(a / b)
}

pub fn js_big_mod(a: JsBigInt, b: JsBigInt) -> Result<JsBigInt, JsError> {
    if b.is_zero() {
        return Err(JsError::named("RangeError", "0 is an invalid divisor value."));
    }
    Ok(a % b)
}

pub fn js_big_pow(a: JsBigInt, b: JsBigInt) -> Result<JsBigInt, JsError> {
    if b.is_neg() {
        return Err(JsError::named("RangeError", "Negative exponent is not allowed"));
    }
    if b.mag.is_some() && (a.mag.is_some() || a.small.abs() > 1) {
        return Err(JsError::named("RangeError", "Out of memory: BigInt generated from this operation is too big"));
    }
    Ok(a.pow(&b))
}

/// `BigInt(n)` of an f64: only a whole number converts.
pub fn js_big_from(d: f64) -> Result<JsBigInt, JsError> {
    if !d.is_finite() || d.trunc() != d {
        return Err(JsError::named("RangeError", "Not an integer"));
    }
    Ok(JsBigInt::from_whole(d))
}

pub fn js_big_parse(s: &str) -> Result<JsBigInt, JsError> {
    JsBigInt::parse(s).ok_or_else(|| JsError::named("SyntaxError", "Failed to parse String to BigInt"))
}

pub fn js_big_to_string(a: &JsBigInt, radix: f64) -> Result<String, JsError> {
    let radix = radix.trunc();
    if !(2.0..=36.0).contains(&radix) {
        return Err(JsError::named("RangeError", "toString() radix argument must be between 2 and 36"));
    }
    Ok(a.to_string_radix(radix as u32))
}

/// JavaScript's `symbol`: a value only equal to itself (clones are the same symbol), with an optional description.
#[derive(Clone)]
pub struct JsSymbol(Rc<Option<String>>);

impl JsSymbol {
    pub fn new(description: Option<String>) -> JsSymbol {
        JsSymbol(Rc::new(description))
    }

    pub fn description(&self) -> Option<String> {
        (*self.0).clone()
    }
}

impl PartialEq for JsSymbol {
    fn eq(&self, b: &JsSymbol) -> bool {
        Rc::ptr_eq(&self.0, &b.0)
    }
}

impl fmt::Display for JsSymbol {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Symbol({})", self.0.as_deref().unwrap_or(""))
    }
}
