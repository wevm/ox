# Hex

The **Hex** Module provides a set of Ethereum-related utility functions for working with hexadecimal string values (e.g. `"0xdeadbeef"`).

## Functions

| Function                                  | Description                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`Hex.from`](/api/hex/from)               | Encodes an arbitrary value to [`Hex`](#hex-1).                                                                                      |
| [`Hex.fromBigInt`](/api/hex/fromBigInt)   | Encodes a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) to **[`Hex`](#hex-1)**. |
| [`Hex.fromBoolean`](/api/hex/fromBoolean) | Encodes a boolean value to [`Hex`](#hex-1).                                                                                         |
| [`Hex.fromBytes`](/api/hex/fromBytes)     | Encodes a [`Bytes`](/api/bytes#bytes-1) value to [`Hex`](#hex-1).                                                                   |
| [`Hex.fromNumber`](/api/hex/fromNumber)   | Encodes a number value to [`Hex`](#hex-1).                                                                                          |
| [`Hex.fromString`](/api/hex/fromString)   | Encodes a string value to [`Hex`](#hex-1).                                                                                          |
| [`Hex.assert`](/api/hex/assert)           | Asserts if the given value is [`Hex`](#hex-1).                                                                                      |
| [`Hex.concat`](/api/hex/concat)           | Concatenates two or more [`Hex`](#hex-1) values.                                                                                    |
| [`Hex.isHex`](/api/hex/isHex)             | Checks if the given value is [`Hex`](#hex-1).                                                                                       |
| [`Hex.isEqual`](/api/hex/isEqual)         | Checks if two [`Hex`](#hex-1) values are equal.                                                                                     |
| [`Hex.padLeft`](/api/hex/padLeft)         | Pads a [`Hex`](#hex-1) value to the left with zero bytes.                                                                           |
| [`Hex.padRight`](/api/hex/padRight)       | Pads a [`Hex`](#hex-1) value to the right with zero bytes.                                                                          |
| [`Hex.random`](/api/hex/random)           | Generates random [`Hex`](#hex-1) of the specified length.                                                                           |
| [`Hex.size`](/api/hex/size)               | Retrieves the size of a [`Hex`](#hex-1) value.                                                                                      |
| [`Hex.slice`](/api/hex/slice)             | Returns a section of a [`Hex`](#hex-1) value given a start (and end) bytes offset.                                                  |
| [`Hex.to`](/api/hex/to)                   | Decodes [`Hex`](#hex-1) into a string, number, bigint, boolean, or hex value.                                                       |
| [`Hex.toBigInt`](/api/hex/toBigInt)       | Decodes [`Hex`](#hex-1) into a BigInt.                                                                                              |
| [`Hex.toBoolean`](/api/hex/toBoolean)     | Decodes [`Hex`](#hex-1) into a boolean value.                                                                                       |
| [`Hex.toBytes`](/api/hex/toBytes)         | Decodes [`Hex`](#hex-1) into a [`Bytes`](/api/bytes#bytes-1) value. value.                                                          |
| [`Hex.toNumber`](/api/hex/toNumber)       | Decodes [`Hex`](#hex-1) into a number.                                                                                              |
| [`Hex.toString`](/api/hex/toString)       | Decodes [`Hex`](#hex-1) into a UTF-8 string.                                                                                        |
| [`Hex.trimLeft`](/api/hex/trimLeft)       | Trims leading zero bytes from a [`Hex`](#hex-1) value.                                                                              |
| [`Hex.trimRight`](/api/hex/trimRight)     | Trims trailing zero bytes from a [`Hex`](#hex-1) value.                                                                             |

## Types

### `Hex`

**Hex** can be represented via the `Hex` type. It is a JavaScript `string` primitive with a `"0x"` prefix.

```ts twoslash
// @noErrors
import { Hex } from 'ox'

const hex = Hex.from('ox') satisfies Hex.Hex
//                                       ^? 



```