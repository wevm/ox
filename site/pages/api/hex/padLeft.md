---
description: Pads a Hex value to the left with zero bytes.
---

# Hex.padLeft

Pads a **[Hex](/api/hex)** value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { padLeft } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.padLeft('0xdeadbeef')
// '0x00000000000000000000000000000000000000000000000000000000deadbeef'
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

const hex = Hex.padLeft(
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

const hex = Hex.padLeft(
  '0xdeadbeef',
  8, // [!code focus]
)
```
