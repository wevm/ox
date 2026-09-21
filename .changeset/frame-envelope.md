---
"ox": minor
---

Added `TxEnvelopeEip8141` for frame transaction construction, signing payloads, hashing, serialization, and PeerDAS wrappers.

```ts
import { TxEnvelopeEip8141 } from 'ox'

const envelope = TxEnvelopeEip8141.from({
  chainId: 1,
  frames: [{ gas: 50_000n, mode: 'sender' }],
  sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
```
