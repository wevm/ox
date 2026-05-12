---
"ox": patch
---

Hardened ERC-8010 by validating the full unwrapped object in `SignatureErc8010.assert`, capping the suffix length parsed by `unwrap` against the wrapped size to reject overflowing inputs, and skipping `Secp256k1.recoverAddress` in `wrap` when `to` is already provided.
