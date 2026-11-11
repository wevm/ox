---
"ox": patch
---

Fixed `TxEnvelopeLegacy.serialize` to throw when an envelope's `v` does not match its `chainId`, and to throw `Signature.InvalidVError` when `v` is not a valid parity for the given `chainId`.
