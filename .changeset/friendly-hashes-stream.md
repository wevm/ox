---
"ox": minor
---

Added incremental hash state factories with chunk updates, cloning, caller-owned output buffers, and destruction, plus `Rlp.encodeTo` for streaming encoded bytes.

```ts
import { Hash, Rlp } from 'ox'

const hash = Hash.createKeccak256()
Rlp.encodeTo(['0x01', '0x0203'], {
  write(chunk) {
    hash.update(chunk)
  },
})
const digest = hash.digest()
```
