---
title: Encodes a value into RLP format.
---

# Rlp.encode

- **Alias:** `toRlp`

Encodes a [Bytes](/api/bytes) or [Hex](/api/hex) value into a [Recursive-Length Prefix (RLP)](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Rlp } from 'ox'

// Module Imports
import * as Rlp from 'ox/Rlp'
import { toRlp } from 'ox/Rlp'
```

## Usage

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const data = Rlp.encode([Hex.from('hello'), Hex.from('world')])
// '0xcc8568656c6c6f85776f726c64'
```

## Returns

`Hex | Bytes`

The RLP encoded value.

## Parameters

### value

- **Type:** `RecursiveArray<Bytes> | RecursiveArray<Hex>`

The value to encode.

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const data = Rlp.encode(
  [Hex.from('hello'), Hex.from('world')] // [!code focus]
)
```

### to

- **Type:** `'bytes' | 'hex'`

The format to encode the value into.

```ts twoslash
// @noErrors
import { Rlp, Hex } from 'ox';

const data = Rlp.encode(
  [Hex.from('hello'), Hex.from('world')],
  'bytes' // [!code focus]
)
```