---
description: Deserializes a Transaction Envelope from its serialized form.
---

# TransactionEnvelope.deserialize

**Alias:** `deserializeTransactionEnvelope`

Deserializes a Transaction Envelope from its serialized form.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { TransactionEnvelope } from 'ox'

// Entrypoint Imports
import * as TransactionEnvelope from 'ox/TransactionEnvelope'
import { deserializeTransactionEnvelope } from 'ox/TransactionEnvelope'
```

## Usage

The example below demonstrates how to deserialize a Transaction Envelope from its serialized form. Ox will also infer the transaction type from the first byte of the serialized hex value (e.g. `0x02` → `eip1559`).

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

const envelope = TransactionEnvelope.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
envelope.type
//       ^?




// @log: {
// @log:   type: 'eip1559',
// @log:   chainId: 1,
// @log:   nonce: 785n,
// @log:   maxFeePerGas: 2000000000n,
// @log:   maxPriorityFeePerGas: 2000000000n,
// @log:   gas: 1000000n,
// @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
// @log:   value: 1000000000000000000n,
// @log: }
```

### Explicit Deserialization

We can also deserialize a Transaction Envelope explicitly with:

- `.deserializeLegacy`
- `.deserializeEip1559`
- `.deserializeEip2930`
- `.deserializeEip4844`
- `.deserializeEip7702`

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

const envelope = TransactionEnvelope.deserializeEip1559('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
```

## Returns

TODO

## Parameters

TODO