# Hash

The **Hash** Module provides a set of utility functions for hashing. 

```ts twoslash
// @noErrors
import { Hash } from 'ox'

const value = Hash.keccak256('0xdeadbeef')
// '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
```

## Functions

| Function                                | Description                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`Hash.isHash`](/api/hash/isHash)       | Checks if the given value is a hash.                                                              |
| [`Hash.keccak256`](/api/hash/keccak256) | Computes the Keccak-256 hash of a [`Bytes`](/api/bytes#bytes-1) or [`Hex`](/api/hex#hex-1) value. |
| [`Hash.sha256`](/api/hash/sha256)       | Computes the SHA-256 hash of a [`Bytes`](/api/bytes#bytes-1) or [`Hex`](/api/hex#hex-1) value.    |
| [`Hash.ripemd160`](/api/hash/ripemd160) | Computes the RIPEMD-160 hash of a [`Bytes`](/api/bytes#bytes-1) or [`Hex`](/api/hex#hex-1) value. |