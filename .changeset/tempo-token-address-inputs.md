---
'ox': major
---

Narrowed Tempo token inputs (`feeToken`, `Channel.token`, `PoolId.from` tokens) to `Address.Address` (convert token IDs with `TokenId.toAddress`) and removed the now-redundant `Channel.Resolved` type.

```diff
+ import { TokenId } from 'ox/tempo'

  TxEnvelopeTempo.from({
    // ...
-   feeToken: 1n,
+   feeToken: TokenId.toAddress(1n),
  })
```
