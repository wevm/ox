---
'ox': patch
---

Changed native multisig configuration, signature, and transaction request APIs to use complete TIP-1061 witnesses, including standalone RPC witness conversion utilities.

```diff
 const config = MultisigConfig.from({ owners, threshold: 2 })
 const signature = SignatureEnvelope.from({
-  initialConfig: config,
-  init: true,
+  config,
   signatures,
 })
```
