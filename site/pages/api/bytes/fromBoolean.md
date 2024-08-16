---
description: Encodes a boolean value to Uint8Array Bytes.
---

# Bytes.fromBoolean 

**Alias:** `booleanToBytes`

Encodes a boolean value to **[Bytes](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { booleanToBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.fromBoolean(true)
// Uint8Array([1])

const bytes = Bytes.fromBoolean(false)
// Uint8Array([0])

const bytes = Bytes.fromBoolean(true, { size: 4 })
// Uint8Array([0, 0, 0, 1])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `boolean`

The boolean value to encode to Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBoolean(
  true // [!code focus]
);
```

### options

#### options.size 

- **Type:** `boolean`

Size of the output Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromBoolean(
  true,
  { size: 32 } // [!code focus]
);
```