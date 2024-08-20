# Bytes

The **Bytes** Module provides a set of Ethereum-related utility functions for working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances.

## Functions

| Function                                      | Description                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`Bytes.from`](/api/bytes/from)               | Encodes an arbitrary value to [`Bytes`](#bytes-1).                                                                                        |
| [`Bytes.fromBigInt`](/api/bytes/fromBigInt)   | Encodes a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) to **[`Bytes`](/api/bytes)**. |
| [`Bytes.fromBoolean`](/api/bytes/fromBoolean) | Encodes a boolean value to [`Bytes`](#bytes-1).                                                                                           |
| [`Bytes.fromHex`](/api/bytes/fromHex)         | Encodes a [`Hex`](/api/hex#hex-1) value to [`Bytes`](#bytes-1).                                                                           |
| [`Bytes.fromNumber`](/api/bytes/fromNumber)   | Encodes a number value to [`Bytes`](#bytes-1).                                                                                            |
| [`Bytes.fromString`](/api/bytes/fromString)   | Encodes a string value to [`Bytes`](#bytes-1).                                                                                            |
| [`Bytes.assert`](/api/bytes/assert)           | Asserts if the given value is [`Bytes`](#bytes-1).                                                                                        |
| [`Bytes.concat`](/api/bytes/concat)           | Concatenates two or more [`Bytes`](/api/bytes) values.                                                                                    |
| [`Bytes.isBytes`](/api/bytes/isBytes)         | Checks if the given value is [`Bytes`](#bytes-1).                                                                                         |
| [`Bytes.isEqual`](/api/bytes/isEqual)         | Checks if two [`Bytes`](/api/bytes) values are equal.                                                                                     |
| [`Bytes.padLeft`](/api/bytes/padLeft)         | Pads a [`Bytes`](#bytes-1) value to the left with zero bytes.                                                                             |
| [`Bytes.padRight`](/api/bytes/padRight)       | Pads a [`Bytes`](#bytes-1) value to the right with zero bytes.                                                                            |
| [`Bytes.random`](/api/bytes/random)           | Generates random [`Bytes`](/api/bytes) of the specified length.                                                                           |
| [`Bytes.size`](/api/bytes/size)               | Retrieves the size of a [`Bytes`](#bytes-1) value.                                                                                        |
| [`Bytes.slice`](/api/bytes/slice)             | Returns a section of a [`Bytes`](#bytes-1) value given a start (and end) bytes offset.                                                    |
| [`Bytes.to`](/api/bytes/to)                   | Decodes [`Bytes`](#bytes-1) into a string, number, bigint, boolean, or hex value.                                                         |
| [`Bytes.toBigInt`](/api/bytes/toBigInt)       | Decodes [`Bytes`](#bytes-1) into a BigInt.                                                                                                |
| [`Bytes.toBoolean`](/api/bytes/toBoolean)     | Decodes [`Bytes`](#bytes-1) into a boolean value.                                                                                         |
| [`Bytes.toHex`](/api/bytes/toHex)             | Decodes [`Bytes`](#bytes-1) into a [`Hex`](/api/hex#hex-1) value.                                                                         |
| [`Bytes.toNumber`](/api/bytes/toNumber)       | Decodes [`Bytes`](#bytes-1) into a number.                                                                                                |
| [`Bytes.toString`](/api/bytes/toString)       | Decodes [`Bytes`](#bytes-1) into a UTF-8 string.                                                                                          |
| [`Bytes.trimLeft`](/api/bytes/trimLeft)       | Trims leading zero bytes from a [`Bytes`](#bytes-1) value.                                                                                |
| [`Bytes.trimRight`](/api/bytes/trimRight)     | Trims trailing zero bytes from a [`Bytes`](#bytes-1) value.                                                                               |

## Types

### `Bytes`

- **Alias:** `Uint8Array`

**Bytes** can be represented via the `Bytes` type. It is an alias to a JavaScript `Uint8Array`.

```ts twoslash
// @noErrors
import { Bytes } from 'ox'

const bytes = Bytes.from('ox') satisfies Bytes.Bytes
//                                             ^? 



```