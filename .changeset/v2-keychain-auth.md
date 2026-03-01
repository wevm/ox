---
"ox": minor
---

**Breaking (`ox/tempo`):** `KeyAuthorization.chainId` is now required.

```diff
 const authorization = KeyAuthorization.from({
   address,
+  chainId: 1n,
   expiry: 1234567890,
   type: 'secp256k1',
 })
```

