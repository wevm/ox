---
description: Encodes a number value to Uint8Array Bytes.
---

# Bytes.fromNumber

**Alias:** `numberToBytes`

Encodes a number value to **[Bytes](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { numberToBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.fromBigInt(420)
// Uint8Array([1, 164])

const bytes = Bytes.fromBigInt(69, { size: 4 })
// Uint8Array([0, 0, 0, 69])

const bytes = Bytes.fromBigInt(-127, { size: 2, signed: true })
// Uint8Array([255, 129])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `bigint`

The BigInt value to encode to Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBigInt(
  420 // [!code focus]
);
```

### options

#### options.signed

- **Type:** `boolean`

Whether or not the number of a signed representation.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBigInt(
  -420,
  { 
    size: 4,
    signed: true // [!code focus]
  }
);
```

#### options.size 

- **Type:** `number`

Size of the output Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBigInt(
  420,
  { size: 32 } // [!code focus]
);
```