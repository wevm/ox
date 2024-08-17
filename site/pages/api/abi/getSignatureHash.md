---
description: Computes the signature hash for an ABI Item.
---

# Abi.getSignatureHash

Computes the signature hash for an ABI Item.

Useful for computing **Event Topic** values.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Abi } from 'ox'

// Module Imports
import * as Abi from 'ox/Abi'
import { getSignatureHash } from 'ox/Abi'
```

## Usage

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const hash = Abi.getSignatureHash('event Transfer(address indexed from, address indexed to, uint256 amount)')
// '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const hash = Abi.getSignatureHash({
  name: 'Transfer',
  type: 'event',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'amount', type: 'uint256', indexed: false },
  ],
})
// '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
```

## Returns

`Hex`

The `keccak256` hash of the ABI Item's signature.

## Parameters

### abiItem

- **Type:** `string | AbiItem`

The ABI Item to compute the signature hash for.