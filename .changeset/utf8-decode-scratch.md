---
"ox": patch
---

Made `Bytes.toString`, `Hex.toString` and `Base64.toString` decode values of up to 64 bytes from a reused buffer. V8 keeps typed arrays that small on its heap, and `TextDecoder` first moved each one to an `ArrayBuffer` of its own; `Base64.toString` and `Hex.toString` on short values run about 2-3x faster. The output is unchanged.
