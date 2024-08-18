---
description: Generates random Bytes of the specified length.
---

# Bytes.random 

**Alias:** `randomBytes`

Generates random [`Bytes`](/api/bytes) of the specified length.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { randomBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.random(10)
// Uint8Array([104, 101, 108, 108, 111, 1, 119, 111, 114, 108])
```

## Return Type

`Uint8Array`
