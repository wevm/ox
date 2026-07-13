---
'ox': patch
---

Fixed Tempo key authorization RPC decoding to tolerate `null` optional fields and preserve `witness`, `isAdmin`, and `account` through the zod codec.
