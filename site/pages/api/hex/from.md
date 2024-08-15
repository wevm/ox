---
description: Encodes an arbitrary value to Hex.
---

# Hex.from 

**Alias:** `toHex`

Encodes an arbitrary value to **[Hex](/api/hex)**.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Hex } from 'ox'

// Named Imports
import * as Hex from 'ox/Hex'
import { toHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.from(420)
// '0x1a4'

const hex = Hex.from([420, 69])
// '0xa445'

const hex = Hex.from('abc');
// '0x616263'

const hex = Hex.from('abc', { size: 32 });
// '0x6162630000000000000000000000000000000000000000000000000000000000'

const hex = Hex.from(true, { size: 8 })
// '0x0000000000000001'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `string | bigint | number | boolean | Bytes | number[]`

An arbitrary value to encode to Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.from(
  'hello world' // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Hex.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.from(
  'hello world',
  { size: 32 } // [!code focus]
);
```