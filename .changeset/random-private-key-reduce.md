---
"ox": patch
---

Improved `Secp256k1.randomPrivateKey`, `P256.randomPrivateKey` and `Bls.randomPrivateKey` performance: the random seed is reduced to a key directly instead of through noble's `mapHashToField`, which measures the curve order bit by bit twice per call (about 10 → 1.7 µs, bundle 4.5 → 2.1 kB). The keys are the same function of the random bytes.
