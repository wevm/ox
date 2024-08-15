---
description: Decodes Hex into a string, number, bigint, boolean, or hex value.
---

# Hex.to 

**Alias:** `fromHex`

Decodes [Hex](/api/hex) into a string, number, bigint, boolean, or hex value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { fromHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const value = Hex.to('0x1a4', 'number')
// 420

const value = Hex.to('0x7761676d69', 'string')
// 'wagmi'
```

## Parameters

### hex

- **Type:** `Hex`

Hex to decode.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.to(
  '0x1a4', // [!code focus]
  'number'
)
```

### to

- **Type:** `'string' | 'hex' | 'bigint' | 'number' | 'boolean'`

Decode Hex into the specified type.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.to(
  '0x1a4', 
  'number' // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Hex. Sizes exceeding this value will throw an error.

```ts twoslash
import { Hex } from 'ox';

const value = Hex.to(
  '0x1a4', 
  'number',
  { size: 2 } // [!code focus]
)
```
