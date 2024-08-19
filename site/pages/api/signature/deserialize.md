---
description: Deserializes a Bytes or Hex signature into a structured Signature.
---

# Signature.deserialize

**Alias:** `deserializeSignature`

Deserializes a [Bytes](/api/bytes) or [Hex](/api/hex) signature into a structured [Signature](/api/signature#signature-1).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { deserializeSignature } from 'ox/Signature'
```

## Usage

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const signature = Signature.deserialize('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c')
// @log: {
// @log:   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
// @log:   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
// @log:   yParity: 1,
// @log: }
```

## Returns

[`Signature`](/api/signature#signature-1).

Signature object.

## Parameters

### serializedSignature

- **Type:** `Bytes | Hex`

Signature to deserialize.