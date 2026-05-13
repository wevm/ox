---
"ox": patch
---

Sped up `Base64.fromBytes`, `Base64.toBytes`, and `Base64.toString` by routing through native `Uint8Array` Base64 codecs (Node 22+, Safari 18+, Firefox 133+) when available and tightening the JS fallback for older runtimes.
