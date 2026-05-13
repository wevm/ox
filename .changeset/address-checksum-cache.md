---
"ox": patch
---

Sped up `Address.checksum` cache hits by ~3x to ~6x via a direct `Map.get` lookup, lowercase-normalized secondary keys so mixed-case spellings share an entry, and a larger 32,768-entry FIFO `BoundedMap` backing `Caches.checksum`.
