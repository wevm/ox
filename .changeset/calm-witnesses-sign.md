---
'ox': patch
---

Changed native multisig configuration, signature, and transaction request APIs to use complete TIP-1061 witnesses.

```ts
const config = MultisigConfig.from({
  owners,
  threshold: 2,
  version: 1,
})
```
