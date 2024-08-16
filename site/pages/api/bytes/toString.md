---
description: Decodes Bytes into a UTF-8 string
---

# Bytes.toString

**Alias:** `bytesToString`

Decodes [Bytes](/api/bytes) into a UTF-8 string.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { bytesToString } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const value = Bytes.toString(Bytes.from([97, 98, 99]))
// 'abc'
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to decode.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toString(
  Bytes.from([97, 98, 99]), // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Bytes. Sizes exceeding this value will throw an error.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toString(
  Bytes.from([97, 98, 99]), 
  { size: 2 } // [!code focus]
)
```
