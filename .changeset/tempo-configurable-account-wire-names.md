---
"ox": patch
---

Renamed the configurable account RPC key type from `multisig` to `configurableAccount` and `TransactionRequest.multisigSimulation` to `configurableAccountSimulation`, and added the optional `AccountSimulation` grant `signer`, to match the Tempo node.

```diff
- { keyType: 'multisig', multisigSimulation: spec }
+ { keyType: 'configurableAccount', configurableAccountSimulation: spec }
```
