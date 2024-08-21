---
description: Asserts that the signature is valid.
---

# Signature.assert

**Alias:** `assertSignature`

Asserts that the signature is valid.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { assert } from 'ox/Signature'
```

## Usage

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const signature = Signature.assert({
  r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1
})
// @error: InvalidSignatureRError: Value `-49782753348462494199823712700004552394425719014458918871452329774910450607807n` is an invalid r value. r must be a positive integer less than 2^256.
```

## Parameters

### signature

- **Type:** `Signature`

Signature to assert.
