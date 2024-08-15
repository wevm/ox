---
description: Trims trailing zero bytes from a Bytes value.
---

# Bytes.trimRight

Trims trailing zero bytes from a **[Bytes](/api/bytes)** value.

## Imports

```ts twoslash
// @noErrors
// Namespace 
import { Bytes } from 'ox'

// Module
import * as Bytes from 'ox/Bytes'

// Function
import { trimRight } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.trimRight(Bytes.from([1, 2, 3, 4, 0, 0, 0, 0]))
// Uint8Array([1, 2, 3, 4])
```

## Return Type

`Uint8Array`
