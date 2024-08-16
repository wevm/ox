---
description: Pads a Bytes value to the left with zero bytes.
---

# Bytes.padLeft

Pads a **[Bytes](/api/bytes)** value to the left with zero bytes until it reaches the given `size` (default: 32 bytes).

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { padLeft } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.padLeft(Bytes.from([1, 2, 3, 4]))
// Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4])
```

## Return Type

`Uint8Array`

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to pad.

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.padLeft(
  Bytes.from([1, 2, 3, 4]), // [!code focus]
)
```

### size

- **Type:** `number`
- **Default:** `32`

Size (in bytes) to pad to.

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.padLeft(
  Bytes.from([1, 2, 3, 4]),
  8, // [!code focus]
)
```
