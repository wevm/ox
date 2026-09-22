---
"ox": minor
---

Added frame transaction RPC conversions and Zod codecs, including payer metadata and per-frame receipts.

```ts
import { Frame, TxEnvelopeEip8141 } from 'ox'
import { z } from 'ox/zod'

const envelope = TxEnvelopeEip8141.from({
  chainId: 1,
  frames: [Frame.from({ gas: 50_000n, mode: 'sender' })],
  sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
const rpc = z.encode(z.TxEnvelopeEip8141.TxEnvelopeEip8141, envelope)
```
