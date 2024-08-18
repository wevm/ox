---
description: Decodes Bytes into a number
---

# Bytes.toNumber

**Alias:** `bytesToNumber`

Decodes [Bytes](/api/bytes) into a number.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { bytesToNumber } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const value = Bytes.toNumber(Bytes.from([1, 164]))
// 420
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to decode.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toNumber(
  Bytes.from([1, 164]), // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Bytes. Sizes exceeding this value will throw an error.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toNumber(
  Bytes.from([1, 164]), 
  { size: 2 } // [!code focus]
)
```
