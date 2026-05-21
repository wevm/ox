---
'ox': patch
---

Fixed `PublicKey.assert` so it rejects objects missing `x`/`y` when the `compressed` option is set explicitly.
