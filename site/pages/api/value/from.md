---
description: Parses a string representation of units.
---

# from

- **Alias:** `parseValue`

Parses a `string` representation of a Value to `bigint` (multiplied by the given exponent).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Value } from 'ox'

// Named Imports
import * as Value from 'ox/Value'
import { parseValue } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.from('1', 18)
// 1_000_000_000_000_000_000n

const value = Value.from('45.1', 9)
// 45_100_000_000n
```

## Return Type

`bigint`

## Parameters

### value

- **Type:** `string`

The string representation of the Value.

### exponent

- **Type:** `number`

The exponent to multiply the parsed value by.

