---
"ox": patch
---

Renamed the Tempo multisig account APIs to configurable accounts (TIP-1107), including the `account_` relay RPC namespace, raised `AccountConfig.maxThreshold` to `255` per TIP-1114, and added `AccountConfig.update` for deriving the next config after an owner update.

```diff
- import { MultisigConfig, MultisigOperation, MultisigSimulation } from 'ox/tempo'
+ import { AccountConfig, AccountOperation, AccountSimulation } from 'ox/tempo'

- const initialConfig = MultisigConfig.from({ owners, threshold: 2 })
+ const initialConfig = AccountConfig.from({ owners, threshold: 2 })

- SignatureEnvelope.sortMultisigApprovals({ account, config, payload, signatures })
+ SignatureEnvelope.sortApprovals({ account, config, payload, signatures })

- if (signature.type === 'multisig') signature satisfies SignatureEnvelope.Multisig
+ if (signature.type === 'configurable') signature satisfies SignatureEnvelope.Configurable

- KeyAuthorization.from({ account, address, chainId, type: 'multisig' })
+ KeyAuthorization.from({ account, address, chainId, type: 'configurable' })

- TransactionRequest.toRpc({ from, keyType: 'multisig', multisigSimulation })
+ TransactionRequest.toRpc({ accountSimulation, from, keyType: 'configurable' })

- RpcSchema.from<RpcSchemaTempo.Multisig>() // multisig_getConfig, multisig_getOperation, ...
+ RpcSchema.from<RpcSchemaTempo.Account>() // account_getConfig, account_getOperation, ...
```
