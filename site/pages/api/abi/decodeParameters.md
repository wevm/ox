---
description: Decodes ABI encoded data into primitive values.
---

# Abi.decodeParameters

**Alias:** `decodeAbiParameters`

Decodes ABI-encoded data into its respective primitive values based on ABI Parameters.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { decodeAbiParameters } from 'ox/Abi'
```

## Usage

The `Abi.decodeParameters` function takes two parameters: 

- a set of ABI Parameters (`parameters`), that can be in the shape of the `inputs` or `outputs` attribute of an ABI Item.
- ABI encoded data (`data`)

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const data = Abi.decodeParameters(
  ['string', 'uint', 'bool'],
  '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000'
)
// ['wagmi', 420n, true]

// Specify structured ABI Parameters as schema:
const data = Abi.decodeParameters(
  [
    { type: 'string', name: 'name' },
    { type: 'uint', name: 'age' },
    { type: 'bool', name: 'isOwner' }
  ],
  '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000'
)
// ['wagmi', 420n, true]

// Specify Human Readable ABI Parameters as schema:
const data = Abi.decodeParameters(
  Abi.parseParameters('string name, uint age, bool isOwner'),
  '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000'
)
// ['wagmi', 420n, true]
```

## Returns

An array of decoded values.

## Parameters

### parameters

- **Type**: `AbiParameter[]`

The set of ABI parameters to decode, in the shape of the `inputs` or `outputs` attribute of an ABI Item.

These parameters must include valid [ABI types](https://docs.soliditylang.org/en/develop/abi-spec#types).

```ts twoslash
import { Abi } from 'ox'

Abi.decodeParameters(
  [{ name: 'x', type: 'uint32' }], // [!code focus]
  '0x0000000000000000000000000000000000000000000000000000000000010f2c'
)
```

### data

- **Type**: `Hex`

ABI encoded data.

```ts twoslash
import { Abi } from 'ox'

Abi.decodeParameters(
  [{ name: 'x', type: 'uint32' }],
  '0x0000000000000000000000000000000000000000000000000000000000010f2c' // [!code focus]
)
```