---
"ox": patch
---

Added support for specifying the ABI and signature name to:

- `AbiFunction.{encodeData,encodeResult,decodeData,decodeResult}`
- `AbiError.{encode,decode}`
- `AbiEvent.{encode,decode}`

Example:

```ts twoslash
import { AbiFunction } from 'ox'
import { abi } from './abi'

const data = AbiFunction.encodeData(
  abi, 
  'approve', 
  ['0x0000000000000000000000000000000000000000', 1n]
)
```