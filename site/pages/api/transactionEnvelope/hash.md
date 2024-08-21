---
description: Hashes a transaction envelope for signing.
---

# TransactionEnvelope.hash

Hashes a transaction envelope for signing.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { TransactionEnvelope } from 'ox'

// Entrypoint Imports
import * as TransactionEnvelope from 'ox/TransactionEnvelope'
import { hashTransactionEnvelope } from 'ox/TransactionEnvelope'
```

## Usage

```ts twoslash
// @noErrors
import { TransactionEnvelope, Secp256k1, Value } from 'ox'

const envelope = TransactionEnvelope.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})

const hash = TransactionEnvelope.hash(envelope) // [!code focus]

const signature = Secp256k1.sign({
  payload: hash,
  privateKey: '0x...',
})
```

## Returns

TODO

## Parameters

TODO