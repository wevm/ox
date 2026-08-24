---
'ox': patch
---

Added multisig operation hashing, approval selection, transaction serialization, and fee-payer transaction deserialization.

```ts
import { MultisigOperation } from 'ox/tempo'

const selection = await MultisigOperation.selectApprovals(options)
const transaction = MultisigOperation.serializeTransaction(operation, {
  approvals: selection.selectedApprovals,
})
```
