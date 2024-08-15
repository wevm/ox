---
description: Returns a section of a Bytes value given a start (and end) bytes offset.
---

# Bytes.slice

Returns a section of a **[Bytes](/api/bytes)** value given a start (and end) bytes offset.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Namespace Imports
import * as Bytes from 'ox/Bytes'
import { slice } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

Bytes.slice(Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), 1, 4)
// Uint8Array([2, 3, 4])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `Uint8Array`

The **[Bytes](/api/bytes)** value to slice.

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

Bytes.slice(
  Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]), // [!code focus]
  1, 
  4
)
```

### start

- **Type:** `number`

Start index of the section to slice (inclusive).

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

Bytes.slice(
  Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  1, // [!code focus]
  4
)
```

### end (optional) 

- **Type:** `number`

End index of the section to slice (exclusive).

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

Bytes.slice(
  Bytes.from([1, 2, 3, 4, 5, 6, 7, 8, 9]),
  1,
  4 // [!code focus]
)
```