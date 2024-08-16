---
description: Parses a string representation of an Ether value.
---

# Value.fromEther

- **Alias:** `parseEther`

Parses a string representation of Ether to a `bigint` Value (default: wei).

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Value } from 'ox'

// Module Imports
import * as Value from 'ox/Value'
import { parseEther } from 'ox/Value'
```

## Usage

```ts twoslash
// @noErrors
import { Value } from 'ox'

const value = Value.fromEther('1')
// 1_000_000_000_000_000_000n

const value = Value.fromEther('0.5', 'gwei')
// 500_000_000n
```

## Return Type

`bigint`

## Parameters

### value

- **Type:** `string`

The string representation of the Value.

### unit

- **Type:** `'wei' | 'gwei' | 'szabo' | 'finney'`
- **Default:** `'wei'`

The unit to parse the value into.

