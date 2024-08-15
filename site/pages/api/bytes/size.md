---
description: Retrieves the size of a Bytes value.
---

# Bytes.size

Retrieves the size of a **[Bytes](/api/bytes)** value.

## Imports

```ts twoslash
// @noErrors
// Namespace 
import { Bytes } from 'ox'

// Module
import * as Bytes from 'ox/Bytes'

// Function
import { size } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.size(Bytes.from([1, 2, 3, 4]))
// 4
```

## Return Type

`number`