// Algorithms corpus: strings (KMP, Z, Rabin–Karp, Manacher, anagrams, run-length, Caesar, base64 by hand).

function prefixFunction(p: string): number[] {
  const pi = new Array<number>(p.length).fill(0);
  for (let i = 1, k = 0; i < p.length; i++) {
    while (k > 0 && p.charAt(i) !== p.charAt(k)) k = pi[k - 1]!;
    if (p.charAt(i) === p.charAt(k)) k++;
    pi[i] = k;
  }
  return pi;
}

function kmpSearch(text: string, pattern: string): number[] {
  if (pattern.length === 0) return [];
  const pi = prefixFunction(pattern);
  const hits: number[] = [];
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    while (k > 0 && text.charAt(i) !== pattern.charAt(k)) k = pi[k - 1]!;
    if (text.charAt(i) === pattern.charAt(k)) k++;
    if (k === pattern.length) {
      hits.push(i - k + 1);
      k = pi[k - 1]!;
    }
  }
  return hits;
}

function zFunction(s: string): number[] {
  const n = s.length;
  const z = new Array<number>(n).fill(0);
  let l = 0;
  let r = 0;
  for (let i = 1; i < n; i++) {
    if (i < r) z[i] = Math.min(r - i, z[i - l]!);
    while (i + z[i]! < n && s.charCodeAt(z[i]!) === s.charCodeAt(i + z[i]!)) z[i]!++;
    if (i + z[i]! > r) {
      l = i;
      r = i + z[i]!;
    }
  }
  if (n > 0) z[0] = n;
  return z;
}

const BASE = 256;
const MOD = 1_000_000_007;

function rabinKarp(text: string, pattern: string): number[] {
  const m = pattern.length;
  const n = text.length;
  if (m === 0 || m > n) return [];
  let high = 1;
  for (let i = 0; i < m - 1; i++) high = (high * BASE) % MOD;
  let hp = 0;
  let ht = 0;
  for (let i = 0; i < m; i++) {
    hp = (hp * BASE + pattern.charCodeAt(i)) % MOD;
    ht = (ht * BASE + text.charCodeAt(i)) % MOD;
  }
  const out: number[] = [];
  for (let i = 0; i + m <= n; i++) {
    if (hp === ht && text.slice(i, i + m) === pattern) out.push(i);
    if (i + m < n) {
      ht = (ht - ((text.charCodeAt(i) * high) % MOD) + MOD) % MOD;
      ht = (ht * BASE + text.charCodeAt(i + m)) % MOD;
    }
  }
  return out;
}

