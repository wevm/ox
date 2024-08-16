---
description: Checks if the given value is Hex.
---

# Hex.isHex 

Checks if the given value is [Hex](/api/bytes).

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { isHex } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const isHex = Hex.isHex('0xdeadbeef')
// true

const isHex = Hex.isHex('lolcats')
// false
```

## Return Type

`boolean`

