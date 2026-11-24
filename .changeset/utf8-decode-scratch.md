---
"ox": patch
---

Improved `Bytes.toString`, `Hex.toString` and `Base64.toString` performance on values of up to 64 bytes: they decode from a reused buffer instead of letting `TextDecoder` first move each short array to an `ArrayBuffer` of its own (`Base64.toString` 326 → 151 ns, `Hex.toString` 329 → 134 ns).
