# Recursive Length Prefix (RLP)

## Overview

The Recursive Length Prefix algorithm is a serialization method used extensively in the Ethereum protocol. RLP is a standard that aims to define a space-efficient approach to packaging and transferring arbitrary data. 

RLP is commonly used for use cases on Ethereum Applications such as: 
- serializing [Transaction Envelopes](/guides/transaction-envelopes) to be submitted to the network,
- serializing [EIP-7702 Authorization](/api/Authorization/getSignPayload) tuples to be signed over,
- serializing components to [derive a `CREATE` Contract Address](/api/ContractAddress/fromCreate).

## Examples

### Encoding

We can serialize arbitrary data into RLP-encoded format using the [`Rlp.fromHex`](/api/Rlp/fromHex) or [`Rlp.fromBytes`](/api/Rlp/fromBytes) functions.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.fromHex([
  Hex.fromString('hello'),
  Hex.fromNumber(1337),
  [Hex.fromString('foo'), Hex.fromString('bar')],
])
// @log: 0xd28568656c6c6f820539c883666f6f83626172
```

### Decoding

We can deserialize RLP-encoded data into its original format using the [`Rlp.toHex`](/api/Rlp/toHex) or [`Rlp.toBytes`](/api/Rlp/toBytes) functions.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.fromHex([
  Hex.fromString('hello'),
  Hex.fromNumber(1337),
  [Hex.fromString('foo'), Hex.fromString('bar')],
])

const values = Rlp.toHex(rlp) // [!code focus]
// @log: [Hex.fromString('hello'), Hex.fromNumber(1337), [Hex.fromString('foo'), Hex.fromString('bar')]]
```
