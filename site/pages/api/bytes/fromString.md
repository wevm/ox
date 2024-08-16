---
description: Encodes a string value to Bytes.
---

# Bytes.fromString

**Alias:** `hexToBytes`

Encodes a string value to **[Bytes](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { hexToBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.fromString('abc')
// Uint8Array([97, 98, 99])

const bytes = Bytes.fromString('abc', { size: 8 })
// Uint8Array([97, 98, 99, 0, 0, 0, 0, 0])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `string`

String to encode to Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromString(
  'abc' // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromString(
  'abc',
  { size: 32 } // [!code focus]
);
```