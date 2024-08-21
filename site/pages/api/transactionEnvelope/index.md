# TransactionEnvelope

The **TransactionEnvelope** Module provides a set of utility functions for working with **Legacy Transaction Envelopes** & [EIP-2718 Typed Transaction Envelopes](https://eips.ethereum.org/EIPS/eip-2718).

## Functions

| Module                                                                    | Description                                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`TransactionEnvelope.from`](/api/transactionEnvelope/from)               | Converts an arbitrary transaction object into a typed Transaction Envelope. |
| [`TransactionEnvelope.assert`](/api/transactionEnvelope/assert)           | Asserts a Transaction Envelope is valid.                                    |
| [`TransactionEnvelope.deserialize`](/api/transactionEnvelope/deserialize) | Deserializes a Transaction Envelope from its serialized form.               |
| [`TransactionEnvelope.hash`](/api/transactionEnvelope/hash)               | Hashes a Transaction Envelope for signing.                                  |
| [`TransactionEnvelope.serialize`](/api/transactionEnvelope/serialize)     | Serializes a Transaction Envelope.                                          |

## Types

### `TransactionEnvelope`

The `TransactionEnvelope` type is a JavaScript `object` that represents a union of typed Transaction Envelopes (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702, etc).



```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.TransactionEnvelope
//                           ^?













```

### `TransactionEnvelopeLegacy`

An object that represents a Legacy Transaction Envelope.

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.Legacy
//                           ^?













```

### `TransactionEnvelopeEip2930`

An object that represents an [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Transaction Envelope.

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.Eip2930
//                           ^?













```

### `TransactionEnvelopeEip1559`

An object that represents an [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) Transaction Envelope.

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.Eip1559
//                           ^?













```

### `TransactionEnvelopeEip4844`

An object that represents an [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Transaction Envelope.

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.Eip4844
//                           ^?













```

### `TransactionEnvelopeEip7702`

An object that represents an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Transaction Envelope.

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

type T = TransactionEnvelope.Eip7702
//                           ^?













```

