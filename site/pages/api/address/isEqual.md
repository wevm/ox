---
description: Checks if two addresses are equal
---

# Address.isEqual 

**Alias:** `isAddressEqual`

Checks if two addresses are equal.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Address } from 'ox'

// Entrypoint Imports
import * as Address from 'ox/Address'
import { isAddressEqual } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

const isEqual = Address.isEqual(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
  '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
)
// true

const isEqual = Address.isEqual(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
  '0xA0Cf798816D4b9b9866b5330EEa46a18382f251f'
)
// false
```

## Return Type

`boolean`

Whether the addresses are equal.
