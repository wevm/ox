---
"ox": minor
---

Added EIP-8141 support to generic transaction envelope construction, type detection, encoding, hashing, and signing payloads.

```ts
import { Frame, TransactionEnvelope } from 'ox'

const envelope = TransactionEnvelope.from({
  chainId: 1,
  frames: [Frame.from({ gas: 50_000n, mode: 'sender' })],
  sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
})
const serialized = TransactionEnvelope.serialize(envelope)
```
