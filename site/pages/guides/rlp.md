# Recursive Length Prefix (RLP)

## Overview

The Recursive Length Prefix algorithm is a serialization method used extensively in the Ethereum protocol. RLP is a standard that aims to define a space-efficient approach to packaging and transferring arbitrary data. 

RLP is commonly used for use cases on Ethereum Applications such as: 
- serializing [Transaction Envelopes](/guides/transaction-envelopes) to be submitted to the network,
- serializing [EIP-7702 Authorization](/api/Authorization/getSignPayload) tuples to be signed over,
- serializing components to [derive a `CREATE` Contract Address](/api/ContractAddress/fromCreate).

## Examples

### Encoding

We can serialize arbitrary data into RLP-encoded format using the [`Rlp.encode`](/api/Rlp/encode) function. Pass `{ as: 'Hex' }` to receive a hex string, or omit the option for a `Bytes` value.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([
  Hex.fromString('hello'),
  Hex.fromNumber(1337),
  [Hex.fromString('foo'), Hex.fromString('bar')],
], { as: 'Hex' })
// @log: 0xd28568656c6c6f820539c883666f6f83626172
```

### Decoding

We can deserialize RLP-encoded data into its original format using the [`Rlp.decode`](/api/Rlp/decode) function. Pass `{ as: 'Hex' }` to receive a `Hex` tree, or omit the option for a `Bytes` tree.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([
  Hex.fromString('hello'),
  Hex.fromNumber(1337),
  [Hex.fromString('foo'), Hex.fromString('bar')],
], { as: 'Hex' })

const values = Rlp.decode(rlp, { as: 'Hex' }) // [!code focus]
// @log: [Hex.fromString('hello'), Hex.fromNumber(1337), [Hex.fromString('foo'), Hex.fromString('bar')]]
```

## Related Modules

| Module          | Description                                    |
| --------------- | ---------------------------------------------- |
| [Rlp](/api/Rlp) | Utility functions for RLP encoding & decoding. |
