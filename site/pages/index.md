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

Below is an example of using the [`Hex`](/api/Hex) and [`Rlp`](/api/Rlp) modules of Ox.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.fromHex([Hex.fromString('hello'), Hex.fromString('world')])
```

:::tip
Using [Named Imports](/imports#named-imports) aligns closer with Ox's philosophy of module-driven Standard Library development, which enables categorical grouping of utilities and intuitive editor autocompletion. This does not compromise on tree-shakability and application bundle size.
:::

## How to Read These Docs

The documentation is split into two main sections – **Guides** and the [API Reference](/api) – as displayed on the sidebar.

If you are new to Ox, you can start by reading the **Guides** or you can use the **Search Bar** (`/`) to find the Modules you may be looking for.

You can also skim the [API Reference](/api) to get a quick overview of the available Modules. Each Module has a brief overview of its purpose, as well as some examples ([Example](/api/Secp256k1)) – it can be seen as a "mini-guide" in addition to the formal Guides.

Ox's API is organized by Module ([Example](/api/Hex)), and each Module is further broken down into its individual Function ([Example](/api/Hex/padLeft)).

