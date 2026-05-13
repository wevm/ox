---
"ox": major
---

Migrated ECDSA and BLS coordinate fields (`r`, `s`, `x`, `y`, BLS `Fp`/`Fp2`) from `bigint` to padded `Hex.Hex` strings (32-byte for `secp256k1`/`P256`/`WebAuthnP256`, 48-byte for BLS12-381) on `Signature`, `PublicKey`, `BlsPoint`, `Transaction`, `Authorization`, `TxEnvelope`, and related Tempo and ERC envelopes, dropping the `bigintType` generic.

```diff
- Signature.from({ r: 0x6e10...n, s: 0x4a90...n, yParity: 1 })
+ Signature.from({
+   r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
+   s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
+   yParity: 1,
+ })
```
