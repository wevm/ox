---
description: Encodes a boolean value to Hex.
---

# Hex.fromBoolean 

**Alias:** `booleanToHex`

Encodes a boolean value to **[Hex](/api/hex)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { booleanToHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.fromBoolean(true)
// '0x1'

const hex = Hex.fromBoolean(false)
// '0x0'

const hex = Hex.fromBoolean(true, { size: 4 })
// '0x00000001'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `boolean`

The boolean value to encode to Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBoolean(
  true // [!code focus]
);
```

### options

#### options.size 

- **Type:** `boolean`

Size of the output Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.fromBoolean(
  true,
  { size: 32 } // [!code focus]
);
```