---
"ox": patch
---

Added `EarnShares` to `ox/tempo`: raw EarnToken/venue-share conversions at the vault anchor rate, the dilution-correct fee-share formula, and a `minimumOutput` slippage floor.

```ts
import { EarnShares } from 'ox/tempo'

const tokens = EarnShares.toTokens({ engineShares: 3n, supply: 2n }, 7n)
const minimumShares = EarnShares.minimumOutput(1_000_000n, 50n)
```
