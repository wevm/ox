---
"ox": patch
---

Added passport document reading and verification to `Passport` (`fromDg15`, `fromSod`, `fromCertificate`, `assertSod`, `verifyDocument`, `verifyActiveAuthentication`), the `Groth16` module for BN254 proof verification in TIP-1131's point encoding, and `ZkSignature.verifyMessage`.

```ts
import { Passport, ZkSignature } from 'ox/tempo'

const { modulus, mrz } = Passport.verifyDocument({ dg1, dg15, sod })
const valid = Passport.verifyActiveAuthentication({ challenge, dg15, signature })

const verified = ZkSignature.verifyMessage({ payload, signature, verifyingKey })
```
