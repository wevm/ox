---
description: Encodes a Hex value to Bytes.
---

# Bytes.fromHex

**Alias:** `hexToBytes`

Encodes a [Hex](#TODO) value to **[Bytes](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Namespace Imports
import * as Bytes from 'ox/Bytes'
import { hexToBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.fromHex('0xdeadbeef')
// Uint8Array([222, 173, 190, 239])

const bytes = Bytes.fromHex('0xdeadbeef', { size: 8 })
// Uint8Array([222, 173, 190, 239, 0, 0, 0, 0])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `"0x${string}"`

Hex value to encode to Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromHex(
  '0xdeadbeef' // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.fromHex(
  '0xdeadbeef',
  { size: 32 } // [!code focus]
);
```