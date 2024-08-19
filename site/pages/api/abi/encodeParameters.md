---
description: Encodes primitive values into ABI encoded data.
---

# Abi.encodeParameters

**Alias:** `encodeAbiParameters`

Encodes primitive values into ABI encoded data as per the [Application Binary Interface (ABI) Specification](https://docs.soliditylang.org/en/latest/abi-spec).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { encodeAbiParameters } from 'ox/Abi'
```

## Usage

The `Abi.encodeParameters` function takes two parameters: 

- a set of ABI Parameters (`parameters`), that can be in the shape of the `inputs` or `outputs` attribute of an ABI Item.
- a set of values (`values`) that correspond to the given `parameters`.

```ts twoslash
// @noErrors
import { Abi } from 'ox';

const data = Abi.encodeParameters(
  ['string', 'uint', 'bool'],
  ['wagmi', 420n, true]
)

// Specify structured ABI Parameters as schema:
const data = Abi.encodeParameters(
  [
    { type: 'string', name: 'name' },
    { type: 'uint', name: 'age' },
    { type: 'bool', name: 'isOwner' }
  ],
  ['wagmi', 420n, true]
)

// Specify Human Readable ABI Parameters as schema:
const data = Abi.encodeParameters(
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

Abi.encodeParameters(
  [{ name: 'x', type: 'uint32' }], // [!code focus]
  [69420]
)
```

### values

The set of primitive values that correspond to the ABI types defined in `parameters`.

```ts twoslash
import { Abi } from 'ox'

Abi.encodeParameters(
  [{ name: 'x', type: 'uint32' }],
  [69420] // [!code focus]
)
```