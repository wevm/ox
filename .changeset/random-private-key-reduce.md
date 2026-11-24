---
"ox": patch
---

Improved `Secp256k1.randomPrivateKey`, `P256.randomPrivateKey` and `Bls.randomPrivateKey` performance: the 48 random bytes are reduced to a key directly instead of through noble's `mapHashToField`, which measures the curve order with `toString(2)` three times per call (about 3.2 → 1.3 µs). The keys are the same function of the random bytes.
