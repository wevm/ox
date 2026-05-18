---
"ox": major
---

Removed the `TempoAddress` module and its `tempox`-prefixed address format. All Tempo modules now accept plain hex `Address.Address` values; remove any `TempoAddress.format` / `TempoAddress.parse` / `TempoAddress.resolve` calls at the boundary. The `addressType` type parameter has also been dropped from `Call`, `TxEnvelopeTempo`, `KeyAuthorization`, `AuthorizationTempo`, `TransactionRequest`, and `TokenId.TokenIdOrAddress`.

```diff
- import { TempoAddress } from 'ox/tempo'
- const formatted = TempoAddress.format('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28')
- const { address } = TempoAddress.parse(formatted)
+ const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28'
```
