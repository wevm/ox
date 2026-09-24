---
"ox": patch
---

Added hex signature support for secp256k1 and P256 frame signature entries.

```ts
import { FrameSignature, Signature } from 'ox'

declare const signature: Signature.Signature

FrameSignature.from({
  scheme: 'secp256k1',
  signature: Signature.toHex(signature),
})
```
