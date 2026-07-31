---
"ox": minor
---

Added WebAuthn PRF output and secp256k1, Ed25519, and AES-GCM key derivation, and deprecated `WebAuthnP256` in favor of `WebAuthn`.

```ts
import { AesGcm, Ed25519, Secp256k1, WebAuthn } from 'ox'

const credential = await WebAuthn.createCredential({
  name: 'Example',
  prf: true,
})
const secp256k1PrivateKey = Secp256k1.fromPrf(credential.prf)
const ed25519PrivateKey = Ed25519.fromPrf(credential.prf)
const encryptionKey = await AesGcm.fromPrf(credential.prf)
```
