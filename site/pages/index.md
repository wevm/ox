# Ox – Ethereum Standard Library 

## Overview

Ox is the foundation of performant Ethereum software written in TypeScript. It is an **Ethereum Standard Library** that provides a set of lightweight, performant, and robust TypeScript modules for Ethereum.

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

Below is an example of using the [`Hex`](#TODO) and [`Rlp`](#TODO) modules of Ox. Using [Namespace Imports](#TODO) can provide a better developer experience for readability and IDE autocompletion, without compromising on tree-shakability.

```ts twoslash
import { Hex, Rlp } from 'ox'

const rlp = Rlp.encode([Hex.from('hello'), Hex.from('world')])
```