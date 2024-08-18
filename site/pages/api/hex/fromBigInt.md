---
description: Encodes a BigInt to Hex.
---

# Hex.fromBigInt

**Alias:** `numberToHex`

Encodes a [BigInt](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) to **[Hex](/api/hex)**.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { numberToHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.fromBigInt(420n)
// '0x1a4'

const hex = Hex.fromBigInt(69n, { size: 4 })
// '0x45'

const hex = Hex.fromBigInt(-127n, { size: 2, signed: true })
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
  420n // [!code focus]
);
```

### options

#### options.signed

- **Type:** `boolean`

Whether or not the number of a signed representation.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBigInt(
  -420n,
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
  420n,
  { size: 32 } // [!code focus]
);
```