---
description: Trims trailing zeroes from a Hex value.
---

# Hex.trimRight

Trims trailing zeroes from a **[Hex](/api/hex)** value.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { trimRight } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.trimRight('0xdeadbeef00000000')
// '0xdeadbeef'
```

## Return Type

`Hex`
