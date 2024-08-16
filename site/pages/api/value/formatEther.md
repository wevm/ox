---
description: Formats a Value to its string representation of Ether.
---

# Value.formatEther

Formats a `bigint` Value (default: wei) to a string representation of Ether.

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Value } from 'ox'

// Module Imports
import * as Value from 'ox/Value'
import { formatEther } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.formatEther(1_000_000_000_000_000_000n)
// '1'
```

## Return Type

`string`

## Parameters

### value

- **Type:** `string`

The `bigint` Value to format.

### unit

- **Type:** `'wei' | 'gwei' | 'szabo' | 'finney'`
- **Default:** `'wei'`

The type of unit to format the `bigint` Value from.

