---
description: Converts an EIP-2098 Compact Signature into a Signature.
---

# Signature.toCompact

**Alias:** `signatureToCompactSignature`

Converts a [Signature](/api/signature#signature) into an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) [CompactSignature](/api/signature#compactsignature).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { signatureToCompactSignature } from 'ox/Signature'
```

## Usage

```ts twoslash
import { Signature } from 'ox'

const signature = Signature.toCompact({
  r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
  s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
  yParity: 0,
})
// @log: {
// @log:   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
// @log:   yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
// @log: }
```

## Returns

[`CompactSignature`](/api/signature#compactsignature)

Compact signature object.

## Parameters

### signature

- **Type:** [`Signature`](/api/signature#signature-1)

Signature value.