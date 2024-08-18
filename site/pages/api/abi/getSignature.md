---
description: Computes the stringified signature for an ABI Item.
---

# Abi.getSignature

Computes the stringified signature for an ABI Item.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { getSignature } from 'ox/Abi'
```

## Usage

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const signature = Abi.getSignature({
  name: 'ownerOf',
  type: 'function',
  inputs: [{ name: 'tokenId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'view',
})
// 'ownerOf(uint256)'

const signature = Abi.getSignature('function ownerOf(uint256 tokenId)')
// 'ownerOf(uint256)'
```

## Returns

`string`

The stringified signature of the ABI Item.

## Parameters

### abiItem

- **Type:** `string | AbiItem`

The ABI Item to compute the signature for.