---
description: Concatenates two or more Hex values.
---

# Hex.concat 

**Alias:** `concat`

Concatenates two or more [`Hex`](/api/hex) values.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Hex } from 'ox'

// Entrypoint Imports
import * as Hex from 'ox/Hex'
import { concat } from 'ox/Hex'
```

## Usage

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.concat(
  '0xdeadbeef', 
  Hex.from(true), 
  Hex.from('world')
)
// '0xdeadbeef1776f726c64'
```

## Return Type

`Hex`

## Parameters

### ...values

- **Type:** `Hex`

Hex values to concatenate.

```ts twoslash
import { Hex } from 'ox';

const hex = Hex.concat(
  '0xdeadbeef', // [!code focus]
  Hex.from(true), // [!code focus]
  Hex.from('world') // [!code focus]
)
```
