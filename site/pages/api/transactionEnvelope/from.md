---
description: Converts an arbitrary transaction object into a typed Transaction Envelope.
---

# TransactionEnvelope.from

**Alias:** `toTransactionEnvelope`

Converts an arbitrary transaction object into an [EIP-2718 Typed Transaction Envelope](https://eips.ethereum.org/EIPS/eip-2718).

## Imports

```ts twoslash
// @noErrors
// Named Import
import { TransactionEnvelope } from 'ox'

// Entrypoint Imports
import * as TransactionEnvelope from 'ox/TransactionEnvelope'
import { toTransactionEnvelope } from 'ox/TransactionEnvelope'
```

## Usage

We can instantiate a Transaction Envelope from an arbitrary object using the `.from` function. Ox will infer the type of the Transaction Envelope based on the object's properties.

```ts twoslash
// @noErrors
import { TransactionEnvelope, Value } from 'ox'

// Instantiating an EIP-1559 Transaction Envelope.
const envelope = TransactionEnvelope.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})
envelope.type
//       ^?



// Instantiating a Legacy Transaction Envelope.
const envelope_2 = TransactionEnvelope.from({
  gasPrice: 69420n,
  to: '0x0000000000000000000000000000000000000000',
})
envelope_2.type
//         ^?


```

### Explicit Instantiation

We can also define a Transaction Envelope explicitly with:

- `.fromLegacy`
- `.fromEip1559`
- `.fromEip2930`
- `.fromEip4844`
- `.fromEip7702`

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
envelope.type
//       ^?  


```

## Returns

TODO

## Parameters

TODO