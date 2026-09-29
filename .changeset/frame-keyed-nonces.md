---
"ox": patch
---

Added EIP-8250 keyed frame nonces with shared `nonce` sequences while preserving the original EIP-8141 encoding when `nonceKeys` is omitted.

```ts
import { TxEnvelopeEip8141 } from 'ox'

const envelope = TxEnvelopeEip8141.from({
  chainId: 1,
  sender: '0x1111111111111111111111111111111111111111',
  frames: [{ mode: 'sender', executionGas: 50_000n }],
  nonceKeys: [1n, 2n],
  nonce: 0n,
})
```
