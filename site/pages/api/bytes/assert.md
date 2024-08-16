---
description: Asserts if the given value is Bytes.
---

# Bytes.assert 

- **Alias:** `assertBytes`

Asserts if the given value is [Bytes](/api/bytes).

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Bytes } from 'ox'

// Module Imports
import * as Bytes from 'ox/Bytes'
import { assertBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

Bytes.assert(Bytes.from([1]))

Bytes.assert('0xdeadbeef')
// InvalidBytesTypeError: Value `"0xdeadbeef"` of type `string` is an invalid Bytes value. Bytes values must be of type `Bytes`.
```

