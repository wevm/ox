---
"ox": minor
---

Added Tempo funding transaction codecs, committed policy rules, native DEX funding payloads, and access key funding authorization.

```ts
import { FundingPolicy, NativeDexFunding } from 'ox/tempo'

const policyRules = FundingPolicy.encode({
  maxSlippageBps: 100,
  sources: {
    [outputToken]: [{
      target: nativeDexSource,
      data: NativeDexFunding.encode({ tokenIn: inputToken, maxAmountIn: 30_000_000n }),
    }],
  },
})
```
