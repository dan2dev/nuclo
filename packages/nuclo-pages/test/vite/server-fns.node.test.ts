// @vitest-environment node
import { parseSync } from "vite";
import { describe, expect, it } from "vitest";
import { serverFnId, serverFnIds, transformServerFns } from "../../src/vite/server-fns";

const REL = "src/server/posts.ts";
const run = (code: string, target: "client" | "server", dev = false) => transformServerFns(code, `/app/${REL}`, REL, target, dev);
const client = (code: string, dev = false) => {
  const result = run(code, "client", dev);
  if (!result || "error" in result) throw new Error(`expected code, got ${JSON.stringify(result)}`);
  expect(parseSync("out.js", result.code).errors).toEqual([]);
  return result.code;
};
const server = (code: string) => {
  const result = run(code, "server");
  if (!result || "error" in result) throw new Error(`expected code, got ${JSON.stringify(result)}`);
  expect(parseSync("out.js", result.code).errors).toEqual([]);
  return result.code;
};
const error = (code: string) => {
  const result = run(code, "client");
  if (!result || !("error" in result)) throw new Error("expected an error");
  expect(run(code, "server")).toEqual(result); // both environments reject the same way
  return result.error;
};
const id = (name: string) => serverFnId(REL, name);
/** Code without blank lines, for readable comparisons. */
const compact = (code: string) => code.split("\n").filter((line) => line.trim()).join("\n");

describe("serverFnId", () => {
  it("is a stable 12-character hash of file and binding", () => {
    expect(serverFnId(REL, "getPost")).toMatch(/^[0-9a-f]{12}$/);
    expect(serverFnId(REL, "getPost")).toBe(serverFnId(REL, "getPost"));
    expect(serverFnId(REL, "getPost")).not.toBe(serverFnId(REL, "getPosts"));
    expect(serverFnId(REL, "getPost")).not.toBe(serverFnId("src/other.ts", "getPost"));
  });

  it("serverFnIds lists the ids of valid declarations only", () => {
    const code = "export const a = $server(() => 1);\nconst b = $server(async () => 2);";
    expect(serverFnIds(code, "/app/x.ts", REL)).toEqual([id("a"), id("b")]);
    expect(serverFnIds("const x = 1;", "/app/x.ts", REL)).toEqual([]);
    expect(serverFnIds("let a = $server(() => 1);", "/app/x.ts", REL)).toEqual([]);
    expect(serverFnIds("export const a = $server(", "/app/x.ts", REL)).toEqual([]);
  });
});

describe("server environment", () => {
  it("registers the function by id and leaves the module intact", () => {
    const code = `import { db } from "./db";\nexport const getPost = $server(async (slug) => db.get(slug));`;
    expect(server(code)).toBe(
      `import { db } from "./db";\nexport const getPost = __serverFn(${JSON.stringify(id("getPost"))}, async (slug) => db.get(slug));\nimport { __serverFn } from "nuclo-pages/server";\n`,
    );
  });

  it("handles function expressions, comments and several declarations", () => {
    const out = server(`const a = $server /* c */ (function named() { return 1; }), b = 2;\nexport const c = $server(() => a());`);
    expect(out).toContain(`const a = __serverFn /* c */ (${JSON.stringify(id("a"))}, function named() { return 1; }), b = 2;`);
    expect(out).toContain(`export const c = __serverFn(${JSON.stringify(id("c"))}, () => a());`);
  });
});

