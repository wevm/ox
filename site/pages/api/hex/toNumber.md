---
description: Decodes Hex into a number
---

# Hex.toNumber

**Alias:** `hexToNumber`

Decodes [Hex](/api/hex) into a number.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { hexToNumber } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.toNumber('0x1a4')
// 420
```

## Parameters

### hex

- **Type:** `Hex`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toNumber(
  '0x1a4', // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toNumber(
  '0x1a4', 
  { size: 2 } // [!code focus]
)
```
