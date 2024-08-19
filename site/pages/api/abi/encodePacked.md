---
description: Encodes an array of primitive values to a packed ABI encoding.
---

# Abi.encodePacked

Encodes an array of primitive values to a [packed ABI encoding](https://docs.soliditylang.org/en/latest/abi-spec.html#non-standard-packed-mode).

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Abi } from 'ox'

// Entrypoint Imports
import * as Abi from 'ox/Abi'
import { encodePacked } from 'ox/Abi'
```

## Usage

```ts twoslash
import { Abi } from 'ox'

const data = Abi.encodePacked(
  ['address', 'string', 'bytes16[]'], 
  [
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 
    'hello world',
    ['0xdeadbeefdeadbeefdeadbeefdeadbeef', '0xcafebabecafebabecafebabecafebabe']
  ]
)
// 0xd8da6bf26964af9d7eed9e03e53415d37aa9604568656c6c6f20776f726c64deadbeefdeadbeefdeadbeefdeadbeef00000000000000000000000000000000cafebabecafebabecafebabecafebabe00000000000000000000000000000000
```

## Returns

`Hex`

The encoded packed data.

## Parameters

### types

- **Type**: `PackedAbiType[]`

Set of ABI types to pack encode.

```ts
Abi.encodePacked(
  ['address', 'string', 'bytes16[]'], // [!code focus]
  [
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 
    'hello world',
    ['0xdeadbeefdeadbeefdeadbeefdeadbeef', '0xcafebabecafebabecafebabecafebabe']
  ]
)
```

### values

The set of primitive values that correspond to the ABI types defined in `types`.

```ts
Abi.encodePacked(
  ['address', 'string', 'bytes16[]'],
  [ // [!code focus:5]
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', 
    'hello world',
    ['0xdeadbeefdeadbeefdeadbeefdeadbeef', '0xcafebabecafebabecafebabecafebabe']
  ]
)
```