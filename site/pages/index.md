# Ox – Ethereum Standard Library 

## Overview

Ox (⦻) is the foundation of robust Ethereum software written in TypeScript. It is an **Ethereum Standard Library** that provides a set of lightweight, performant, and type-safe TypeScript modules for Ethereum.

It offers core utilities & types for primitives such as: ABIs, Addresses, Blocks, Bytes, ECDSA, Hex, JSON-RPC, RLP, Signatures, Transactions, and more.

As an unopinionated Standard Library, it is designed to be used by higher-level consumers (such as [Viem](https://viem.sh), [Tevm](https://tevm.sh), etc) to provide their own opinionated interfaces, and/or when reaching for low-level primitives may be needed without buying into a Client Abstraction stack (Viem, Ethers, Web3.js, etc).

## Installation

:::code-group

```bash [npm]
npm i ox
```

```bash [pnpm]
pnpm i ox
```

```bash [bun]
bun i ox
```

:::

## Example Usage

Below is an example of using the [`Hex`](/api/hex) and [`Rlp`](/api/rlp) modules of Ox.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([Hex.from('hello'), Hex.from('world')])
```

:::tip
Using [Named Module Imports](#TODO) aligns closer with Ox's philosophy of module-driven Standard Library development, which enables categorical grouping of utilities and intuitive editor autocompletion. This does not compromise on tree-shakability and application bundle size.
:::

## How to Read These Docs

The documentation is split into two main sections – **Guides** and the **Module API Reference** – as displayed on the sidebar.

If you are new to Ox, you can start by reading the **Guides** or you can use the **Search Bar** (`/`) to find the Modules you may be looking for.

You can also skim the **Module API Reference** to get a quick overview of the available Modules. Ox's API is organized by Module, and each Module is further broken down into its individual utility exports.

## Modules

| Module    | Description |
| -------- | ------- |
| [Abi](/api/abi)  | Utility functions for encoding, decoding, and working with [ABIs](https://docs.soliditylang.org/en/latest/abi-spec.html) |
| [Address](/api/address) | Utility functions for working with Ethereum addresses. |
| [Base58](/api/base58)    |  |
| [Base64](/api/base64)    |  |
| [Block](/api/block)    |  |
| [Bytes](/api/bytes)    | Ethereum-related utility functions for working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances. |
| [Constants](/api/constants)    |  |
| [ContractAddress](/api/contractAddress)    |  |
| [Hash](/api/hash)    | Utility functions for hashing. |
| [Hex](/api/hex)    | Utility functions for working with hexadecimal string values. |
| [Json](/api/json)    ||
| [JsonRpc](/api/jsonRpc)    |  |
| [Kzg](/api/kzg)    |  |
| [Log](/api/log)    |  |
| [Rlp](/api/rlp)    | Utility functions for encoding and decoding [RLP structures](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/). |
| [Secp256k1](/api/secp256k1)    |  |
| [SignedData](/api/signedData)    |  |
| [Signature](/api/signature)    |  |
| [Transaction](/api/transaction)    |  |
| [TransactionEnvelope](/api/transactionEnvelope)    |  |
| [TransactionReceipt](/api/transactionReceipt)    |  |
| [TypedData](/api/typedData)    |  |
| [Value](/api/value)    | Utility functions for displaying and parsing Ethereum Values |
| [WebAuthnP256](/api/webauthn)    |  |
