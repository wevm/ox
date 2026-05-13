---
"ox": patch
---

Sped up `Hex.padLeft`, `Hex.padRight`, `Hex.slice`, `Bytes.padLeft`, `Bytes.padRight`, and `Bytes.slice` by tightening the shared size-assertion and padding hot paths.
