---
description: Decodes Bytes into a BigInt
---

# Bytes.toBigInt

**Alias:** `bytesToBigInt`

Decodes [Bytes](/api/bytes) into a BigInt.

## Imports

```ts twoslash
// @noErrors
// Namespace 
import { Bytes } from 'ox'

// Module
import * as Bytes from 'ox/Bytes'

// Function
import { bytesToBigInt } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const value = Bytes.toBigInt(Bytes.from([1, 164]))
// 420n
```

## Parameters

### bytes

- **Type:** `Uint8Array`

Bytes to decode.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toBigInt(
  Bytes.from([1, 164]), // [!code focus]
)
```

### options

#### options.size

- **Type:** `number`

Maximum size of the input Bytes. Sizes exceeding this value will throw an error.

```ts twoslash
import { Bytes } from 'ox';

const value = Bytes.toBigInt(
  Bytes.from([1, 164]), 
  { size: 2 } // [!code focus]
)
```
