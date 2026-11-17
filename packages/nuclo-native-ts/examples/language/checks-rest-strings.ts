// Remaining rejected constructs (rest): strings indexed and iterated as JavaScript does.
// `s[i]` gives the UTF-16 unit (undefined out of range); for-of / spread / Array.from give code points.

export function rsStringIndex(): string[] {
  const out: string[] = [];
  const s = "héllo😀!";
  out.push(`${s[0]} ${s[1]} ${s[4]} ${s[s.length - 1]}`);
  out.push(`${s[99] ?? "none"} ${s[-1] ?? "neg"} ${s[1.5] ?? "frac"} ${s.length}`);
  let rev = "";
  for (let i = s.length - 1; i >= 0; i--) if (s[i] !== "😀") rev += s[i] === "l" ? "L" : (s[i]!.charCodeAt(0) < 0xd800 ? s[i] : "?");
  out.push(rev);
  const word = "abcba";
  let pal = true;
  for (let i = 0; i < word.length / 2; i++) if (word[i] !== word[word.length - 1 - i]) pal = false;
  out.push(`palindrome ${pal}`);
  const maybe: string | undefined = word.length > 3 ? word : undefined;
  out.push(`${maybe?.[2] ?? "-"} ${maybe?.[9] ?? "-"}`);
  const counts: Record<string, number> = {};
  for (let i = 0; i < word.length; i++) counts[word[i]!] = (counts[word[i]!] ?? 0) + 1;
  out.push(JSON.stringify(counts));
  return out;
}

export function rsStringIter(): string[] {
  const out: string[] = [];
  const s = "a€😀b";
  const cps: string[] = [];
  for (const c of s) cps.push(c);
  out.push(`${cps.length} ${cps.join("|")}`);
  const spread = [...s];
  out.push(`${spread.length} ${spread.reverse().join("")}`);
  const from = Array.from("xy😀");
  out.push(`${from.length} ${from.join(",")}`);
  const upper = Array.from("abc", (c) => c.toUpperCase());
  out.push(upper.join(""));
  const indexed = Array.from("ab", (c, i) => `${i}${c}`);
  out.push(indexed.join(" "));
  let vowels = 0;
  for (const ch of "programming language") {
    if (ch === " ") continue;
    if ("aeiou".includes(ch)) vowels++;
  }
  out.push(`vowels ${vowels}`);
  const mixed = ["<", ...s, ">"];
  out.push(mixed.join(""));
  out.push(`${[..."" ].length}`);
  const fns: (() => string)[] = [];
  for (const c of "pq") fns.push(() => c + c);
  out.push(fns.map((f) => f()).join(","));
  return out;
}
