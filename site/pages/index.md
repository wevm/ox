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

Below is an example of using the [`Hex`](#TODO) and [`Rlp`](#TODO) modules of Ox.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([Hex.from('hello'), Hex.from('world')])
```

:::tip
Using [Named Module Imports](#TODO) aligns closer with Ox's philosophy of module-driven Standard Library development, which enables categorical grouping of utilities and intuitive editor autocompletion. This does not compromise on tree-shakability and application bundle size.
:::