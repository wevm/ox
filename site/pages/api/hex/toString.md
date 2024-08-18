---
description: Decodes Hex into a UTF-8 string
---

# Hex.toString

**Alias:** `hexToString`

Decodes [Hex](/api/hex) into a UTF-8 string.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { hexToString } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.toString('0x616263')
// 'abc'
```

## Parameters

### hex

- **Type:** `Hex`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toString(
  '0x616263', // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toString(
  '0x616263', 
  { size: 2 } // [!code focus]
)
```
