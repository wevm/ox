---
"ox": patch
---

Added a `{"type":"module"}` marker to `_types/` so declaration files resolve as ESM under TypeScript `node16` (and `nodenext` before TypeScript 5.8); CommonJS consumers on `node16` should switch to `nodenext` or `bundler` resolution.
