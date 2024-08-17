# Rlp

The **Rlp** Module provides a set of utility functions for encoding and decoding [Recursive Length Prefix](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) structures.

```ts twoslash
// @noErrors
import { Hex, Rlp } from 'ox'

const data = Rlp.encode([Hex.from('hello'), Hex.from('world')])
// '0xcc8568656c6c6f85776f726c64'

const values = Rlp.decode(data)
// [Hex.from('hello'), Hex.from('world')]
```
