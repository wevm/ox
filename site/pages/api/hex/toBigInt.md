---
description: Decodes Hex into a BigInt
---

# Hex.toBigInt

**Alias:** `bytesToBigInt`

Decodes [Hex](/api/bytes) into a BigInt.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { bytesToBigInt } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.toBigInt('0x1a4')
// 420n
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBigInt(
  '0x1a4', // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBigInt(
  '0x1a4', 
  { size: 2 } // [!code focus]
)
```
