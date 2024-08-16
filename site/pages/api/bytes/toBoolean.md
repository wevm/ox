---
description: Decodes Bytes into a boolean value
---

# Bytes.toBoolean

**Alias:** `bytesToBoolean`

Decodes [Bytes](/api/bytes) into a boolean value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { bytesToBoolean } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const value = Bytes.toBoolean(Bytes.from([0, 0, 0, 1]))
// true
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to decode.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toBoolean(
  Bytes.from([0, 0, 0, 1]), // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Bytes. Sizes exceeding this value will throw an error.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toBoolean(
  Bytes.from([0, 0, 0, 1]), 
  { size: 8 } // [!code focus]
)
```
