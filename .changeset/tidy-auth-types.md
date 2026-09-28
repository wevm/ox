---
"ox": patch
---

Restored single-signer key authorization defaults and RPC signature discriminant access while preserving multisig inference.

```ts
import type { KeyAuthorization } from 'ox/tempo'

type MultisigAuthorization = KeyAuthorization.Rpc<'multisig'>
```
