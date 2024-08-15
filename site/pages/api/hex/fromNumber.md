---
description: Encodes a number value to Hex.
---

# Hex.fromNumber

**Alias:** `numberToHex`

Encodes a number value to **[Hex](/api/hex)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { numberToHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.fromBigInt(420)
// '0x1a4'

const hex = Hex.fromBigInt(69, { size: 4 })
// '0x45'

const hex = Hex.fromBigInt(-127, { size: 2, signed: true })
// '0xff81'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `bigint`

The BigInt value to encode to Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBigInt(
  420 // [!code focus]
);
```

### options

#### options.signed

- **Type:** `boolean`

Whether or not the number of a signed representation.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBigInt(
  -420,
  { 
    size: 4,
    signed: true // [!code focus]
  }
);
```

#### options.size 

- **Type:** `number`

Size of the output Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBigInt(
  420,
  { size: 32 } // [!code focus]
);
```