describe("client environment", () => {
  it("replaces the call with an RPC stub and drops server-only code", () => {
    const code = [
      `import { db } from "./db";`,
      `import { sql } from "sql-lib";`,
      `const query = (slug) => sql\`select \${slug}\`;`,
      `export const getPost = $server(async (slug) => db.run(query(slug)));`,
    ].join("\n");
    expect(compact(client(code))).toBe(`export const getPost = __rpc(${JSON.stringify(id("getPost"))});\nimport { __rpc } from "nuclo-pages/client";`);
  });

  it("names the function in dev", () => {
    expect(client("export const getPost = $server(() => 1);", true)).toContain(`__rpc(${JSON.stringify(id("getPost"))}, "${REL}#getPost")`);
  });

  it("keeps every original line number", () => {
    const code = [
      `import { db } from "./db";`,
      `export const save = $server(async (value) => {`,
      `  await db.save(value);`,
      `  return true;`,
      `});`,
      `export const marker = "line 6";`,
    ].join("\n");
    const lines = client(code).split("\n");
    expect(lines[5]).toBe(`export const marker = "line 6";`);
    expect(lines[1]).toBe(`export const save = __rpc(${JSON.stringify(id("save"))})`);
  });

  it("keeps what client code still uses", () => {
    const code = [
      `import { format, secret } from "./utils";`,
      `import { shared } from "./shared";`,
      `const helper = () => shared();`,
      `export const label = (x) => format(x) + helper();`,
      `export const load = $server(() => secret(format(shared())));`,
    ].join("\n");
    const out = compact(client(code));
    expect(out).toContain(`import { format } from "./utils";`);
    expect(out).toContain(`import { shared } from "./shared";`);
    expect(out).toContain("const helper = () => shared();");
    expect(out).not.toContain("secret");
  });

  it("removes private helpers transitively, keeps exported ones", () => {
    const code = [
      `import { a } from "./a";`,
      `import { b } from "./b";`,
      `import { c } from "./c";`,
      `function inner() { return a(); }`,
      `class Outer { run() { return inner() + b(); } }`,
      `export function exported() { return c(); }`,
      `export const fn = $server(() => new Outer().run() + exported());`,
    ].join("\n");
    const out = compact(client(code));
    expect(out).not.toMatch(/\ba\(|"\.\/a"|"\.\/b"|inner|Outer/);
    expect(out).toContain(`import { c } from "./c";`);
    expect(out).toContain("export function exported() { return c(); }");
  });

  it("rewrites partially used imports, keeping defaults, aliases, string names and attributes", () => {
    const code = [
      `import def, { a, b as c, "x-y" as xy } from "./m";`,
      `import data, { rows } from "./data.json" with { type: "json" };`,
      `import * as ns from "./ns";`,
      `export const view = () => [def, c, xy, data];`,
      `export const fn = $server(() => [a(), rows, ns.x]);`,
    ].join("\n");
    const out = compact(client(code));
    expect(out).toContain(`import def, { b as c, "x-y" as xy } from "./m";`);
    expect(out).toContain(`import data from "./data.json" with { type: "json" };`);
    expect(out).not.toContain("./ns");
  });

  it("keeps side-effect imports and top-level statements", () => {
    const code = [`import "./polyfill";`, `import { log } from "./log";`, `log("module loaded");`, `export const fn = $server(() => log("server"));`].join("\n");
    const out = compact(client(code));
    expect(out).toContain(`import "./polyfill";`);
    expect(out).toContain(`import { log } from "./log";`);
    expect(out).toContain(`log("module loaded");`);
  });

  it("keeps names exported through export lists or export default", () => {
    const code = [`import { a } from "./a";`, `import { b } from "./b";`, `const x = a;`, `const y = b;`, `export { x };`, `export default y;`, `export const fn = $server(() => [x, y]);`].join("\n");
    const out = compact(client(code));
    expect(out).toContain(`import { a } from "./a";`);
    expect(out).toContain(`import { b } from "./b";`);
  });

  it("removes destructured declarations only when no name is used", () => {
    const code = [`import { cfg } from "./cfg";`, `const { host, port } = cfg;`, `const { key, other } = cfg;`, `export const url = () => host;`, `export const fn = $server(() => [port, key, other]);`].join("\n");
    const out = compact(client(code));
    expect(out).toContain("const { host, port } = cfg;");
    expect(out).not.toContain("key");
  });

  it("is conservative with shadowed names (keeps the import)", () => {
    const code = [`import { db } from "./db";`, `export const view = () => { const db = 1; return db; };`, `export const fn = $server(() => db.x);`].join("\n");
    expect(client(code)).toContain(`import { db } from "./db";`);
  });

  it("handles several server functions, calling each other", () => {
    const code = [
      `import { db } from "./db";`,
      `const helper = $server(() => db.one());`,
      `export const main = $server(async () => (await helper()) + 1);`,
    ].join("\n");
    const out = compact(client(code));
    expect(out).toBe(
      `const helper = __rpc(${JSON.stringify(id("helper"))});\nexport const main = __rpc(${JSON.stringify(id("main"))});\nimport { __rpc } from "nuclo-pages/client";`,
    );
  });

  it("computes offsets correctly after non-ASCII text", () => {
    const out = client(`const título = "ñandú 🚀";\nexport const fn = $server(() => 1);\nexport const t = título;`);
    expect(out).toContain(`export const fn = __rpc(${JSON.stringify(id("fn"))});`);
    expect(out).toContain(`const título = "ñandú 🚀";`);
  });
});

describe("what is not transformed", () => {
  it("returns null without server functions", () => {
    expect(run("export const x = 1;", "client")).toBeNull();
    expect(run(`const s = "$server(() => 1)";`, "client")).toBeNull(); // only in a string
    expect(run("api.$server(() => 1); const o = { $server: 1 };", "client")).toBeNull(); // property names
  });

  it("returns null for code that doesn't parse (Vite reports it)", () => {
    expect(run("export const fn = $server(() => {", "client")).toBeNull();
  });
});

describe("misuse", () => {
  it("requires a top-level const", () => {
    expect(error("let fn = $server(() => 1);")).toMatch(/must initialize a top-level const.*\(src\/server\/posts\.ts:1\)/);
    expect(error("var fn = $server(() => 1);")).toMatch(/top-level const/);
    expect(error("const [fn] = $server(() => 1);")).toMatch(/top-level const/);
  });

  it("requires exactly one inline function", () => {
    const handler = "function handler() {}";
    expect(error(`${handler}\nconst fn = $server(handler);`)).toMatch(/exactly one inline function.*:2\)/);
    expect(error("const fn = $server();")).toMatch(/exactly one inline function/);
    expect(error("const fn = $server(() => 1, () => 2);")).toMatch(/exactly one inline function/);
  });

  it("rejects $server anywhere else", () => {
    expect(error("export default $server(() => 1);")).toMatch(/can only initialize a top-level const/);
    expect(error("function f() {\n  const inner = $server(() => 1);\n}")).toMatch(/:2\)/);
    expect(error("export const api = { get: $server(() => 1) };")).toMatch(/top-level const/);
    expect(error("const alias = $server;")).toMatch(/top-level const/);
    expect(error("const ok = $server(() => 1);\nconst fns = [$server(() => 2)];")).toMatch(/:2\)/);
  });
});
