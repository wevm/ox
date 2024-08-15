# Hex

The **Hex** Module provides a set of Ethereum-related utility functions for working with hexadecimal string values (e.g. `"0xdeadbeef"`).

## Type

**Hex** can be represented via the `Hex` type. It is a JavaScript `string` primitive with a `"0x"` prefix.

```ts twoslash
// @noErrors
import { Hex } from 'ox'

const hex = Hex.from('ox') satisfies Hex.Hex
//                                       ^? 



```