---
description: Retrieves the size of a Hex value.
---

# Hex.size

Retrieves the size of a **[Hex](/api/hex)** value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Hex } from 'ox'

// Module Imports
import * as Hex from 'ox/Hex'
import { size } from 'ox/Hex'
```

## Usage

```ts twoslash
// @noErrors
import { Hex } from 'ox';

const hex = Hex.size('0xdeadbeef')
// 4
```

## Return Type

`number`