// The smallest check that fails if the parser/serializer break: `bun src/css.check.ts`
import assert from "node:assert/strict";
import { classesOf, fuzzyScore, joinSides, nudge, parse, parseLen, serialize, smartValue, splitSides, toSelector, tokenize, withUnit } from "./css.ts";

const src = `/* hi */\n.btn, .x:hover {\n  color: red !important;\n  background: url("a;b}c") no-repeat;\n  --Custom: 1 }\n.btn{color:blue}`;
const r = parse(src);
assert.equal(r.error, null);
assert.equal(r.rules.length, 2);
assert.deepEqual(r.rules[0].decls[0], { prop: "color", value: "red", important: true });
assert.equal(r.rules[0].decls[1].value, 'url("a;b}c") no-repeat');
assert.equal(r.rules[0].decls[2].prop, "--Custom");

// errors carry a line number
assert.equal(parse(".a {\n  color red }").error, 'Line 2: expected "property: value", got "color red"');
assert.match(String(parse("@media (x) {}").error), /at-rules/);
assert.match(String(parse(".a {").error), /missing closing/);
assert.match(String(parse(".a { color: red; }}").error), /unexpected "}"/);
assert.match(String(parse(".a { .b { } }").error), /nested/);

// duplicate selectors merge, later wins; !important beats a later plain value
assert.deepEqual(parse(".a{color:red}.a{color:blue;margin:0}").rules.map((x) => x.decls.map((d) => d.value)), [["blue", "0"]]);
assert.equal(parse(".a{color:red!important;color:blue}").rules[0].decls[0].value, "red");

// round trip
assert.deepEqual(parse(serialize(r.rules)).rules, r.rules);
assert.equal(serialize([{ selector: ".e", decls: [] }]), ".e {\n}\n");

// tokenizer is lossless and classifies by position
const code = ".a:hover{color:red; background:url(http://x)}/*c*/";
assert.equal(tokenize(code).map((t) => t.text).join(""), code);
assert.deepEqual(tokenize(".a{color:red}/*c*/").map((t) => t.kind), ["sel", "punct", "prop", "punct", "val", "punct", "comment"]);
assert.deepEqual(tokenize(code).filter((t) => t.text === ":").map((t) => t.kind), ["sel", "punct", "punct", "val"]);

// sides
assert.deepEqual(splitSides("8px 16px"), ["8px", "16px", "8px", "16px"]);
assert.deepEqual(splitSides("1px 2px 3px"), ["1px", "2px", "3px", "2px"]);
assert.equal(joinSides(["8px", "16px", "8px", "16px"]), "8px 16px");
assert.equal(joinSides(["1px", "2px", "3px", "2px"]), "1px 2px 3px");
assert.equal(joinSides(["", "auto", "", "auto"]), "0 auto");
assert.equal(joinSides(["", "", "", ""]), "");
assert.equal(splitSides("calc(1px + 2px)"), null);

// lengths
assert.deepEqual(parseLen("-1.5rem"), { n: -1.5, unit: "rem" });
assert.deepEqual(parseLen(".5"), { n: 0.5, unit: "" });
assert.equal(parseLen("auto"), null);
assert.equal(nudge("9px", 1), "10px");
assert.equal(nudge("auto", 1), "auto");
assert.equal(withUnit("12", "px"), "12px");
assert.equal(withUnit("0", "px"), "0");
assert.equal(withUnit("1.5", ""), "1.5");
assert.equal(classesOf(".btn.primary:hover, .x"), "btn primary");

// fuzzy: prefix > substring > subsequence, shorter wins ties
const rank = (q: string, xs: string[]) => [...xs].sort((a, b) => fuzzyScore(q, b) - fuzzyScore(q, a));
assert.deepEqual(rank("pad", ["padding-top", "padding", "backdrop-filter"]), ["padding", "padding-top", "backdrop-filter"]);
assert.deepEqual(rank("fs", ["font-style", "font-size", "flex-shrink"])[0], "font-size");
assert.equal(fuzzyScore("xyz", "padding"), 0);
assert.equal(fuzzyScore("", "anything"), 1);
assert.ok(fuzzyScore("bgc", "background-color") > 0);

// smart values and selectors
assert.equal(smartValue("padding", "24"), "24px");
assert.equal(smartValue("font-size", "1.25", "rem"), "1.25rem");
assert.equal(smartValue("opacity", "0.5"), "0.5");
assert.equal(smartValue("z-index", "10"), "10");
assert.equal(smartValue("--gap", "4"), "4");
assert.equal(smartValue("width", "auto"), "auto");
assert.equal(toSelector("btn"), ".btn");
assert.equal(toSelector(" .btn:hover "), ".btn:hover");
assert.equal(toSelector("card  .title"), ".card .title");
assert.equal(toSelector(":focus", ".btn, .x"), ".btn:focus");
assert.equal(toSelector(""), "");

console.log("css.check ok");
