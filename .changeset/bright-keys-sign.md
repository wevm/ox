---
"ox": patch
---

Added `MultisigOperation.serializeKeyAuthorization` for attaching selected owner approvals to a key authorization.

```ts
const authorization = MultisigOperation.serializeKeyAuthorization(
  keyAuthorization,
  {
    account,
    approvals: selection.selectedApprovals,
    config,
  },
)
```
