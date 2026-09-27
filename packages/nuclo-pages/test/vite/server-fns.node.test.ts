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

describe("page and layout definitions", () => {
  const PAGE = "src/pages/todos.ts";
  const pid = (name: string) => JSON.stringify(serverFnId(PAGE, name));
  const runPage = (code: string, target: "client" | "server", dev = false) => transformServerFns(code, `/app/${PAGE}`, PAGE, target, dev);
  const compile = (code: string, target: "client" | "server", dev = false) => {
    const result = runPage(code, target, dev);
    if (!result || "error" in result) throw new Error(`expected code, got ${JSON.stringify(result)}`);
    expect(parseSync("out.js", result.code).errors).toEqual([]);
    return result.code;
  };
  const pageError = (code: string) => {
    const result = runPage(code, "client");
    if (!result || !("error" in result)) throw new Error("expected an error");
    expect(runPage(code, "server")).toEqual(result);
    return result.error;
  };
  const IMPORT = 'import { Page } from "nuclo-pages";';

  const source = [
    IMPORT,
    'import { db } from "../server/db";',
    'import { format } from "../lib/format";',
    "const SECRET = process.env.SECRET;",
    "export default Page({",
    "  prerender: false,",
    "  load: async () => db.todos(SECRET),",
    '  head: () => ({ title: format("Todos") }),',
    "  actions: {",
    "    add: async (text) => db.add(text),",
    "    async clear() { await db.clear(SECRET); },",
    '    "remove-all": () => db.removeAll(),',
    "  },",
    '  render: ({ data, actions }) => div(format(data.length), button({ onClick: () => actions.add("x") })),',
    "});",
  ].join("\n");

  it("client: load and actions become RPC stubs, and what only they used is removed", () => {
    const out = compact(compile(source, "client"));
    expect(out).toContain(`load: __rpc(${pid("load")}),`);
    expect(out).toContain(`add: __rpc(${pid("actions.add")}),`);
    expect(out).toContain(`clear: __rpc(${pid("actions.clear")}),`);
    expect(out).toContain(`"remove-all": __rpc(${pid("actions.remove-all")}),`);
    expect(out).not.toMatch(/\bdb\b|SECRET|process\.env/);
    // head and render run in the browser: what they use stays.
    expect(out).toContain('import { format } from "../lib/format";');
    expect(out).toContain(IMPORT);
    expect(out).toContain("prerender: false,");
    expect(out).toContain("render: ({ data, actions }) =>");
  });

  it("client: names them in dev", () => {
    expect(compile(source, "client", true)).toContain(`load: __rpc(${pid("load")}, "${PAGE}#load")`);
  });

  it("server: registers load and actions in place, turning methods into functions", () => {
    const out = compile(source, "server");
    expect(out).toContain(`load: __serverFn(${pid("load")}, async () => db.todos(SECRET)),`);
    expect(out).toContain(`add: __serverFn(${pid("actions.add")}, async (text) => db.add(text)),`);
    expect(out).toContain(`clear: __serverFn(${pid("actions.clear")}, async function () { await db.clear(SECRET); }),`);
    expect(out).toContain(`"remove-all": __serverFn(${pid("actions.remove-all")}, () => db.removeAll()),`);
    expect(out).toContain('import { db } from "../server/db";');
    expect(out).toContain('import { __serverFn } from "nuclo-pages/server";');
  });

  it("keeps every line number", () => {
    const client = compile(source, "client").split("\n");
    const server = compile(source, "server").split("\n");
    const at = (lines: string[], text: string) => lines.findIndex((line) => line.includes(text));
    for (const lines of [client, server]) {
      expect(at(lines, "prerender: false")).toBe(5);
      expect(at(lines, "render: ({ data, actions })")).toBe(13);
    }
  });

  it("compiles a page written the documented way", () => {
    const code = `${IMPORT}
import { listTodos } from "../server/todos";

export default Page({
    prerender: true,
    load: async () => listTodos(),
    head: () => ({ title: "Life at Nuclo" }),
    actions: {
        clearCompleted: () => {
            // action to clear completed todos
        }
    },
    render: ({ data }) => {
        const completed = data.filter((todo) => todo.done).length;
        return section(h1("Life at Nuclo"), p(\`\${completed} completed of \${data.length} total\`));
    }
});
`;
    const browser = compile(code, "client");
    expect(compact(browser)).toContain(`load: __rpc(${pid("load")}),`);
    expect(compact(browser)).toContain(`clearCompleted: __rpc(${pid("actions.clearCompleted")})`);
    expect(browser).not.toMatch(/listTodos|action to clear/);
    expect(browser).toContain("const completed = data.filter((todo) => todo.done).length;");
    const onServer = compile(code, "server");
    expect(onServer).toContain(`load: __serverFn(${pid("load")}, async () => listTodos()),`);
    expect(onServer).toContain(`clearCompleted: __serverFn(${pid("actions.clearCompleted")}, () => {`);
    expect(onServer).toContain('import { listTodos } from "../server/todos";');
    for (const out of [browser, onServer]) expect(out.split("\n").findIndex((line) => line.includes("render: ({ data })"))).toBe(12);
  });

  it("handles layouts, renamed imports and $server functions in the same file", () => {
    const code = [
      'import { Layout as L, route } from "nuclo-pages";',
      'import { session } from "../server/session";',
      "export const whoami = $server(async () => session().user);",
      "export default L({ load: () => session(), render: ({ children }) => div(route.url.pathname, children) });",
    ].join("\n");
    const out = compact(compile(code, "client"));
    expect(out).toContain(`export const whoami = __rpc(${pid("whoami")});`);
    expect(out).toContain(`load: __rpc(${pid("load")})`);
    expect(out).not.toContain("session");
    expect(serverFnIds(code, `/app/${PAGE}`, PAGE)).toEqual([serverFnId(PAGE, "whoami"), serverFnId(PAGE, "load")]);
  });

  it("lists the ids of load and actions", () => {
    expect(serverFnIds(source, `/app/${PAGE}`, PAGE)).toEqual(["load", "actions.add", "actions.clear", "actions.remove-all"].map((name) => serverFnId(PAGE, name)));
  });

  it("leaves error views, pages without server parts and other modules alone", () => {
    expect(runPage('import { ErrorPage } from "nuclo-pages";\nexport default ErrorPage({ render: () => div() });', "client")).toBeNull();
    expect(runPage(`${IMPORT}\nexport default Page({ head: () => ({}), render: () => div() });`, "client")).toBeNull();
    expect(runPage('import { route } from "nuclo-pages";\nexport const path = () => route.url.pathname;', "client")).toBeNull();
    expect(runPage('import type { Page } from "nuclo-pages";\nexport const x = 1;', "client")).toBeNull();
  });

  it("rejects definitions that could hide server code", () => {
    expect(pageError(`${IMPORT}\nconst page = Page({ render });\nexport default page;`)).toMatch(/Page\(\) must be the default export.*:2\)/);
    expect(pageError(`${IMPORT}\nexport default Page(definition);`)).toMatch(/takes an object literal/);
    expect(pageError(`${IMPORT}\nexport default Page({ ...base, render });`)).toMatch(/without spreads or computed keys/);
    expect(pageError(`${IMPORT}\nexport default Page({ ["load"]: () => 1, render });`)).toMatch(/without spreads or computed keys/);
    expect(pageError(`${IMPORT}\nexport default Page({ load: loadTodos, render });`)).toMatch(/load must be an inline function/);
    expect(pageError(`${IMPORT}\nexport default Page({ load, render });`)).toMatch(/load must be an inline function/);
    expect(pageError(`${IMPORT}\nexport default Page({ get load() { return x; }, render });`)).toMatch(/load must be an inline function/);
    expect(pageError(`${IMPORT}\nexport default Page({ actions: shared, render });`)).toMatch(/actions must be an object of inline functions/);
    expect(pageError(`${IMPORT}\nexport default Page({ actions: { save: saveTodo }, render });`)).toMatch(/actions must be an object of inline functions/);
    expect(pageError(`${IMPORT}\nexport default Page({ actions: { ...others }, render });`)).toMatch(/actions must be an object of inline functions/);
  });
});
