---
'ox': patch
---

Updated native multisig signing for configuration versions and current protocol limits, and renamed `genesisConfig` to `initialConfig`.

```ts
import { MultisigConfig } from 'ox/tempo'

const digest = MultisigConfig.getSignPayload({ initialConfig, payload })
```
