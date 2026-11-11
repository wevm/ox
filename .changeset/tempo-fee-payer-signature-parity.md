---
"ox": patch
---

Fixed `TxEnvelopeTempo.assert` and `TxEnvelopeTempo.serialize` to throw for a fee payer signature whose `yParity` is not `0` or `1`, instead of encoding it as `1`.
