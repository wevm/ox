---
description: Checks if the given value is Bytes.
---

# Bytes.isBytes 

Checks if the given value is [Bytes](/api/bytes).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Bytes } from 'ox'

// Entrypoint Imports
import * as Bytes from 'ox/Bytes'
import { isBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const isBytes = Bytes.isBytes(Bytes.from([1]))
// true

const isBytes = Bytes.isBytes('0xdeadbeef')
// false
```

## Return Type

`boolean`

