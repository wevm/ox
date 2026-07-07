---
'ox': major
---

Removed the Tempo `TokenId` module and narrowed Tempo token inputs (`feeToken`, `Channel.token`, `PoolId.from` tokens) to `Address.Address`; also removed the now-redundant `Channel.Resolved` type.

```diff
  TxEnvelopeTempo.from({
    // ...
-   feeToken: 1n,
+   feeToken: '0x20c0000000000000000000000000000000000001',
  })
```
