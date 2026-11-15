/**
 * The wasm target's `native` module. On the other targets the app's platform code is written in the
 * platform's language and copied in; on the web host it is TypeScript for the DOM, the same
 * `native/web/index.ts` the `web` target runs, and the page runs it. What it needs from Rust is the
 * glue, and it is generated from the types the app already wrote:
 *
 *   native<P>("Name")      a Rust `Name` that makes the page's component, and on every update sends it
 *                          `P` as JSON (a function prop as a number the page turns into a function
 *                          that calls back, with its arguments as JSON)
 *   declare function f()   a Rust `f` that calls the page's function of that name with JSON arguments
 *                          and decodes what it returns (a promise, for an async declaration)
 *
 * Arguments, props and results are the JSON types: numbers, strings, booleans, optionals, arrays,
 * and (results only) the app's interfaces.
 */
import type { ClassDecl, FnDecl, Program, Ty } from "./ir.ts";

const rustType = (ty: Ty, what: string): string => {
  switch (ty.k) {
    case "int": return "i64";
    case "double": return "f64";
    case "string": return "String";
    case "bool": return "bool";
    case "void": return "()";
    case "optional": return `Option<${rustType(ty.of, what)}>`;
    case "array": return `Arr<${rustType(ty.of, what)}>`;
    case "class": return `Rc<${ty.name}>`;
    default: throw new Error(`wasm: ${what} has a type the page can't be given: use numbers, strings, booleans, optionals and arrays.`);
  }
};

/** A Rust expression for the JSON of `value`. */
const encode = (ty: Ty, value: string, what: string): string => {
  switch (ty.k) {
    case "int":
    case "double":
    case "string":
    case "bool":
      return `Json::from(${value})`;
    case "optional": return `match ${value} { Some(x) => ${encode(ty.of, "x", what)}, None => Json::Null }`;
    case "array": return `Json::Array(${value}.to_vec().into_iter().map(|x| ${encode(ty.of, "x", what)}).collect())`;
    default: throw new Error(`wasm: ${what} has a type that can't be sent to the page as JSON: use numbers, strings, booleans, optionals and arrays.`);
  }
};

/** A Rust `Result<T, JsError>` expression for the value `json` (a `&Json`) holds. */
const decode = (ty: Ty, json: string, what: string, classes: ClassDecl[]): string => {
  switch (ty.k) {
    case "int": return `json::int(${json})`;
    case "double": return `json::double(${json})`;
    case "string": return `json::string(${json})`;
    case "bool": return `json::bool(${json})`;
    case "optional": return `json::optional(${json}, |j| ${decode(ty.of, "j", what, classes)})`;
    case "array": return `json::array(${json}, |j| ${decode(ty.of, "j", what, classes)})`;
    case "class": {
      if (!classes.find((c) => c.name === ty.name)?.decodable) throw new Error(`wasm: ${what} has the interface ${ty.name}, which can't be read from JSON (every field needs a JSON type).`);
      return `${ty.name}::from_json(${json})`;
    }
    default: throw new Error(`wasm: ${what} has a type that can't be read from the page's JSON: use numbers, strings, booleans, optionals, arrays and the app's interfaces.`);
  }
};

/** What a call returns when the page fails it: the error is logged, and the app goes on with an empty value. */
const fallback = (ty: Ty, what: string): string => {
  switch (ty.k) {
    case "array": return "Arr::new()";
    case "class": return `panic!(${JSON.stringify(`${what} failed`)})`;
    default: return "Default::default()";
  }
};

const logged = "{ console_log(&[&js_error_message(&e)]); ";

function component(name: string, props: ClassDecl, classes: ClassDecl[]): string {
  const sets: string[] = [];
  let callbacks = 0;
  for (const field of props.fields) {
    const what = `${props.name}.${field.name}`;
    const target = field.ty.k === "optional" ? field.ty.of : field.ty;
    if (target.k !== "fn") {
      sets.push(`        json.set(${JSON.stringify(field.name)}, ${encode(field.ty, `props.${field.name}.get()`, what)});`);
      continue;
    }
    if (target.ret.k !== "void") throw new Error(`wasm: ${what} is a function the page calls, and it can't return a value.`);
    const args = target.params.map((param, at) => `${decode(param, `args.get(${at}).unwrap_or(&Json::Null)`, `an argument of ${what}`, classes)}?`);
    const call = `f(${args.join(", ")})`;
    const body = field.ty.k === "optional" ? `if let Some(f) = p.${field.name}.get() { ${call}; }` : `let f = p.${field.name}.get(); ${call};`;
    sets.push(`        {
            let p = props.clone();
            json.callback(${callbacks++}, ${JSON.stringify(field.name)}, Rc::new(move |args: &[Json]| {
                let run = || -> Result<(), JsError> { ${body} Ok(()) };
                if let Err(e) = run() ${logged}}
            }));
        }`);
  }
  return `#[derive(Default)]
pub struct ${name};

impl NativeComponent<${props.name}> for ${name} {
    fn create(&mut self) -> NativeView {
        host::create(${JSON.stringify(name)})
    }

    fn update(&mut self, view: &NativeView, props: &Rc<${props.name}>) {
        let mut json = host::Props::new(view);
${sets.join("\n")}
        json.send();
    }

    fn destroy(&mut self, view: &NativeView) {
        host::destroy(view);
    }
}
`;
}

function native(fn: FnDecl, classes: ClassDecl[]): string {
  const what = `${fn.name}()`;
  const params = fn.params.map((param, at) => `a${at}: ${rustType(param.ty, `a parameter of ${what}`)}`);
  const args = fn.params.map((param, at) => encode(param.ty, `a${at}`, `a parameter of ${what}`));
  const call = fn.async ? `host_call(${JSON.stringify(fn.name)}, vec![${args.join(", ")}]).await` : `host_call_sync(${JSON.stringify(fn.name)}, vec![${args.join(", ")}])`;
  const head = `pub ${fn.async ? "async " : ""}fn ${fn.name}(${params.join(", ")})`;
  if (fn.ret.k === "void") return `${head} {\n    if let Err(e) = ${call} ${logged}}\n}\n`;
  const result = decode(fn.ret, "&j", what, classes);
  return `${head} -> ${rustType(fn.ret, `the result of ${what}`)} {
    match ${call}.and_then(|j| ${result}) {
        Ok(value) => value,
        Err(e) => {
            console_log(&[&js_error_message(&e)]);
            ${fallback(fn.ret, what)}
        }
    }
}
`;
}

/** The Rust source of the wasm target's `src/native/mod.rs`. */
export function emitWasmNative(program: Program): string {
  const parts = (program.components ?? []).map(({ name, props }) => {
    const cls = program.classes.find((c) => c.name === props);
    if (!cls) throw new Error(`wasm: the props of ${name} are not an interface of the app.`);
    return component(name, cls, program.classes);
  });
  for (const fn of program.natives ?? []) parts.push(native(fn, program.classes));
  return `// Generated by nuclo-native-ts for the wasm host: the Rust glue to the app's native/ code, which is
// TypeScript run by the page (native/wasm/index.ts, or the native/web/index.ts of the web target).
#![allow(non_snake_case, unused)]

use crate::app::*;
use crate::nuclo::prelude::*;
use crate::web_backend::platform as host;

${parts.join("\n")}`;
}
