---
description: Formats a Value to its string representation of Gwei.
---

# formatGwei

Formats a `bigint` Value (default: wei) to a string representation of Gwei.

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Value } from 'ox'

// Module Imports
import * as Value from 'ox/Value'
import { formatGwei } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.formatGwei(1_000_000_000n)
// '1'
```

## Return Type

`string`

## Parameters

### value

- **Type:** `string`

The `bigint` Value to format.

