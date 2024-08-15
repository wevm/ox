---
description: Decodes Hex into a boolean value
---

# Hex.toBoolean

**Alias:** `hexToBoolean`

Decodes [Hex](/api/hex) into a boolean value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { hexToBoolean } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.toBoolean('0x00000001')
// true
```

## Parameters

### hex

- **Type:** `Hex`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBoolean(
  '0x00000001', // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.toBoolean(
  '0x00000001', 
  { size: 8 } // [!code focus]
)
```
