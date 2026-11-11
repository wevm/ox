---
"ox": patch
---

Fixed `TxEnvelopeTempo.assert` to throw `InvalidValidityBoundError` when `validBefore` or `validAfter` is not a non-negative safe integer number, instead of serializing a bigint or hex bound as unset.
