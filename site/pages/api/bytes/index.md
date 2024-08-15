# Bytes

The **Bytes** Module provides a set of Ethereum-related utility functions for working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances.

## Type

- **Alias:** `Uint8Array`

**Bytes** can be represented via the `Bytes` type. It is an alias to a JavaScript `Uint8Array`.

```ts twoslash
// @noErrors
import { Bytes } from 'ox'

const bytes = Bytes.from('ox') satisfies Bytes.Bytes
//                                             ^? 



```