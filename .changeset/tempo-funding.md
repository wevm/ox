---
"ox": patch
---

Added Tempo funding codecs, unsigned requirement inference, policy rules with optional source ordering, source helpers, and access key funding authorization.

```ts
import { TransactionRequest } from 'ox/tempo'

TransactionRequest.toRpc({ requireFunds: [{ sources: [] }] })
```
