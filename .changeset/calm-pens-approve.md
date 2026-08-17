---
'ox': patch
---

Updated native multisig signing for configuration versions, access-key authorization, current protocol limits, and the `initialConfig` naming.

```ts
import { MultisigConfig } from 'ox/tempo'

const digest = MultisigConfig.getSignPayload({ initialConfig, payload })
```
