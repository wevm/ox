---
description: "Validate Ethereum data with Zod schemas."
---

# Zod Schemas

## Overview

Ox provides a set of [Zod](https://zod.dev) schemas for Ethereum data structures via the `ox/zod` entrypoint. These schemas are useful for **validating**, **decoding**, and **encoding** values that cross the JSON-RPC boundary (for example, parsing the result of an RPC call, or building a strongly-typed request).

Most schemas are [Zod codecs](https://zod.dev/codecs) that convert between two representations:

- **Input (RPC / wire format)** – the format used over JSON-RPC, where quantities are hex strings (e.g. `'0x1'`).
- **Output (decoded format)** – the ergonomic format used in application code, where quantities are `bigint`/`number` (e.g. `1n`).

`zod` ships as a dependency of Ox, so there is nothing extra to install.

## Importing

Everything is available under the `z` namespace, which re-exports all of [`zod/mini`](https://zod.dev/packages/mini) alongside Ox's schema namespaces:

```ts twoslash
import { z } from 'ox/zod'
```

This gives you:

- All standard Zod utilities (`z.decode`, `z.encode`, `z.parse`, `z.safeParse`, `z.object`, the `z.input`/`z.output` type helpers, etc.).
- Module-scoped Ethereum schemas (`z.Address`, `z.Block`, `z.Transaction`, `z.Log`, …).
- Direct integer quantity schemas (`z.Uint256`, `z.Int256`, `z.Number`, `z.BigInt`, …).
- JSON-RPC method schemas (`z.RpcSchema`).
- Tempo schemas (`z.tempo`).

## Decoding & Encoding

Use `z.decode` to convert an RPC value into its decoded form, and `z.encode` to convert it back.

```ts twoslash
import { z } from 'ox/zod'

// Decode an RPC hex quantity into a `bigint`.
const value = z.decode(z.Uint256, '0x2a')
// @log: 42n

// Encode it back into an RPC hex quantity.
const hex = z.encode(z.Uint256, value)
// @log: '0x2a'
```

Schemas compose, so you can decode an entire structure in one pass:

```ts twoslash
import { z } from 'ox/zod'

const signature = z.decode(z.Signature.Signature, {
  r: '0x0000000000000000000000000000000000000000000000000000000000000001',
  s: '0x0000000000000000000000000000000000000000000000000000000000000002',
  yParity: '0x1',
})
// @log: { r: 1n, s: 2n, yParity: 1 }
```

## Validating

Since these are Zod schemas, you can validate values with the usual `z.parse` and `z.safeParse` helpers:

```ts twoslash
import { z } from 'ox/zod'

const result = z.safeParse(z.Address.Address, '0xdeadbeef')
// @log: { success: false, error: [ZodError] }
```

## Integer Quantity Schemas

Hex quantities can be decoded directly into `bigint` or `number` using sized integer schemas. Unsigned (`Uint`) and signed (`Int`) variants are available in 8-bit increments from `8` to `256`, in addition to the unsized `Uint`/`Int` and the `Number`/`BigInt` helpers.

```ts twoslash
import { z } from 'ox/zod'

z.decode(z.Uint8, '0xff') // 255 (number)
z.decode(z.Uint256, '0x2a') // 42n (bigint)
z.decode(z.Number, '0x1b4') // 436 (number)
z.decode(z.BigInt, '0x1b4') // 436n (bigint)
```

Schemas with a result that fits within 48 bits (e.g. `Uint8` … `Uint48`) decode to a `number`; larger schemas decode to a `bigint`.

## JSON-RPC Method Schemas

`z.RpcSchema` exposes per-method schemas for the `eth_` and `wallet_` namespaces, plus helpers to validate and decode requests, params, and results.

The namespaces are:

- `z.RpcSchema.Eth` – `eth_` methods.
- `z.RpcSchema.Wallet` – `wallet_` methods.
- `z.RpcSchema.Default` – the union of both.

### Decoding Params & Results

```ts twoslash
import { z } from 'ox/zod'

// Decode the `params` for a method.
const params = z.RpcSchema.decodeParams(
  z.RpcSchema.Eth,
  'eth_getBlockByNumber',
  ['0x1', true],
)

// Decode the `result` for a method.
const result = z.RpcSchema.decodeReturns(
  z.RpcSchema.Eth,
  'eth_blockNumber',
  '0x1b4',
)
// @log: 436n
```

### Decoding a Full Request

`z.RpcSchema.decodeRequest` (aliased as `z.RpcSchema.parse`) validates and decodes a full `{ method, params }` request, dispatching on `method`:

```ts twoslash
import { z } from 'ox/zod'

const request = z.RpcSchema.decodeRequest(z.RpcSchema.Eth, {
  method: 'eth_getBlockByNumber',
  params: ['0x1', true],
})
```

### Looking Up a Method

Use `z.RpcSchema.parseItem` to retrieve the schema for a single method (its `method`, `params`, `returns`, and `request` schemas):

```ts twoslash
import { z } from 'ox/zod'

const item = z.RpcSchema.parseItem(z.RpcSchema.Eth, 'eth_blockNumber')
```

If a method does not exist on the namespace, the helpers throw a `z.RpcSchema.MethodNotFoundError`.

### Defining Custom Method Schemas

Use `z.RpcSchema.from` to define your own method schema:

```ts twoslash
import { z } from 'ox/zod'

const eth_blockNumber = z.RpcSchema.from({
  method: 'eth_blockNumber',
  params: z.tuple([]),
  returns: z.Uint256,
})
```

## Tempo Schemas

Schemas for [Tempo](/tempo) data structures are available under `z.tempo` (e.g. `z.tempo.Transaction`, `z.tempo.TransactionReceipt`, `z.tempo.TxEnvelopeTempo`, `z.tempo.SignatureEnvelope`, `z.tempo.KeyAuthorization`, `z.tempo.RpcSchemaTempo`).

They work the same way as the core schemas:

```ts twoslash
import { z } from 'ox/zod'

type TransactionRpc = z.input<typeof z.tempo.Transaction.Tempo>
type Transaction = z.output<typeof z.tempo.Transaction.Tempo>
```

## Types

Use Zod's `z.input` and `z.output` type helpers to extract the RPC and decoded types from any schema:

```ts twoslash
import { z } from 'ox/zod'

type TransactionRpc = z.input<typeof z.Transaction.Transaction>
type Transaction = z.output<typeof z.Transaction.Transaction>
```

## Available Schemas

The `ox/zod` entrypoint includes schemas for:

- **Primitives**: `Address`, `Bytes`, `Hash`, `Hex`, `BigInt`, `Number`, `Int`, `Uint`
- **Accounts & State**: `AccountProof`, `StateOverrides`, `BlockOverrides`
- **Blocks & Logs**: `Block`, `Log`, `Filter`, `Withdrawal`
- **Fees & Access**: `Fee`, `AccessList`, `Authorization`
- **Transactions**: `Transaction`, `TransactionReceipt`, `TransactionRequest`, `TransactionEnvelope` (and per-type `TxEnvelopeLegacy`, `TxEnvelopeEip1559`, `TxEnvelopeEip2930`, `TxEnvelopeEip4844`, `TxEnvelopeEip7702`)
- **Signatures**: `Signature`
- **JSON-RPC**: `RpcResponse`, `RpcSchema`
- **Tempo**: `tempo.*`
