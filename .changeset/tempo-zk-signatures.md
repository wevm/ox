---
"ox": patch
---

Added TIP-1131 ZK signatures (type `0x06`) to `SignatureEnvelope`, key authorizations, and transactions, along with the `ZkSignature`, `Oidc` (TIP-1133 hashing and sign-in preparation), and `PublisherId` (TIP-1132) modules.

```ts
import { WebCryptoP256 } from 'ox'
import { Oidc, PublisherId, ZkSignature } from 'ox/tempo'

const { publicKey } = await WebCryptoP256.createKeyPair()

const prepared = Oidc.prepare({ publicKey })
```
