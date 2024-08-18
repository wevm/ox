---
description: Encodes a string value to Hex.
---

# Hex.fromString

**Alias:** `hexToHex`

Encodes a string value to **[Hex](/api/hex)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { hexToHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const bytes = Hex.fromString('abc')
// '0x616263'

const bytes = Hex.fromString('abc', { size: 8 })
// '0x6162630000000000'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `string`

String to encode to Hex.

```ts twoslash
import { Hex } from 'ox';

const bytes = Hex.fromString(
  'abc' // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Hex.

```ts twoslash
import { Hex } from 'ox';

const bytes = Hex.fromString(
  'abc',
  { size: 32 } // [!code focus]
);
```