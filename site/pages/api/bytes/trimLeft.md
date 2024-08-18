---
description: Trims leading zero bytes from a Bytes value.
---

# Bytes.trimLeft

Trims leading zero bytes from a **[Bytes](/api/bytes)** value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { trimLeft } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.trimLeft(Bytes.from([0, 0, 0, 0, 1, 2, 3, 4]))
// Uint8Array([1, 2, 3, 4])
```

## Return Type

`Uint8Array`
