---
"ox": patch
---

Added an `ox/_types/*` subpath so consumers can emit declarations for inferred values whose types reach internal modules, fixing `TS2742`.

```ts
// previously failed to emit a `.d.ts` without an explicit type annotation:
// `UserOperation` is a `OneOf<...>` instantiation, and `OneOf` had no
// addressable module.
export const userOperation = UserOperation.from({ ... })
```
