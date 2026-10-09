---
"ox": patch
---

Added the `Passport` module for TIP-1142 passport signers, and message signatures and the passport address namespace to `ZkSignature`.

```ts
import { TypedData } from 'ox'
import { Passport } from 'ox/tempo'

const payload = TypedData.getSignPayload(
  Passport.getBindingTypedData({ account: '0x...', chainId: 4217 }),
)
const challenge = Passport.getChallenge({
  blinding: Passport.randomBlinding(),
  payload,
})
```
