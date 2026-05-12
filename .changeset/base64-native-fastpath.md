---
"ox": patch
---

Routed `Base64.fromBytes` and `Base64.toBytes` through native `Uint8Array` Base64 codecs (Node 22+, Safari 18+, Firefox 133+) when available, replaced the JS fallback's `Record` lookup tables with `Uint8Array` tables, and dropped the `encoder.encodeInto` trick in favor of a tight `charCodeAt`-driven decode loop.
