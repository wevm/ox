---
'ox': patch
---

Updated native multisig configurations and signatures to use TIP-1061 configuration witnesses.

```ts
const config = MultisigConfig.from({
  owners,
  threshold: 2,
  version: 1n,
})
```
