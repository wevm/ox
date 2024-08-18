---
description: Returns a section of a Hex value given a start (and end) bytes offset.
---

# Hex.slice

Returns a section of a **[Hex](/api/hex)** value given a start (and end) bytes offset.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { slice } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

Hex.slice('0xdeadbeefdeadbeef', 1, 4)
// '0xadbeef'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `Hex`

The **[Hex](/api/bytes)** value to slice.

```ts twoslash
// @noErrors
import { Hex } from 'ox';

Hex.slice(
  '0xdeadbeefdeadbeef', // [!code focus]
  1, 
  4
)
```

### start

- **Type:** `number`

Start index of the section to slice (inclusive).

```ts twoslash
// @noErrors
import { Hex } from 'ox';

Hex.slice(
  '0xdeadbeefdeadbeef',
  1, // [!code focus]
  4
)
```

### end (optional) 

- **Type:** `number`

End index of the section to slice (exclusive).

```ts twoslash
// @noErrors
import { Hex } from 'ox';

Hex.slice(
  '0xdeadbeefdeadbeef',
  1,
  4 // [!code focus]
)
```