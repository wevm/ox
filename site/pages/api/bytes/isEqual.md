---
description: Checks if two Bytes values are equal.
---

# Bytes.isEqual 

**Alias:** `isBytesEqual`

Checks if two [`Bytes`](/api/bytes) values are equal.

## Imports

```ts twoslash
// @noErrors
// Namespace 
import { Bytes } from 'ox'

// Module
import * as Bytes from 'ox/Bytes'

// Function
import { isBytesEqual } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const isEqual = Bytes.isEqual(Bytes.from([1]), Bytes.from([1]))
// true

const isEqual = Bytes.isEqual(Bytes.from([1]), Bytes.from([2]))
// false
```

## Return Type

`boolean`

