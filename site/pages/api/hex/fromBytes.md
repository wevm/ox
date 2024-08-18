---
description: Encodes a Hex value to Hex.
---

# Hex.fromBytes

**Alias:** `bytesToHex`

Encodes a [Hex](#TODO) value to **[Hex](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { bytesToHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes, Hex } from 'ox';

const bytes = Hex.fromBytes(Bytes.from([222, 173, 190, 239]))
// '0xdeadbeef'

const bytes = Hex.fromBytes(Bytes.from([222, 173, 190, 239]), { size: 8 })
// '0xdeadbeef00000000'
```

## Return Type

`Hex`

## Parameters

### value

- **Type:** `"0x${string}"`

Hex value to encode to Hex.

```ts twoslash
import { Bytes, Hex } from 'ox';

const bytes = Hex.fromBytes(
  Bytes.from([222, 173, 190, 239]) // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Hex.

```ts twoslash
import { Bytes, Hex } from 'ox';

const bytes = Hex.fromBytes(
  Bytes.from([222, 173, 190, 239]),
  { size: 32 } // [!code focus]
);
```