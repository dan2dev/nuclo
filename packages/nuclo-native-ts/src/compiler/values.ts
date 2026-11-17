/**
 * Value classes: a class whose objects nobody can tell apart from copies is printed as a Swift `struct` (no heap
 * allocation, no reference counting). JavaScript can tell an object from a copy only through its identity or through a
 * write one alias sees and another doesn't, so a class qualifies when the program, conservatively:
 * - never writes a field of one after its constructor (only `this.x = …` directly in its own constructor / field
 *   initializers, where `this` is used for nothing but reading and writing its fields: no method call, no closure);
 * - never compares one by identity (`===`, `!==`, `==`, `!=` other than with `null` / `undefined`, `indexOf`,
 *   `lastIndexOf`, `includes`, `Object.is`, `instanceof`), uses none as a Map / Set / WeakMap / WeakSet / WeakRef key, never
 *   throws one;
 * - never passes one where its type is forgotten (a slot typed `object`, `unknown`, an interface, …), to a generic
 *   function or class of the app (which could compare it) or to the nuclo API (`list()` keys items by identity);
 * - is a plain class: no `extends` / `implements`, not extended, not abstract, not generic, no setter, not tracked by the
 *   cycle collector, not held through a weak field, and its fields can't hold another one of itself (a struct can't
 *   contain itself).
 * Kotlin (JVM objects are cheap) and Rust (its small-block pool, alloc.rs) keep these classes as they are.
 */
import ts from "typescript";
import type { ObjectClassDecl, Program, Ty } from "./ir.ts";

