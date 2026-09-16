---
"ox": major
---

Updated Tempo multisig accounts to versioned configurations, factory-derived addresses, primitive approvals, and configurable-account delegation.

```diff
- const account = MultisigConfig.getAddress(genesisConfig)
- const digest = MultisigConfig.getSignPayload({ payload, genesisConfig })
- const signature = SignatureEnvelope.from({ genesisConfig, init: true, signatures })
+ const account = MultisigConfig.getAddress(genesisConfig, { factory })
+ const config = { ...genesisConfig, version: 0n }
+ const digest = MultisigConfig.getSignPayload({ payload, account, version: config.version })
+ const signature = SignatureEnvelope.from({ account, config, signatures })
- const rpc = { init: genesisConfig, signatures: rpcApprovals }
+ const rpc = SignatureEnvelope.toRpc(signature) // RLP bytes without the type prefix
- const simulation = { multisigInit: genesisConfig, multisigSignatureCount: 2 }
+ const simulation = { multisigSimulation: { config: Rlp.fromHex(MultisigConfig.toTuple(config)), approvals: owners } }
```
