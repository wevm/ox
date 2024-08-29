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

Below is an example of using the [`Hex`](/gen/Hex) and [`Rlp`](/gen/Rlp) modules of Ox.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.fromHex([Hex.from('hello'), Hex.from('world')])
```

:::tip
Using [Named Imports](#TODO) aligns closer with Ox's philosophy of module-driven Standard Library development, which enables categorical grouping of utilities and intuitive editor autocompletion. This does not compromise on tree-shakability and application bundle size.
:::

## How to Read These Docs

The documentation is split into two main sections – **Guides** and the **Module API Reference** – as displayed on the sidebar.

If you are new to Ox, you can start by reading the **Guides** or you can use the **Search Bar** (`/`) to find the Modules you may be looking for.

You can also skim the **Module API Reference** to get a quick overview of the available Modules. Ox's API is organized by Module, and each Module is further broken down into its individual utility exports.

## Modules

| Module                                          | Description                                                                                                                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Abi](/api/Abi)                                 | Utility functions for encoding, decoding, and working with [ABIs](https://docs.soliditylang.org/en/latest/abi-spec.html)                                                   |
| [Address](/api/Address)                         | Utility functions for working with Ethereum addresses.                                                                                                                     |
| [Base58](#TODO)                                 |                                                                                                                                                                            |
| [Base64](#TODO)                                 |                                                                                                                                                                            |
| [Block](#TODO)                                  |                                                                                                                                                                            |
| [Bytes](/api/Bytes)                             | Ethereum-related utility functions for working with [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) instances. |
| [Constants](#TODO)                              |                                                                                                                                                                            |
| [ContractAddress](/api/ContractAddress)         |                                                                                                                                                                            |
| [Hash](/api/Hash)                               | Utility functions for hashing.                                                                                                                                             |
| [Hex](/api/Hex)                                 | Utility functions for working with hexadecimal string values.                                                                                                              |
| [Json](#TODO)                                   |                                                                                                                                                                            |
| [JsonRpc](#TODO)                                |                                                                                                                                                                            |
| [Kzg](/api/Kzg)                                 |                                                                                                                                                                            |
| [Log](#TODO)                                    |                                                                                                                                                                            |
| [Rlp](/api/Rlp)                                 | Utility functions for encoding and decoding [RLP structures](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/).                                   |
| [Secp256k1](/api/Secp256k1)                     |                                                                                                                                                                            |
| [SignedData](#TODO)                             |                                                                                                                                                                            |
| [Signature](/api/Signature)                     | Utility functions for working with ECDSA signatures.                                                                                                                       |
| [Transaction](#TODO)                            |                                                                                                                                                                            |
| [TransactionEnvelope](/api/TransactionEnvelope) |                                                                                                                                                                            |
| [TransactionReceipt](#TODO)                     |                                                                                                                                                                            |
| [TypedData](/api/TypedData)                     | Utility functions for [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712).                                                                                        |
| [Value](/api/Value)                             | Utility functions for displaying and parsing Ethereum Values.                                                                                                              |
| [WebAuthnP256](#TODO)                           |                                                                                                                                                                            |
