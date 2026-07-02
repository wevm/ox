---
'ox': minor
---

**Breaking (`ox/tempo`):** Removed the TIP-1061 multisig `config_id` concept to match the updated Tempo reference implementation: multisig account addresses now derive directly from the initial config, owner approval digests bind only `account`, the signature wire format is `0x05 || rlp([account, signatures, init?])`, `MultisigConfig.maxOwners` is now 255 with `u8` weights, and owner approvals may be nested multisig signatures.

```diff
- const id = MultisigConfig.toId(genesisConfig)
- const account = MultisigConfig.getAddress({ genesisConfigId: id })
+ const account = MultisigConfig.getAddress(genesisConfig)

- MultisigConfig.getSignPayload({ payload, account, genesisConfigId })
+ MultisigConfig.getSignPayload({ payload, account })

- SignatureEnvelope.from({ account, genesisConfigId, signatures })
+ SignatureEnvelope.from({ account, signatures })
```
