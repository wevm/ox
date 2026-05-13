---
"ox": patch
---

Reworked `Rlp.from`, `Rlp.fromHex`, and `Rlp.fromBytes` to encode in a single pass with a hex-leaf fast path and a cached list-body-length table populated during the measure pass.
