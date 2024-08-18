---
description: Checks if two Hex values are equal.
---

# Hex.isEqual 

**Alias:** `isHexEqual`

Checks if two [`Hex`](/api/hex) values are equal.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { isHexEqual } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const isEqual = Hex.isEqual('0xdeadbeef', '0xdeadbeef')
// true

const isEqual = Hex.isEqual('0xdeadbeef', '0xcafebabe')
// false
```

## Return Type

`boolean`

