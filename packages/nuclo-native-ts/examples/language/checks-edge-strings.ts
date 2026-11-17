// Edge cases: strings by UTF-16 units, every method on edge inputs. Every top-level name starts with `ed`.

function edStr(s: string): string {
  return s;
}

/** Unicode: surrogate pairs, combining marks, emoji sequences; lengths and slices count UTF-16 units. */
export function edUnicode(): string[] {
  const face = edStr("😀");
  const flag = edStr("🇵🇹");
  const family = edStr("👨‍👩‍👧");
  const accent = edStr("é");
  const mixed = edStr("a😀b€c");
  return [
    `${face.length} ${flag.length} ${family.length} ${accent.length} ${"é".length} ${mixed.length} ${"".length}`,
    `[${mixed.slice(1, 3)}] [${mixed.slice(-3)}] [${mixed.slice(4)}] ${mixed.indexOf("€")} ${mixed.indexOf("b")} ${mixed.lastIndexOf("😀")}`,
    `${mixed.split("").length} ${face.split("").length} ${mixed.split("😀").join("|")} ${family.split("‍").length}`,
    `${mixed.toUpperCase()} ${"ß".toUpperCase()} ${"İ".toLowerCase().length} ${"ΣΑΣ".toLowerCase()} ${"ﬁ".toUpperCase()}`,
    `${"a" < "b"} ${"B" < "a"} ${"😀" < "￿"} ${"￿" < "😀"} ${"é" < "é"} ${"abc" < "abd"} ${"ab" < "abc"} ${"" < "a"}`,
    `${accent === "é"} ${"é" === accent} ${face + flag} ${`${face}`.length} ${face.repeat(3).length}`,
    `${"x".padStart(5, "😀")} ${"x".padStart(4, "😀").length} ${"x".padEnd(3, "ab")} [${"abc".padStart(6, "")}]`,
  ];
}

/** Every string method on empty, negative and out-of-range inputs. */
export function edStringEdges(): string[] {
  const s = edStr("hello world");
  const e = edStr("");
  return [
    `[${s.slice(-5)}] [${s.slice(-5, -1)}] [${s.slice(5, 2)}] [${s.slice(100)}] [${s.slice(-100, 2)}] [${e.slice(0, 1)}] [${s.slice(3, -100)}]`,
    `${s.indexOf("")} ${s.indexOf("", 5)} ${s.indexOf("", 99)} ${e.indexOf("")} ${s.indexOf("o", -5)} ${s.indexOf("o", 5)} ${s.lastIndexOf("o")} ${s.lastIndexOf("")} ${e.lastIndexOf("x")}`,
    `${s.includes("")} ${e.includes("")} ${s.startsWith("")} ${s.endsWith("")} ${e.startsWith("a")} ${s.includes("lo w")} ${s.endsWith("world")}`,
    `[${s.split(" ").join("|")}] [${s.split("").length}] [${e.split(",").length}] [${e.split("").length}] [${",a,,b,".split(",").join("|")}] [${s.split("hello world").length}]`,
    `[${s.split("o").join("|")}] [${"aaa".split("aa").join("|")}] [${"a-b-c".split("-").reverse().join("-")}]`,
    `[${"abc".repeat(0)}] [${e.repeat(5)}] [${"ab".repeat(1)}] [${"7".padStart(0)}] [${"7".padStart(-1, "x")}] [${e.padEnd(3)}] [${"abc".padEnd(2)}]`,
    `[${"a.b.c".replace(".", "")}] [${"a.b.c".replaceAll(".", "")}] [${"aaa".replace("a", "b")}] [${"aaa".replaceAll("aa", "b")}] [${"abc".replace("", "_")}] [${e.replace("", "x")}]`,
    `[${"abc".replace("b", "$$")}] [${"abc".replace("b", "[$&]")}] [${"abc".replace("b", "[$`]")}] [${"abc".replace("b", "[$']")}] [${"abc".replace("b", "$1")}] [${"abc".replaceAll("b", "$&$&")}]`,
    `[${"abc".replace("x", "y")}] [${"a$b".replace("$", "€")}] [${"aXbXc".replaceAll("X", "$'")}]`,
  ];
}

