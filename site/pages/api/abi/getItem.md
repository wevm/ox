---
description: Extracts an ABI Item from an ABI.
---

# Abi.getItem

**Alias:** `getAbiItem`

Extracts an ABI Item from an ABI given a `name` and optional `args`.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { getAbiItem } from 'ox/Abi'
```

## Usage

```ts twoslash
import { Abi } from 'ox'

const data = Abi.getItem({
  abi: [
    { 
      name: 'x', 
      type: 'function', 
      inputs: [{ type: 'uint256' }], 
      outputs: [],
      stateMutability: 'payable'
    },
    { 
      name: 'y', 
      type: 'event', 
      inputs: [{ type: 'address' }], 
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view'
    },
    { 
      name: 'z', 
      type: 'function', 
      inputs: [{ type: 'string' }],
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view'
    }
  ],
  name: 'y',
})
/**
 * { 
 *  name: 'y', 
 *  type: 'event', 
 *  inputs: [{ type: 'address' }], 
 *  outputs: [{ type: 'uint256' }],
 *  stateMutability: 'view'
 * }
 */
```

## Returns

`AbiItem`

The ABI item.

## Parameters

### abi

- **Type:** `Abi`

The contract's ABI.

```ts 
const data = Abi.getItem({
  abi: [...], // [!code focus]
  name: 'x',
})
```

### name

- **Type:** `string`

Name of the ABI item to extract.

```ts
const data = Abi.getItem({
  abi: [...],
  name: 'x', // [!code focus]
})
```

You can also provide the ABI item's 4byte selector:

```ts
const data = Abi.getItem({
  abi: [...],
  name: '0x70a08231', // [!code focus]
})
```

### args (optional)

- **Type:** Inferred.

Optional arguments to identify function overrides.

```ts
const data = Abi.getItem({
  abi: [...],
  name: 'y',
  args: ['0x0000000000000000000000000000000000000000'], // [!code focus]
})
```
