---
'ox': patch
---

Changed native multisig configuration and signature APIs to require complete TIP-1061 witnesses with a `version`.

```ts
const config = MultisigConfig.from({
  owners,
  threshold: 2,
  version: 1,
})
```
