---
"ox": patch
---

Made `Ens.normalize` return names already in ENSIP-15 normal form (lowercase ASCII labels) without running the normalizer, which is about 60x faster for them; other names are normalized as before.
