---
'ox': patch
---

Corrected Zone chain ID conversion for Presto and Moderato source chains.

```ts
import { ZoneId } from 'ox/tempo'

ZoneId.toChainId(1, 42_431)
```
