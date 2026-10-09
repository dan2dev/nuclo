# Type inference

- Prefer TypeScript inference for local variables, initialized fields, defaulted parameters, callback parameters, and implementation return types when it preserves the intended type.
- Keep explicit types for public contracts and overloads, untyped inputs, type predicates, recursive inference, empty collections, and state that must accept values wider than its initializer.
- Use narrowing before assertions. Do not add `any`, casts, or non-null assertions just to remove an annotation.
- Preserve literal, generic, element-tag, event-target, and item inference across the global, module, and source APIs.
- Keep deliberate annotations in compile-time type tests. Run `bun run typecheck` after type changes; add inference and invalid-input probes when changing an API signature.
