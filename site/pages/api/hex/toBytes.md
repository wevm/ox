---
description: Decodes Hex into a Bytes value
---

# Hex.toBytes

**Alias:** `hexToBytes`

Decodes [Hex](/api/hex) into a [Bytes](/api/bytes) value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { hexToBytes } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.toBytes('0xdeadbeef')
// Uint8Array([222, 173, 190, 239])
```

## Parameters

### hex

- **Type:** `Hex`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBytes(
  '0xdeadbeef', // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBytes(
  '0xdeadbeef', 
  { size: 8 } // [!code focus]
)
```
