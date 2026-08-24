---
'ox': patch
---

Added multisig operation hashing, approval selection, and transaction serialization helpers.

```ts
import { MultisigOperation } from 'ox/tempo'

const selection = await MultisigOperation.selectApprovals(options)
const transaction = MultisigOperation.serializeTransaction(operation, {
  approvals: selection.selectedApprovals,
})
```