/** Sets `value` on the program's classes that qualify. `classes`: each non-generic class's declaration and native name. */
export function markValueClasses(program: Program, checker: ts.TypeChecker, files: readonly ts.SourceFile[], classes: { node: ts.ClassLikeDeclaration; name: string }[]): void {
  const decls = new Map((program.objectClasses ?? []).map((c) => [c.name, c]));
  const candidates = new Map<ts.Symbol, ObjectClassDecl>();
  const nodeOf = new Map<ts.Symbol, ts.ClassLikeDeclaration>();
  for (const { node, name } of classes) {
    const c = decls.get(name);
    const symbol = node.name ? checker.getSymbolAtLocation(node.name) : (node as ts.Node as { symbol?: ts.Symbol }).symbol;
    if (!c || !symbol || c.base || c.protocols.length || c.open || c.abstract || c.gc || node.typeParameters?.length || node.heritageClauses?.length) continue;
    if (c.methods.some((m) => m.setter) || ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Abstract) continue;
    candidates.set(symbol, c);
    nodeOf.set(symbol, node);
  }
  if (!candidates.size) return;
  const out = new Set<ts.Symbol>();
  const drop = (t: ts.Type | undefined) => {
    for (const s of mentioned(t)) out.add(s);
  };

  /** The candidate classes a type mentions (through unions, type arguments, arrays, function signatures). */
  function mentioned(t: ts.Type | undefined, seen = new Set<ts.Type>()): ts.Symbol[] {
    if (!t || seen.has(t)) return [];
    seen.add(t);
    const found: ts.Symbol[] = [];
    const symbol = t.getSymbol();
    if (symbol && candidates.has(symbol)) found.push(symbol);
    if (t.isUnionOrIntersection()) for (const u of t.types) found.push(...mentioned(u, seen));
    if (t.flags & ts.TypeFlags.Object) {
      const o = t as ts.ObjectType;
      if (o.objectFlags & ts.ObjectFlags.Reference) for (const a of checker.getTypeArguments(o as ts.TypeReference)) found.push(...mentioned(a, seen));
      if (!symbol || !candidates.has(symbol)) {
        for (const sig of [...t.getCallSignatures(), ...t.getConstructSignatures()]) {
          for (const p of sig.parameters) found.push(...mentioned(checker.getTypeOfSymbol(p), seen));
          found.push(...mentioned(sig.getReturnType(), seen));
        }
      }
    }
    return found;
  }

  const isNullish = (e: ts.Expression) => {
    const x = skipParens(e);
    return x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === "undefined") || ts.isVoidExpression(x);
  };
  const isApp = (d: ts.Declaration) => files.includes(d.getSourceFile());
  const ctorOf = (n: ts.Node): ts.Symbol | undefined => {
    // The class whose constructor / field initializer `n` is directly in (no function in between).
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isConstructorDeclaration(p) || ts.isPropertyDeclaration(p)) {
        const cls = p.parent;
        return ts.isClassLike(cls) ? ((cls.name ? checker.getSymbolAtLocation(cls.name) : (cls as ts.Node as { symbol?: ts.Symbol }).symbol)) : undefined;
      }
      if (ts.isFunctionLike(p) || ts.isClassLike(p)) return undefined;
    }
    return undefined;
  };

  for (const sf of files) {
    const visit = (n: ts.Node): void => {
      // A write of a field of one, but its own constructor's `this.x = …`.
      if ((ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n)) && isWriteTarget(n)) {
        const objType = checker.getTypeAtLocation(n.expression);
        const own = n.expression.kind === ts.SyntaxKind.ThisKeyword ? ctorOf(n) : undefined;
        for (const s of mentioned(objType)) if (s !== own) out.add(s);
      }
      // `this` in a constructor: only `this.field` (a property, not a method or accessor).
      if (n.kind === ts.SyntaxKind.ThisKeyword) {
        const cls = thisClass(n);
        if (cls && candidates.has(cls) && isInCtor(n)) {
          const p = n.parent;
          const field = ts.isPropertyAccessExpression(p) && p.expression === n && !(ts.isCallExpression(p.parent) && p.parent.expression === p) && !!(checker.getSymbolAtLocation(p.name)?.flags! & ts.SymbolFlags.Property);
          if (!field || ctorOf(n) !== cls) out.add(cls);
        }
      }
      if (ts.isBinaryExpression(n)) {
        const op = n.operatorToken.kind;
        if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsEqualsToken || op === ts.SyntaxKind.EqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
          if (!isNullish(n.left) && !isNullish(n.right)) {
            drop(checker.getTypeAtLocation(n.left));
            drop(checker.getTypeAtLocation(n.right));
          }
        }
        if (op === ts.SyntaxKind.InstanceOfKeyword) drop(checker.getTypeAtLocation(n.right).getConstructSignatures()[0]?.getReturnType());
      }
      if (ts.isThrowStatement(n) && n.expression) drop(checker.getTypeAtLocation(n.expression));
      if (ts.isCallExpression(n) || ts.isNewExpression(n)) {
        const callee = ts.isCallExpression(n) ? n.expression : n.expression;
        const name = ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;
        const decl = checker.getResolvedSignature(n)?.getDeclaration();
        const args = n.arguments ?? [];
        // Identity searches, Object.is.
        if (name === "indexOf" || name === "lastIndexOf" || name === "includes" || (name === "is" && ts.isIdentifier((callee as ts.PropertyAccessExpression).expression) && ((callee as ts.PropertyAccessExpression).expression as ts.Identifier).text === "Object")) {
          drop(checker.getTypeAtLocation((callee as ts.PropertyAccessExpression).expression));
          for (const a of args) drop(checker.getTypeAtLocation(a));
        }
        // The nuclo API, or a generic function / class of the app.
        const generic = decl && isApp(decl) && (decl.typeParameters?.length || (ts.isClassLike(decl.parent) && decl.parent.typeParameters?.length));
        const api = decl && !isApp(decl) && !decl.getSourceFile().isDeclarationFile;
        if (generic || api || !decl) for (const a of args) drop(checker.getTypeAtLocation(a));
        // A Map / Set / WeakMap / WeakSet / WeakRef keyed by one.
        if (ts.isNewExpression(n)) keyed(checker.getTypeAtLocation(n));
      }
      // Forgotten types: one where the context expects a type that doesn't name it (object, unknown, an interface…).
      if (isValueExpression(n)) {
        const have = mentioned(checker.getTypeAtLocation(n));
        if (have.length) {
          const want = checker.getContextualType(n as ts.Expression);
          if (want && !(want.flags & ts.TypeFlags.TypeParameter) && !mentioned(want).length) for (const s of have) out.add(s);
        }
      }
      if (ts.isIdentifier(n) || ts.isCallExpression(n)) keyed(checker.getTypeAtLocation(n));
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }

  /** A Map / Set / WeakMap / WeakSet / WeakRef type whose key mentions a candidate. */
  function keyed(t: ts.Type, seen = new Set<ts.Type>()) {
    if (seen.has(t)) return;
    seen.add(t);
    if (t.isUnion()) return t.types.forEach((u) => keyed(u, seen));
    const name = t.getSymbol()?.name;
    if (name && ["Map", "Set", "WeakMap", "WeakSet", "WeakRef", "ReadonlyMap", "ReadonlySet"].includes(name) && t.flags & ts.TypeFlags.Object && (t as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) {
      const [key] = checker.getTypeArguments(t as ts.TypeReference);
      drop(key);
    }
  }

  function thisClass(n: ts.Node): ts.Symbol | undefined {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isClassLike(p)) return p.name ? checker.getSymbolAtLocation(p.name) : (p as ts.Node as { symbol?: ts.Symbol }).symbol;
    }
    return undefined;
  }

  /** `this` inside a constructor or a field initializer, at any depth (a closure there counts). */
  function isInCtor(n: ts.Node): boolean {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isConstructorDeclaration(p) || ts.isPropertyDeclaration(p) || ts.isParameterPropertyDeclaration(p, p.parent)) return true;
      if (ts.isMethodDeclaration(p) || ts.isAccessor(p) || ts.isClassLike(p)) return false;
    }
    return false;
  }

  // Weak fields and Map / Set types the IR holds (a key of a candidate's type).
  const irMentions = (ty: Ty | undefined, name: string, seen = new Set<Ty>()): boolean => {
    if (!ty || seen.has(ty)) return false;
    seen.add(ty);
    switch (ty.k) {
      case "class":
        return ty.name === name;
      case "optional":
      case "array":
      case "map":
      case "promise":
        return irMentions(ty.of, name, seen);
      case "union":
        return !!program.unions?.find((u) => u.name === ty.name)?.members.some((m) => irMentions(m.ty, name, seen));
      default:
        return false;
    }
  };
  const keys: Ty[] = [];
  const weak: Ty[] = [];
  walk(program, (o) => {
    if (o.k === "jsmap") keys.push(o.key as Ty);
    if (o.k === "jsset") keys.push(o.of as Ty);
    if (o.weak === true && o.ty) weak.push(o.ty as Ty);
  });
  for (const [symbol, c] of candidates) {
    if (out.has(symbol)) continue;
    if (keys.some((k) => irMentions(k, c.name)) || weak.some((w) => irMentions(w, c.name))) out.add(symbol);
  }

  // A struct can't contain itself: drop candidates whose fields reach a (remaining) candidate's own type again.
  const values = () => [...candidates].filter(([s]) => !out.has(s)).map(([, c]) => c);
  for (let changed = true; changed; ) {
    changed = false;
    const names = new Map(values().map((c) => [c.name, c]));
    for (const c of names.values()) {
      const reaches = (ty: Ty, seen: Set<string>): boolean => {
        if (ty.k === "optional") return reaches(ty.of, seen);
        if (ty.k === "union") return !!program.unions?.find((u) => u.name === ty.name)?.members.some((m) => reaches(m.ty, seen));
        if (ty.k !== "class" || !names.has(ty.name)) return false;
        if (ty.name === c.name) return true;
        if (seen.has(ty.name)) return false;
        seen.add(ty.name);
        return names.get(ty.name)!.fields.some((f) => reaches(f.ty, seen));
      };
      if (c.fields.some((f) => reaches(f.ty, new Set()))) {
        out.add([...candidates].find(([, d]) => d === c)![0]);
        changed = true;
      }
    }
  }
  for (const c of values()) c.value = true;
}

