---
'ox': patch
---

Added `Hash.blake3` for BLAKE3 hashing through Ox's default or an installed engine implementation.

```ts
import { Hash } from 'ox'

const digest = Hash.blake3('0xdeadbeef')
```
