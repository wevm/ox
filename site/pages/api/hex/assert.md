---
description: Asserts if the given value is Hex.
---

# Hex.assert 

- **Alias:** `assertHex`

Asserts if the given value is [Hex](/api/hex).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { assertHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

Hex.assert(Hex.from([1]))

Hex.assert(69n)
// InvalidHexTypeError: Value `69n` of type `bigint` is an invalid Hex value. Hex values must be of type `Hex`.
```

