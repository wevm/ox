---
description: Parses a string representation of a Gwei value.
---

# fromGwei

- **Alias:** `parseGwei`

Parses a string representation of Gwei to a `bigint` Value (default: wei).

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Value } from 'ox'

// Module Imports
import * as Value from 'ox/Value'
import { parseGwei } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.fromGwei('1')
// 1_000_000_000n
```

## Return Type

`bigint`

## Parameters

### value

- **Type:** `string`

The string representation of the Value.

