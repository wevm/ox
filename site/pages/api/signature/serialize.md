---
description: Deserializes a Bytes or Hex signature into a structured Signature.
---

# Signature.serialize

**Alias:** `serializeSignature`

Serializes a [Signature](/api/signature#signature-1) (or an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) [CompactSignature](/api/signature#compactsignature)) to [Hex](/api/hex) or [Bytes](/api/bytes).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Signature } from 'ox'

// Entrypoint Imports
import * as Signature from 'ox/Signature'
import { serializeSignature } from 'ox/Signature'
```

## Usage

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const signature = Signature.serialize({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1
})
// @log: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c'

// Serialize into a compact signature.
const signature = Signature.serialize({
  r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
  s: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
  yParity: 0
}, { compact: true })
// @log: '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'

// Serialize a Compact Signature.
const signature = Signature.serialize({
  r: 47323457007453657207889730243826965761922296599680473886588287015755652701072n,
  yParityAndS: 57228803202727131502949358313456071280488184270258293674242124340113824882788n,
})
// @log: '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'
```

## Returns

`Hex | Bytes`

The serialized signature.

## Parameters

### signature

- **Type:** `Signature | LegacySignature | CompactSignature`

Signature to serialize.

```ts twoslash
import { Signature } from 'ox'

const signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1
})

const serialized = Signature.serialize(
  signature // [!code focus]
)
```

### options.compact

- **Type:** `boolean`

Whether or not to serialize the signature into a compact signature.

```ts twoslash
import { Signature } from 'ox'

const signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1
})

const serialized = Signature.serialize(
  signature,
  { compact: true } // [!code focus]
)
// @log: '0x68a020a209d3d56c46f38cc50a33f704f4a9a10a59377f8dd762ac66910e9b907e865ad05c4035ab5792787d4a0297a43617ae897930a6fe4d822b8faea52064'
```

### options.to

- **Type:** `'bytes' | 'hex'`

Format to serialize the signature into.

```ts twoslash
import { Signature } from 'ox'

const signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1
})

const serialized = Signature.serialize(
  signature,
  { to: 'bytes' } // [!code focus]
)
// @log: Uint8Array(65) [ ... ]
```