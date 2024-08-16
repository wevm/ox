---
description: Formats a Value to its string representation.
---

# format

- **Alias:** `formatValue`

Formats a `bigint` Value to its string representation (divided by the given exponent).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Value } from 'ox'

// Named Imports
import * as Value from 'ox/Value'
import { formatValue } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.format(420_000_000_000n, 9)
// '420'
```

## Return Type

`string`

## Parameters

### value

- **Type:** `string`

The `bigint` Value to format.

### exponent

- **Type:** `number`

The exponent to divide the `bigint` Value by.

