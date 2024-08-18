# Address

The **Address** Module provides a set of utility functions for working with Ethereum addresses.

## Type

**Address** can be represented via the `Address` type. It is a JavaScript `string` primitive with a `"0x"` prefix.

```ts twoslash
// @noErrors
import { Address } from 'ox'

const address = Address.from(
  '0x0000000000000000000000000000000000000000'
) satisfies Address.Address
//                  ^? 



```