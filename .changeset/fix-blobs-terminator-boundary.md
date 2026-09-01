---
"ox": patch
---

Fixed `Blobs.to` truncating multi-blob payloads when a non-final blob contained a `0x80` byte.
