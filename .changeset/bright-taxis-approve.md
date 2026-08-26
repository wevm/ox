---
'ox': patch
---

Updated Tempo multisig operations, configuration witnesses, RPC types, approval selection, transaction serialization, fee-payer envelope handling, and TIP-1061 validation.

```ts
import { MultisigOperation } from 'ox/tempo'

const selection = await MultisigOperation.selectApprovals(options)
const transaction = MultisigOperation.serializeTransaction(operation, {
  approvals: selection.selectedApprovals,
})
```
