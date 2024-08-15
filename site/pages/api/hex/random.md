---
description: Generates random Hex of the specified length.
---

# Hex.random 

**Alias:** `randomHex`

Generates random [`Hex`](/api/bytes) of the specified length.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { randomHex } from 'ox/Hex'
```

## Usage

```ts twoslash
import { Hex } from 'ox';

const bytes = Hex.random(10)
// '0xa2bd4a345a4d1abcf311'
```

## Return Type

`Hex`
