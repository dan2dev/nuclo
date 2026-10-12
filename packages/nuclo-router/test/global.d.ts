// --expose-gc (see vitest.config.ts) exposes the collector to the GC tests.
// This package typechecks its tests, and tsconfig sets "types": [], so the
// Node declaration of `gc` is not in scope.
declare global {
  var gc: (() => void) | undefined;
}

export {};