function skipParens(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
  return e;
}

/** A property / element access that is written: assigned (also by destructuring), incremented, deleted, a for-of target. */
function isWriteTarget(n: ts.Expression): boolean {
  let child: ts.Node = n;
  let p = n.parent;
  while (ts.isParenthesizedExpression(p) || ts.isNonNullExpression(p)) [child, p] = [p, p.parent];
  if (ts.isBinaryExpression(p)) return p.left === child && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
  if (ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) return p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken;
  if (ts.isDeleteExpression(p)) return true;
  if ((ts.isForOfStatement(p) || ts.isForInStatement(p)) && p.initializer === child) return true;
  // Inside a destructuring assignment's left side.
  while (ts.isArrayLiteralExpression(p) || ts.isObjectLiteralExpression(p) || ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p) || ts.isSpreadElement(p) || ts.isSpreadAssignment(p)) [child, p] = [p, p.parent];
  return child !== n && ts.isBinaryExpression(p) && p.left === child && p.operatorToken.kind === ts.SyntaxKind.EqualsToken;
}

/** An expression that holds a value something receives (contextual types apply). */
function isValueExpression(n: ts.Node): boolean {
  if (ts.isIdentifier(n)) return !isDeclarationName(n) && !(ts.isPropertyAccessExpression(n.parent) && n.parent.name === n);
  return ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isCallExpression(n) || ts.isNewExpression(n) || ts.isConditionalExpression(n) || n.kind === ts.SyntaxKind.ThisKeyword;
}

function isDeclarationName(n: ts.Identifier): boolean {
  const p = n.parent as ts.Node & { name?: ts.Node };
  return p.name === n || ts.isTypeReferenceNode(p) || ts.isQualifiedName(p) || ts.isPropertyAssignment(p) && p.name === n;
}

/** Every object in the IR (fields of fields, arrays' items). */
function walk(root: unknown, fn: (o: Record<string, unknown>) => void, seen = new Set<unknown>()) {
  if (!root || typeof root !== "object" || seen.has(root)) return;
  seen.add(root);
  if (Array.isArray(root)) return root.forEach((x) => walk(x, fn, seen));
  fn(root as Record<string, unknown>);
  for (const v of Object.values(root)) walk(v, fn, seen);
}
