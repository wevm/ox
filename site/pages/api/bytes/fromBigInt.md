---
description: Encodes a BigInt to Uint8Array Bytes.
---

# Bytes.fromBigInt

**Alias:** `numberToBytes`

Encodes a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) to **[Bytes](/api/bytes)**.

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

const bytes = Bytes.fromBigInt(420n)
// Uint8Array([1, 164])

const bytes = Bytes.fromBigInt(69n, { size: 4 })
// Uint8Array([0, 0, 0, 69])

const bytes = Bytes.fromBigInt(-127n, { size: 2, signed: true })
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
  420n // [!code focus]
);
```

### options

#### options.signed

- **Type:** `boolean`

Whether or not the number of a signed representation.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBigInt(
  -420n,
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
  420n,
  { size: 32 } // [!code focus]
);
```