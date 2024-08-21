---
description: Asserts that a Transaction Envelope is valid.
---

# TransactionEnvelope.assert

**Alias:** `assertTransactionEnvelope`

Asserts that a Transaction Envelope is valid.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { TransactionEnvelope } from 'ox'

// Entrypoint Imports
import * as TransactionEnvelope from 'ox/TransactionEnvelope'
import { assertTransactionEnvelope } from 'ox/TransactionEnvelope'
```

## Usage

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

TransactionEnvelope.assert({
  chainId: 0,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})
// @error: InvalidChainIdError: Chain ID "0" is invalid.
```

### Explicit Serialization

We can also assert a Transaction Envelope explicitly with:

- `.assertLegacy`
- `.assertEip1559`
- `.assertEip2930`
- `.assertEip4844`
- `.assertEip7702`

```ts twoslash
// @noErrors
import { TransactionEnvelope } from 'ox'

TransactionEnvelope.assertEip1559({
  chainId: 0,
  maxFeePerGas: Value.fromGwei('10'),
  to: '0x0000000000000000000000000000000000000000',
})
// @error: InvalidChainIdError: Chain ID "0" is invalid.
```

## Parameters

TODO