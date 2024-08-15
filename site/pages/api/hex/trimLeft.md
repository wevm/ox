---
description: Trims leading zeroes from a Hex value.
---

# Hex.trimLeft

Trims leading zeroes from a **[Hex](/api/bytes)** value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Namespace Imports
import * as Hex from 'ox/Hex'
import { trimLeft } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.trimLeft('0x00000000deadbeef')
// '0xdeadbeef'
```

## Return Type

`Hex`
