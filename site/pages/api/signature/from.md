---
description: Instantiates a typed Signature object from a compatible signature value.
---

# Signature.from

**Alias:** `toSignature`

Instantiates a typed [Signature](/api/signature#signature-1) object from a [Signature](/api/signature#signature-1), [CompactSignature](/api/signature#compactsignature), [LegacySignature](#legacysignature), [Bytes](/api/bytes), or [Hex](/api/hex).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { toSignature } from 'ox/Signature'
```

## Usage

```ts twoslash
// @noErrors
import { Signature } from 'ox'

// from Serialized Hex Signature
const signature = Signature.from('0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db801')
// @log: {
// @log:   r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
// @log:   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
// @log:   yParity: 1,
// @log: }

// from Compact Signature
const signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
})

// from Legacy Signature
const signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  v: 28,
})
```

## Returns

[`Signature`](/api/signature#signature-1)

Signature object.

## Parameters

### value

- **Type:** `Signature | CompactSignature | LegacySignature | Bytes | Hex`

A signature value represented as a [Signature](/api/signature#signature-1), [CompactSignature](/api/signature#compactsignature), [LegacySignature](/api/signature#legacysignature), [Bytes](/api/bytes), or [Hex](/api/hex).