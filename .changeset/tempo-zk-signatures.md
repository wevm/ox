---
"ox": patch
---

Added TIP-1131 ZK signatures (type `0x06`) to `SignatureEnvelope`, key authorizations, and transactions, along with the `ZkSignature`, `Oidc` (TIP-1133 hashing), and `PublisherId` (TIP-1132) modules.

```ts
import { Oidc, PublisherId, ZkSignature } from 'ox/tempo'

const nonce = Oidc.getNonce({
  accessKeyAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  blinding: Oidc.randomBlinding(),
  validUntil: Math.floor(Date.now() / 1000) + 540,
})
```
