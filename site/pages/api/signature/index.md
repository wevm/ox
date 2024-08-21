# Signature

The **Signature** Module provides a set of utility functions for working with ECDSA signatures.

## Functions

| Module                                                | Description                                                                                                                                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`Signature.from`](/api/signature/from)               | Instantiates a typed [Signature](#signature) object from a [Signature](#signature), [CompactSignature](#compactsignature), [LegacySignature](#legacysignature), [Bytes](/api/bytes), or [Hex](/api/hex). |
| [`Signature.fromCompact`](/api/signature/fromCompact) | Converts an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) [Compact Signature](#compactsignature) into a [Signature](#signature).                                                                   |
| [`Signature.assert`](/api/signature/assert)           | Asserts that a Signature is valid.                                                                                                                                                                       |
| [`Signature.deserialize`](/api/signature/deserialize) | Deserializes a [Bytes](/api/bytes) or [Hex](/api/hex) signature into a structured [Signature](#signature).                                                                                               |
| [`Signature.serialize`](/api/signature/serialize)     | Serializes a [Signature](#signature) to [Bytes](/api/bytes) or [Hex](/api/hex).                                                                                                                          |
| [`Signature.toCompact`](/api/signature/toCompact)     | Converts a [Signature](#signature) into an [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) [CompactSignature](#compactsignature).                                                                    |

## Types

### `Signature`

An ECDSA **Signature** can be represented via the `Signature` type. It is a JavaScript `object` with `r`, `s`, and `yParity` properties.

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const Signature = Signature.from({
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  yParity: 1,
}) satisfies Signature.Signature
//                     ^?








```

### `CompactSignature`

Ox also has support for [EIP-2098](https://eips.ethereum.org/EIPS/eip-2098) Compact Signatures. A Compact Signature is represented via the `CompactSignature` type, and is a JavaScript `object` with `r` and `yParityAndS` properties.

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const signature = {
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  yParityAndS: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
} satisfies Signature.Compact
//                    ^?







```

### `LegacySignature`

Ox supports ECDSA signatures that consist of a legacy `v` value. A Legacy Signature is represented via the `LegacySignature` type, and is a JavaScript `object` with `r`, `s`, and `v` properties.

```ts twoslash
// @noErrors
import { Signature } from 'ox'

const signature = {
  r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
  s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
  v: 27,
} satisfies Signature.Legacy
//                    ^?








```
