---
description: Calculates the ripemd160 hash of Bytes or a Hex value.
---

# Hash.ripemd160

Calculates the [ripemd160](https://en.wikipedia.org/wiki/RIPEMD) hash of [Bytes](/api/bytes) or a [Hex](/api/hex) value.

This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) – an audited & minimal JS hashing library.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Hash } from 'ox'

// Entrypoint Imports
import * as Hash from 'ox/Hash'
import { ripemd160 } from 'ox/Hash'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes, Hash, Hex } from 'ox'

const value = Hash.ripemd160('0xdeadbeef')
// '0x226821c2f5423e11fe9af68bd285c249db2e4b5a'
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

