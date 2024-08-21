---
description: Serializes a Transaction Envelope
---

# TransactionEnvelope.serialize

**Alias:** `serializeTransactionEnvelope`

Serializes a Transaction Envelope into a [Hex](/api/hex) value. Commonly used for signing and sending transactions via the Network.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { TransactionEnvelope } from 'ox'

// Entrypoint Imports
import * as TransactionEnvelope from 'ox/TransactionEnvelope'
import { serializeTransactionEnvelope } from 'ox/TransactionEnvelope'
```

## Usage

```ts twoslash
// @noErrors
import { TransactionEnvelope, Value } from 'ox'

const envelope = TransactionEnvelope.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})

const serialized = TransactionEnvelope.serialize(envelope) // [!code focus]
serialized // [!code focus]
//    ^?


```

### Explicit Serialization

We can also serialize a Transaction Envelope explicitly with:

- `.serializeLegacy`
- `.serializeEip1559`
- `.serializeEip2930`
- `.serializeEip4844`
- `.serializeEip7702`

```ts twoslash
// @noErrors
import { TransactionEnvelope, Value } from 'ox'

const envelope = TransactionEnvelope.fromEip2930({
  accessList: [/* ... */],
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
  value: Value.fromEther('1'),
})

const serialized = TransactionEnvelope.serializeEip2930(envelope) // [!code focus]
serialized // [!code focus]
//    ^?


```

### Signatures

We can also add a signature to a Transaction Envelope with the `signature` option. The example below demonstrates an end-to-end example of signing a Transaction Envelope with a [Secp256k1 Private Key](/api/secp256k1/sign).

```ts twoslash
// @noErrors
import { TransactionEnvelope, Secp256k1, Value } from 'ox'

// 1. Define the Transaction Envelope.
const envelope = TransactionEnvelope.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})

// 2. Sign the Transaction Envelope.
const signature = Secp256k1.sign({
  payload: TransactionEnvelope.hash(envelope),
  privateKey: '0x...'
})

// 3. Serialize the Transaction Envelope with the signature. // [!code focus]
const serialized = TransactionEnvelope.serialize(envelope, {  // [!code focus]
  signature  // [!code focus] // [!code hl]
}) // [!code focus]

// 4. Send the serialized Transaction Envelope to the Network.
// ...
```

## Returns

TODO

## Parameters

TODO