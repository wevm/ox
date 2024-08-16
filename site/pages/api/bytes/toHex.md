---
description: Decodes Bytes into a Hex value
---

# Bytes.toHex

**Alias:** `bytesToHex`

Decodes [Bytes](/api/bytes) into a [Hex](#TODO) value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { bytesToHex } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const value = Bytes.toHex(Bytes.from([222, 173, 190, 239]))
// '0xdeadbeef'
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to decode.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toHex(
  Bytes.from([222, 173, 190, 239]), // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Bytes. Sizes exceeding this value will throw an error.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toHex(
  Bytes.from([222, 173, 190, 239]), 
  { size: 8 } // [!code focus]
)
```
