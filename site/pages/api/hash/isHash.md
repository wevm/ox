---
description: Checks if a string is a valid hash value.
---

# Hash.isHash

Checks if a string is a valid 32 byte hash value.

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Hash } from 'ox'

// Module Imports
import * as Hash from 'ox/Hash'
import { isHash } from 'ox/Hash'
```

## Usage

```ts twoslash
// @noErrors
import { Hash } from 'ox'

const value = Hash.isHash('0xdeadbeef')
// false

const value = Hash.isHash('0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1')
// true
```

## Returns

`boolean`

Whether the value is a valid hash.
