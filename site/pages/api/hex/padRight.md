---
description: Pads a Hex value to the right with zero bytes.
---

# Hex.padRight

Pads a **[Hex](/api/hex)** value to the right with zero bytes until it reaches the given `size` (default: 32 bytes).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { padRight } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.padRight('0xdeadbeef')
// '0xdeadbeef000000000000000000000000000000000000000000000000000000000'
```

## Return Type

`Hex`

## Parameters

### hex

- **Type:** `Hex`

Hex to pad.

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.padRight(
  '0xdeadbeef', // [!code focus]
)
```

### size

- **Type:** `number`
- **Default:** `32`

Size (in bytes) to pad to.

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.padRight(
  '0xdeadbeef',
  8, // [!code focus]
)
```
