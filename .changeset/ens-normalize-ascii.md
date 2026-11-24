---
"ox": patch
---

Made `Ens.normalize` return a name that is already normalized (labels of lowercase ASCII letters, digits, `$` and `-` after any leading `_`) without running the ENSIP-15 normalizer, which is about 50x faster for such names. Other names are normalized as before.
