---
title: Decodes an RLP value.
---

# Rlp.decode

- **Alias:** `fromRlp`

Decodes a [Recursive-Length Prefix (RLP)](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) value into a [Bytes](/api/bytes) or [Hex](/api/hex) value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Rlp } from 'ox'

// Module Imports
import * as Rlp from 'ox/Rlp'
import { fromRlp } from 'ox/Rlp'
```

## Usage

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const data = Rlp.decode('0xcc8568656c6c6f85776f726c64')
```

## Returns

`Hex | Bytes`

The decoded RLP value.

## Parameters

### data

- **Type:** `Bytes | Hex`

The data to decode.

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const value = Rlp.decode(
  '0xcc8568656c6c6f85776f726c64' // [!code focus]
)
```

### to

- **Type:** `'bytes' | 'hex'`

The format to decode the value into.

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const value = Rlp.decode(
  '0xcc8568656c6c6f85776f726c64',
  'bytes' // [!code focus]
)
```