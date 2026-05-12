---
"ox": patch
---

Tightened `internal/hex.ts` hot loops: `pad` uses `slice(2)` and a single `padEnd`/`padStart` lookup; `assertSize`/`assertStartOffset`/`assertEndOffset` use raw nibble arithmetic instead of recomputing `Hex.size`.