/** Polynomial rolling hash using 32-bit math (Math.imul), as hash maps often do. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function djb2(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  return hash;
}

function manacher(s: string): string {
  if (!s) return "";
  const t = `^#${s.split("").join("#")}#$`;
  const p = new Array<number>(t.length).fill(0);
  let center = 0;
  let right = 0;
  for (let i = 1; i < t.length - 1; i++) {
    if (i < right) p[i] = Math.min(right - i, p[2 * center - i]!);
    while (t.charAt(i + 1 + p[i]!) === t.charAt(i - 1 - p[i]!)) p[i]!++;
    if (i + p[i]! > right) {
      center = i;
      right = i + p[i]!;
    }
  }
  let best = 0;
  let at = 0;
  p.forEach((len, i) => {
    if (len > best) {
      best = len;
      at = i;
    }
  });
  const start = (at - best) / 2;
  return s.substring(start, start + best);
}

export function matching(): string[] {
  const text = "abracadabra abracadabra";
  return [
    `pi ${prefixFunction("aabaaab").join("")} ${prefixFunction("abcabcd").join("")}`,
    `kmp ${kmpSearch(text, "abra").join(",")} ${kmpSearch("aaaaa", "aa").join(",")} [${kmpSearch("abc", "d").join(",")}]`,
    `z ${zFunction("aabxaab").join(",")} ${zFunction("aaaaa").join(",")}`,
    `rabin-karp ${rabinKarp(text, "cad").join(",")} ${rabinKarp("GEEKS FOR GEEKS", "GEEK").join(",")} ${rabinKarp("ab", "abc").length}`,
    `fnv1a ${fnv1a("")} ${fnv1a("hello")} ${fnv1a("The quick brown fox")}`,
    `djb2 ${djb2("hello")} ${djb2("a much longer string that will overflow 32 bits many times")}`,
    `manacher ${manacher("babad")} ${manacher("cbbd")} ${manacher("forgeeksskeegfor")} ${manacher("a")}|${manacher("")}|`,
    `indexOf ${text.indexOf("cad")} ${text.lastIndexOf("abra")} ${text.indexOf("abra", 1)} ${text.includes("dab")}`,
  ];
}

// ───── Grouping, counting, encoding ─────

function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const key = w.split("").sort().join("");
    const list = groups.get(key);
    if (list) list.push(w);
    else groups.set(key, [w]);
  }
  return [...groups.values()];
}

function charFrequency(s: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const ch of s.toLowerCase().split("")) {
    if (ch < "a" || ch > "z") continue;
    freq[ch] = (freq[ch] ?? 0) + 1;
  }
  return freq;
}

function isAnagram(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<string, number>();
  for (const c of a.split("")) counts.set(c, (counts.get(c) ?? 0) + 1);
  for (const c of b.split("")) {
    const left = (counts.get(c) ?? 0) - 1;
    if (left < 0) return false;
    counts.set(c, left);
  }
  return true;
}

function runLengthEncode(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j < s.length && s.charAt(j) === s.charAt(i)) j++;
    out += `${j - i}${s.charAt(i)}`;
    i = j;
  }
  return out;
}

function runLengthDecode(s: string): string {
  let out = "";
  let num = "";
  for (const ch of s.split("")) {
    if (ch >= "0" && ch <= "9") num += ch;
    else {
      out += ch.repeat(Number(num));
      num = "";
    }
  }
  return out;
}

function caesar(s: string, shift: number): string {
  return s
    .split("")
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((((code - 65 + shift) % 26) + 26) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((((code - 97 + shift) % 26) + 26) % 26) + 97);
      return c;
    })
    .join("");
}

function vigenere(text: string, key: string, decrypt = false): string {
  let ki = 0;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 65 || c > 90) {
      out += text.charAt(i);
      continue;
    }
    const k = key.charCodeAt(ki++ % key.length) - 65;
    out += String.fromCharCode(((c - 65 + (decrypt ? 26 - k : k)) % 26) + 65);
  }
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8Bytes(s: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i)!;
    if (cp > 0xffff) i++;
    if (cp < 0x80) bytes.push(cp);
    else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 63));
    else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
    else bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
  }
  return bytes;
}

function base64Encode(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    const n = (b0 << 16) | ((b1 ?? 0) << 8) | (b2 ?? 0);
    out += B64.charAt((n >> 18) & 63) + B64.charAt((n >> 12) & 63);
    out += b1 === undefined ? "=" : B64.charAt((n >> 6) & 63);
    out += b2 === undefined ? "=" : B64.charAt(n & 63);
  }
  return out;
}

function base64Decode(text: string): number[] {
  let end = text.length;
  while (end > 0 && text.charAt(end - 1) === "=") end--;
  const clean = text.slice(0, end);
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean.split("")) {
    buffer = (buffer << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return bytes;
}

function hex(bytes: number[]): string {
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function encodings(): string[] {
  const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
  const freq = charFrequency("Hello, World!");
  const secret = caesar("Hello, World! xyz", 3);
  const v = vigenere("ATTACK AT DAWN", "LEMON");
  return [
    `anagrams ${groupAnagrams(words).map((g) => g.join("/")).join(" ")}`,
    `isAnagram ${isAnagram("listen", "silent")} ${isAnagram("rat", "car")} ${isAnagram("", "")}`,
    `freq ${Object.keys(freq).map((k) => `${k}${freq[k]}`).join(" ")}`,
    `rle ${runLengthEncode("WWWWWWWWWWWWBWWWWWWWWWWWWBBBWWWWWWWWWWWWWWWWWWWWWWWWBWWWWWWWWWWWWWW")} ${runLengthEncode("")}|`,
    `rld ${runLengthDecode("3a2b1c10d")} roundtrip ${runLengthDecode(runLengthEncode("aaabccddddd")) === "aaabccddddd"}`,
    `caesar ${secret} back ${caesar(secret, -3)} rot13 ${caesar(caesar("Why did the chicken", 13), 13)}`,
    `vigenere ${v} ${vigenere(v, "LEMON", true)}`,
    `base64 ${base64Encode(utf8Bytes("Man"))} ${base64Encode(utf8Bytes("Ma"))} ${base64Encode(utf8Bytes("M"))} ${base64Encode(utf8Bytes("héllo wörld ✓ 😀"))}`,
    `decode ${hex(base64Decode("aMOpbGxvIHfDtnJsZCDinJMg8J+YgA=="))} ${String.fromCharCode(...base64Decode("SGVsbG8="))}`,
    `utf8 ${hex(utf8Bytes("aé€😀"))}`,
  ];
}

// ───── Tokenizing and formatting text ─────

function wordWrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ").filter((w) => w.length > 0)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function camelToSnake(s: string): string {
  let out = "";
  for (const ch of s.split("")) out += ch >= "A" && ch <= "Z" ? `_${ch.toLowerCase()}` : ch;
  return out;
}

function snakeToCamel(s: string): string {
  return s
    .split("_")
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function isPalindrome(s: string): boolean {
  const clean = s
    .toLowerCase()
    .split("")
    .filter((c) => (c >= "a" && c <= "z") || (c >= "0" && c <= "9"))
    .join("");
  for (let i = 0, j = clean.length - 1; i < j; i++, j--) if (clean.charAt(i) !== clean.charAt(j)) return false;
  return true;
}

function longestCommonPrefix(words: string[]): string {
  if (!words.length) return "";
  let prefix = words[0]!;
  for (const w of words.slice(1)) while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix;
}

function longestUniqueSubstring(s: string): string {
  const last = new Map<string, number>();
  let start = 0;
  let best = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    const seen = last.get(ch);
    if (seen !== undefined && seen >= start) start = seen + 1;
    last.set(ch, i);
    if (i - start + 1 > best.length) best = s.slice(start, i + 1);
  }
  return best;
}

function table(rows: [string, number][]): string[] {
  const w = Math.max(...rows.map(([name]) => name.length));
  return rows.map(([name, n]) => `${name.padEnd(w, ".")}|${n.toFixed(2).padStart(8)}`);
}

export function textUtils(): string[] {
  return [
    ...wordWrap("The quick brown fox jumps over the lazy dog and keeps running far away", 16).map((l) => `[${l}]`),
    `snake ${camelToSnake("parseHttpResponseCode")} camel ${snakeToCamel("parse_http_response_code")}`,
    `palindrome ${isPalindrome("A man, a plan, a canal: Panama")} ${isPalindrome("race a car")} ${isPalindrome("")}`,
    `lcp ${longestCommonPrefix(["flower", "flow", "flight"])}|${longestCommonPrefix(["dog", "racecar"])}|${longestCommonPrefix(["same", "same"])}`,
    `unique ${longestUniqueSubstring("abcabcbb")} ${longestUniqueSubstring("pwwkew")} ${longestUniqueSubstring("bbbb")}`,
    ...table([["apples", 3.5], ["kiwi", 120], ["dragonfruit", -0.125]]),
    `reverse words ${"  the sky   is blue ".trim().split(" ").filter((w) => w !== "").reverse().join(" ")}`,
    `count vowels ${"Programming in TypeScript".split("").filter((c) => "aeiouAEIOU".includes(c)).length}`,
  ];
}