/** trim removes JavaScript's white space (Unicode spaces, BOM, line terminators), nothing else. */
export function edTrim(): string[] {
  const odd = edStr("  ﻿ \t x \n\r　 ");
  const keep = edStr("​x​");
  return [
    `[${odd.trim()}] ${odd.trim().length} ${odd.trimStart().length} ${odd.trimEnd().length}`,
    `${keep.trim().length} [${" \n ".trim()}] ${"᠎".trim().length} ${"\u0085".trim().length}`,
  ];
}

/** Templates and string conversion of every value kind. */
export function edTemplates(): string[] {
  const n: number | null = null;
  const u: string | undefined = undefined;
  const xs = [1, 2.5, -0];
  const words = ["a", "", "c"];
  const nested: number[][] = [[1, 2], [], [3]];
  const flags = [true, false];
  const big = 12345678901234567890n;
  return [
    `${n} ${u} ${true} ${false} ${xs.join()} ${words.join()} ${nested.length} ${flags.join()} ${big} ${-0}`,
    `${String(n)} ${String(u)} ${String(1e21)} ${String(0.1)} ${String(true)} ${"" + 5} ${5 + "" + 5} ${1 + 2 + "3"} ${"1" + 2 + 3}`,
    `${`a${`b${`c`}`}`} ${`A\x42\u{1F600}`} ${`line1
line2`.split("\n").length} ${`\``} ${"\\"} ${`$`}{} ${`$${1}`}`,
  ];
}

/** Text algorithms over UTF-16 units: palindromes, anagrams, run-length, KMP, word counts. */
export function edTextAlgos(): string[] {
  const isPalindrome = (s: string): boolean => {
    const t = s.toLowerCase().split("").filter((c) => (c >= "a" && c <= "z") || (c >= "0" && c <= "9")).join("");
    return t === t.split("").reverse().join("");
  };
  const anagramKey = (s: string): string => s.toLowerCase().split("").sort().join("");
  const rle = (s: string): string => {
    let out = "";
    let i = 0;
    while (i < s.length) {
      const c = s.slice(i, i + 1);
      let j = i;
      while (j < s.length && s.slice(j, j + 1) === c) j++;
      out += `${j - i}${c}`;
      i = j;
    }
    return out;
  };
  const unrle = (s: string): string => {
    let out = "";
    let count = "";
    for (const c of s.split("")) {
      if (c >= "0" && c <= "9") count += c;
      else {
        out += c.repeat(Number(count));
        count = "";
      }
    }
    return out;
  };
  const kmp = (text: string, pat: string): number[] => {
    const t = text.split("");
    const p = pat.split("");
    const fail: number[] = [0];
    let k = 0;
    for (let i = 1; i < p.length; i++) {
      while (k > 0 && p[i] !== p[k]) k = fail[k - 1]!;
      if (p[i] === p[k]) k++;
      fail.push(k);
    }
    const hits: number[] = [];
    k = 0;
    for (let i = 0; i < t.length; i++) {
      while (k > 0 && t[i] !== p[k]) k = fail[k - 1]!;
      if (t[i] === p[k]) k++;
      if (k === p.length) {
        hits.push(i - p.length + 1);
        k = fail[k - 1]!;
      }
    }
    return hits;
  };
  const groups: Record<string, string[]> = {};
  for (const w of ["listen", "silent", "enlist", "google", "gooegl", "cat", "act", "tac", "dog"]) {
    const key = anagramKey(w);
    groups[key] = [...(groups[key] ?? []), w];
  }
  const counts: Record<string, number> = {};
  for (const w of "the cat and the hat and the bat".split(" ")) counts[w] = (counts[w] ?? 0) + 1;
  return [
    `${isPalindrome("A man, a plan, a canal: Panama")} ${isPalindrome("race a car")} ${isPalindrome("")} ${isPalindrome("Was it a car or a cat I saw?")}`,
    Object.keys(groups).map((k) => `${k}=${groups[k]!.join("/")}`).join(" "),
    `${rle("aaabccddddde")} ${rle("")} ${rle("x")} ${unrle(rle("wwwwwwwwwwwwbbbx"))} ${rle("aa€€é")}`,
    `${kmp("abababcabababcab", "ababc").join(",")} ${kmp("aaaaa", "aa").join(",")} ${kmp("abc", "d").length} ${kmp("😀a😀a", "😀a").join(",")}`,
    Object.keys(counts).map((w) => `${w}:${counts[w]!}`).join(" "),
  ];
}
