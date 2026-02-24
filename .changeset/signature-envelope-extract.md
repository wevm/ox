---
"ox": patch
---

`ox/tempo`: Added `SignatureEnvelope.extractAddress` and `SignatureEnvelope.extractPublicKey` to extract signer address/public key from a signature envelope. Handles all signature types: secp256k1 (via ecrecover), p256/webAuthn (from embedded public key), and keychain (from inner signature or root `userAddress`).
