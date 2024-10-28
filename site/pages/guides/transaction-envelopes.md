# Transaction Envelopes

## Overview 

A Transaction Envelope is a structure that defines the properties of a transaction, and is generally
utilized to construct Transactions to be broadcast to a network.

Ox supports the core Ethereum Transaction Envelope types:

| Module                                                          | Name                                                                            | Type   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ |
| [`TransactionEnvelopeLegacy`](/api/TransactionEnvelopeLegacy)   | Legacy Transactions                                                             | `0x00` |
| [`TransactionEnvelopeEip2930`](/api/TransactionEnvelopeEip2930) | [EIP-2930: Access List Transactions](https://eips.ethereum.org/EIPS/eip-2930)   | `0x01` |
| [`TransactionEnvelopeEip1559`](/api/TransactionEnvelopeEip1559) | [EIP-1559: Fee Market Transactions](https://eips.ethereum.org/EIPS/eip-1559)    | `0x02` |
| [`TransactionEnvelopeEip4844`](/api/TransactionEnvelopeEip4844) | [EIP-4844: Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)          | `0x03` |
| [`TransactionEnvelopeEip7702`](/api/TransactionEnvelopeEip7702) | [EIP-7702: Authorization Transactions](https://eips.ethereum.org/EIPS/eip-7702) | `0x04` |

## Examples

### Constructing

A Transaction Envelope can be constructed using the respective `.from` function.

The example below demonstrates how to construct an [EIP-1559 Transaction Envelope](/api/TransactionEnvelopeEip1559) using [`TransactionEnvelopeEip1559.from`](/api/TransactionEnvelopeEip1559/from). EIP-1559 Transactions are the most commonly used Transaction Envelope type.

```ts twoslash
import { TransactionEnvelopeEip1559, Value } from 'ox'

const envelope = TransactionEnvelopeEip1559.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: Value.fromEther('1.5'),
})
```

### Signing

We can sign over a Transaction Envelope by passing the result of the Envelope's `.getSignPayload` function to the respective [Signer's](/guides/ecdsa#signing) `.sign` function.

The example below demonstrates how to sign an [EIP-1559 Transaction Envelope](/api/TransactionEnvelopeEip1559).

```ts twoslash
import { TransactionEnvelopeEip1559, Secp256k1, Value } from 'ox'

// Construct the Envelope.
const envelope = TransactionEnvelopeEip1559.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: Value.fromEther('1.5'),
})

// Sign over the Envelope. // [!code focus]
const signature = Secp256k1.sign({ // [!code focus]
  payload: TransactionEnvelopeEip1559.getSignPayload(envelope), // [!code focus]
  privateKey: '0x...', // [!code focus]
}) // [!code focus]

// Attach the Signature to the Envelope. // [!code focus]
const signed = TransactionEnvelopeEip1559.from(envelope, { signature }) // [!code focus]
//    ^?













// @log:        ↑ contains `r`, `s`, `yParity` signature properties.

```

### Serializing

We can serialize a Transaction Envelope into RLP-encoded format by calling `.serialize`. We can also deserialize an RLP-encoded Transaction Envelope by calling `.deserialize`.

```ts twoslash
import { TransactionEnvelopeEip1559, Secp256k1, Value } from 'ox'

// Construct the Envelope.
const envelope = TransactionEnvelopeEip1559.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: Value.fromEther('1.5'),
})

// Serialize the Envelope. // [!code focus]
const serialized = TransactionEnvelopeEip1559.serialize(envelope) // [!code focus]
//    ^?



// Deserialize the Envelope. // [!code focus]
const deserialized = TransactionEnvelopeEip1559.deserialize(serialized) // [!code focus]
//    ^?




```

### Sending

We can send a Transaction Envelope to the network by serializing the signed envelope with `.serialize`, and then  broadcasting it over JSON-RPC with `eth_sendRawTransaction`. 

In this example, we will use [`RpcTransport.fromHttp`](/api/RpcTransport/fromHttp) to broadcast a `eth_sendRawTransaction` request over HTTP JSON-RPC.

```ts twoslash
import 'ox/window'
import { RpcTransport, TransactionEnvelopeEip1559, Secp256k1, Value } from 'ox'

// Construct the Envelope.
const envelope = TransactionEnvelopeEip1559.from({
  chainId: 1,
  maxFeePerGas: Value.fromGwei('10'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  value: Value.fromEther('1.5'),
})

// Sign over the Envelope.
const signature = Secp256k1.sign({
  payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
  privateKey: '0x...',
})

// Serialize the Envelope with the Signature. // [!code focus]
const serialized = TransactionEnvelopeEip1559.serialize(envelope, { // [!code focus] 
  signature  // [!code focus]
}) // [!code focus]

// Broadcast the Envelope with `eth_sendRawTransaction`. // [!code focus]
const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com') // [!code focus]
const hash = await transport.request({ // [!code focus]
  method: 'eth_sendRawTransaction', // [!code focus]
  params: [serialized], // [!code focus]
}) // [!code focus]
```
