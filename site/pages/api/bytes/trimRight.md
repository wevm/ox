---
description: Trims trailing zero bytes from a Bytes value.
---

# Bytes.trimRight

Trims trailing zero bytes from a **[Bytes](/api/bytes)** value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { trimRight } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.trimRight(Bytes.from([1, 2, 3, 4, 0, 0, 0, 0]))
// Uint8Array([1, 2, 3, 4])
```

## Return Type

`Uint8Array`
