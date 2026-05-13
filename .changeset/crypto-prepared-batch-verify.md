---
"ox": minor
---

Added `WebCryptoP256.prepareVerifyKey` / `WebCryptoP256.verifyPrepared` (skips per-call `crypto.subtle.importKey`), `Secp256k1.verifyBytes` / `Secp256k1.verifyBatch`, `P256.verifyBytes` / `P256.verifyBatch`, and `Bls.preparePayload` / `Bls.hashToCurve` / `Bls.signPrepared` / `Bls.verifyPrepared` / `Bls.verifyBatchSameMessage` for batch verification and same-message hot paths.
