---
description: Concatenates two or more Bytes values.
---

# Bytes.concat 

**Alias:** `concat`

Concatenates two or more [`Bytes`](/api/bytes) values.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { concat } from 'ox/Bytes'
```

## Usage

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.concat(
  Bytes.from([104, 101, 108, 108, 111]), 
  Bytes.from(true), 
  Bytes.from('world')
)
// Uint8Array([104, 101, 108, 108, 111, 1, 119, 111, 114, 108, 100])
```

## Return Type

`Uint8Array`

## Parameters

### ...values

- **Type:** `Uint8Array`

Bytes to concatenate.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.concat(
  Bytes.from([104, 101, 108, 108, 111]), // [!code focus]
  Bytes.from(true), // [!code focus]
  Bytes.from('world') // [!code focus]
)
```
