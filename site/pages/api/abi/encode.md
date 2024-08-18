---
description: Encodes primitive values into ABI encoded data.
---

# Abi.encode

**Alias:** `encodeAbi`

Encodes primitive values into ABI encoded data as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { encodeAbi } from 'ox/Abi'
```

## Usage

The `Abi.encode` function takes two parameters: 

- a set of ABI Parameters (`parameters`), that can be in the shape of the `inputs` or `outputs` attribute of an ABI Item.
- a set of values (`values`) that correspond to the given `parameters`.

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const data = Abi.encode(
  ['string', 'uint', 'bool'],
  ['wagmi', 420n, true]
)

// Specify structured ABI Parameters as schema:
const data = Abi.encode(
  [
    { type: 'string', name: 'name' },
    { type: 'uint', name: 'age' },
    { type: 'bool', name: 'isOwner' }
  ],
  ['wagmi', 420n, true]
)

// Specify Human Readable ABI Parameters as schema:
const data = Abi.encode(
  Abi.parseParameters('string name, uint age, bool isOwner'),
  ['wagmi', 420n, true]
)
```

## Returns

`Hex`

ABI encoded data.

## Parameters

### parameters

- **Type**: `AbiParameter[]`

The set of ABI parameters to encode, in the shape of the `inputs` or `outputs` attribute of an ABI Item.

These parameters must include valid [ABI types](https://docs.soliditylang.org/en/develop/abi-spec#types).

```ts twoslash
import { Abi } from 'ox'

Abi.encode(
  [{ name: 'x', type: 'uint32' }], // [!code focus]
  [69420]
)
```

### values

The set of primitive values that correspond to the ABI types defined in `parameters`.

```ts twoslash
import { Abi } from 'ox'

Abi.encode(
  [{ name: 'x', type: 'uint32' }],
  [69420] // [!code focus]
)
```