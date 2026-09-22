---
description: Build, sign, and send EIP-8141 frame transactions with Ox.
---

# Frame Transactions (EIP-8141)

## Overview

Use [`TxEnvelopeEip8141`](/api/TxEnvelopeEip8141) to build a transaction containing
multiple [`Frame`](/api/Frame) calls. Each frame has its own execution mode, target,
calldata, value, and gas budgets. The transaction carries a shared
[`FrameSignature`](/api/FrameSignature) list rather than an outer ECDSA signature.

:::warning
[EIP-8141](https://eips.ethereum.org/EIPS/eip-8141) is a draft. Sending these
transactions requires a network and execution client with compatible frame transaction
support.
:::

## Build, Sign & Send

Create a verification frame that approves execution and payment, followed by a sender
frame that transfers value. Omitting a frame's `to` selects the transaction sender.

The example assumes a chain ID, sender nonce, and configured RPC transport. Choose
fees and per-frame budgets for your network; the values below illustrate the flow
on a development network.

```ts twoslash
import {
  Address,
  Hex,
  RpcTransport,
  Secp256k1,
  TxEnvelopeEip8141,
  Value,
} from 'ox'

declare const chainId: number
declare const nonce: bigint
declare const privateKey: Hex.Hex
declare const recipient: Address.Address
declare const rpc: RpcTransport.Http

const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

const envelope = TxEnvelopeEip8141.from({
  chainId,
  frames: [
    {
      flags: 'approveExecutionAndPayment',
      gas: 50_000n,
      mode: 'verify',
    },
    {
      gas: 50_000n,
      mode: 'sender',
      to: recipient,
      value: Value.fromEther('0.001'),
    },
  ],
  maxFeePerGas: Value.fromGwei('10'),
  maxPriorityFeePerGas: Value.fromGwei('1'),
  nonce,
  sender,
  signatures: [{ scheme: 'secp256k1' }],
})

const signature = Secp256k1.sign({
  payload: TxEnvelopeEip8141.getSignPayload(envelope),
  privateKey,
})
const signed = TxEnvelopeEip8141.from({
  ...envelope,
  signatures: [{ scheme: 'secp256k1', signature }],
})

const hash = await rpc.request({
  method: 'eth_sendRawTransaction',
  params: [TxEnvelopeEip8141.serialize(signed)],
})
```

### Choose Frame Modes and Budgets

`Frame.from` accepts named modes or their numeric equivalents:

| Mode      | Value | Purpose                                     |
| --------- | ----- | ------------------------------------------- |
| `default` | `0`   | Execute a call as the protocol entry point. |
| `verify`  | `1`   | Validate the transaction.                   |
| `sender`  | `2`   | Execute a call as the transaction sender.   |

Use `gas` for execution and `stateGas` for state creation. Both default to zero;
provide budgets appropriate for each call. A transfer to an existing account avoids
new-account state costs. Contract calls that create storage or accounts can need
`stateGas` as well.

Additional sender frames can carry contract calldata in `data`. Calls do not become
an atomic batch merely by sharing a transaction. Use `flags: 'atomicBatch'` on each
frame that joins the following frame to the batch, leaving the final frame unflagged.
Verification frames cannot be part of an atomic batch.

### Sign the Complete Envelope

Create the signature entries before calling `getSignPayload`, including their schemes
and any explicit signers. An empty `payload`, the default, selects the canonical
transaction signing hash. Attaching the resulting signature bytes preserves that hash.
Changing frames, fees, nonce, or signature metadata requires signing again.

Signature entries do not correspond to frames by array position. They form a shared
list available to account verification logic. `FrameSignature.from` supports
`'arbitrary'`, `'secp256k1'`, and `'p256'`; omitting `scheme` selects `'arbitrary'`.
Use an explicit 32-byte `payload` only when the account expects a separate digest.

## Convert RPC Data

[`TxEnvelopeEip8141.toRpc`](/api/TxEnvelopeEip8141/toRpc) converts `sender` to
`from`, frame `to` to `target`, `gas` to `executionGasLimit`, `stateGas` to `stateGasLimit`, and
signature `payload` to `msg`. RPC frame modes, flags, and signature schemes are
numbers, while gas and fee quantities are hex strings.

```ts twoslash
import { TxEnvelopeEip8141 } from 'ox'

declare const envelope: TxEnvelopeEip8141.TxEnvelopeEip8141

const request = TxEnvelopeEip8141.toRpc(envelope)
const restored = TxEnvelopeEip8141.fromRpc(request)
const serialized = TxEnvelopeEip8141.serialize(restored)
```

## Inspect Frame Receipts

Convert the transaction receipt with
`TransactionReceipt.fromRpc` to read the payer
and individual frame results. Each frame receipt exposes `gasUsed`, `stateGasUsed`,
`logs`, and a `status` of `'success'`, `'reverted'`, or `'skipped'`.

```ts twoslash
import { Hex, RpcTransport, TransactionReceipt } from 'ox'

declare const hash: Hex.Hex
declare const rpc: RpcTransport.Http

const receipt = TransactionReceipt.fromRpc(
  await rpc.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  }),
)

const payer = receipt?.payer
const frames = receipt?.frameReceipts
```

Use [`FrameReceipt.fromRpc`](/api/FrameReceipt/fromRpc) when converting an
individual frame receipt separately.

## See Also

- [Transaction Envelopes](/guides/transaction-envelopes)
- [JSON-RPC](/guides/json-rpc)
