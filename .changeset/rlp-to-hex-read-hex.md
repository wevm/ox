---
"ox": patch
---

Made `Rlp.toHex` (and the transaction envelopes' `deserialize`, which call it) faster on hex input: valid hex is decoded straight from the string instead of being decoded to bytes first. A 175-byte EIP-1559 transaction decodes in about 0.9 µs instead of 1.6 µs. The output and errors are unchanged.
