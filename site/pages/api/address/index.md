# Address

The **Address** Module provides a set of utility functions for working with Ethereum addresses.

## Functions

| Function                                              | Description                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| [`Address.from`](/api/address/from)                   | Converts an address string to a typed (checksummed) Address. |
| [`Address.fromPublicKey`](/api/address/fromPublicKey) | Converts an ECDSA public key to an Ethereum address.         |
| [`Address.assert`](/api/address/assert)               | Asserts that the given value is a valid address.             |
| [`Address.checksum`](/api/address/checksum)           | Computes the checksum address for the given address.         |
| [`Address.isAddress`](/api/address/isAddress)         | Checks if the given address is a valid address.              |
| [`Address.isEqual`](/api/address/isEqual)             | Checks if two addresses are equal.                           |

## Types

### `Address`

**Address** can be represented via the `Address` type. It is a JavaScript `string` primitive with a `"0x"` prefix.

```ts twoslash
// @noErrors
import { Address } from 'ox'

const address = Address.from(
  '0x0000000000000000000000000000000000000000'
) satisfies Address.Address
//                  ^? 



```