---
description: Converts an EIP-2098 Compact Signature into a Signature.
---

# Signature.fromCompact

**Alias:** `compactSignatureToSignature`

Converts an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) [CompactSignature](/api/signature#compactsignature) into a [Signature](/api/signature#signature).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { compactSignatureToSignature } from 'ox/Signature'
```

## Usage

```ts twoslash
import { Signature } from 'ox'

const signature = Signature.fromCompact({
  r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
  yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
})
// @log: {
// @log:   r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
// @log:   s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
// @log:   yParity: 0
// @log: }
```

## Returns

[`Signature`](/api/signature#signature-1)

Signature object.

## Parameters

### compactSignature

- **Type:** [`CompactSignature`](/api/signature#compactsignature)

Compact signature value.