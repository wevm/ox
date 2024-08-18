---
description: Computes the selector for an ABI Item.
---

# Abi.getSelector

Computes the selector for an ABI Item.

Useful for computing function selectors for calldata.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { getSelector } from 'ox/Abi'
```

## Usage

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const value = Abi.getSelector('function ownerOf(uint256 tokenId)')
// '0x6352211e'

const value = Abi.getSelector({
  name: 'ownerOf',
  type: 'function',
  inputs: [{ name: 'tokenId', type: 'uint256' }],
  outputs: [],
  stateMutability: 'view',
})
// '0x6352211e'
```

## Returns

`Hex`

The first 4 bytes of the `keccak256` hash of the function signature.

## Parameters

### abiItem

- **Type:** `string | AbiItem`

The ABI item to compute the selector for. Can be a signature or an ABI item for an error, event, function, etc.