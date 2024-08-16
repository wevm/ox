---
description: Calculates the Keccak256 hash of Bytes or a Hex value.
---

# Hash.keccak256

Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of [Bytes](/api/bytes) or a [Hex](/api/hex) value.

This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) – an audited & minimal JS hashing library.

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Hash } from 'ox'

// Module Imports
import * as Hash from 'ox/Hash'
import { keccak256 } from 'ox/Hash'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes, Hash, Hex } from 'ox'

const value = Hash.keccak256('0xdeadbeef')
// 0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1

const value = Hash.keccak256(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
// 0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0

// hash a utf-8 string
const value = Hash.keccak256(Hex.from('hello world'))
// 0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0
```

## Returns

`Hex | ByteArray`

The hashed value.

## Parameters

### value

- **Type:** `Hex | ByteArray`

The Bytes or Hex value to hash.

### to

- **Type:** `"bytes" | "hex"`
- **Default:** `"hex"`

The output type.

```ts
import { Bytes, Hash } from 'ox'

Hash.keccak256(
  Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33],
  'bytes' // [!code focus]
)
// Uint8Array [62, 162, 241, 208, 171, 243, 252, 102, 207, 41, 238, 187, 112, 203, 212, 231, 254, 118, 46, 248, 160, 155, 204, 6, 200, 237, 246, 65, 35, 10, 254, 192] // [!code focus]
```