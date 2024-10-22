---
showOutline: 2
---

# Application Binary Interface (ABI)

## Overview

The **Application Binary Interface (ABI)** is the standardized protocol for interacting with smart contracts in the Ethereum ecosystem. It defines how data is encoded and decoded for **Consumer (e.g. Application, Wallet, Server, etc) ↔ Contract** communication, as well as **Contract → Contract** communication.

## Encoding and Decoding ABI Parameters

To start, let's take a look at how we can encode and decode primitive ABI types and parameters using Ox. While encoding and decoding ABI parameters might not be directly useful in isolation, they form the foundation of interacting with smart contracts, as listed in the [Applications](#applications) section below.

### Encoding

Encoding ABI parameters is the process of converting input data into a bytecode format that can be understood by the Ethereum Virtual Machine (EVM). 

You can encode ABI parameters using Ox's [`AbiParameters.encode`](/api/AbiParameters/encode) function. 

Let's take a trivial example that encodes `address` and `uint32[]` parameters:

```ts twoslash
import { AbiParameters } from 'ox';

const encoded = AbiParameters.encode(
  [{ type: 'address' }, { type: 'uint32[]' }], 
  ['0xcb98643b8786950F0461f3B0edf99D88F274574D', [1, 2, 3]]
)

console.log(encoded)
// @log: '0x000000000000000000000000cb98643b8786950f0461f3b0edf99d88f274574d00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000003'
```

The `encoded` variable now contains the ABI-encoded representation of the values we passed with the `address` and `uint32[]` parameters. We won't go into detail on how the encoding works, but you can read more about it [here](https://docs.soliditylang.org/en/latest/abi-spec.html#argument-encoding).

### Decoding

Decoding is the process of converting ABI-encoded data back into its values.

You can decode ABI parameters using Ox's [`AbiParameters.decode`](/api/AbiParameters/decode) function.

Let's take a look at how we can decode the parameters we encoded above:

```ts twoslash
import { AbiParameters } from 'ox';

const encoded = AbiParameters.encode(
  [{ type: 'address' }, { type: 'uint32[]' }], 
  ['0xcb98643b8786950F0461f3B0edf99D88F274574D', [1, 2, 3]]
)

const decoded = AbiParameters.decode( // [!code focus]
  [{ type: 'address' }, { type: 'uint32[]' }], // [!code focus]
  encoded // [!code focus]
) // [!code focus]

console.log(decoded) // [!code focus]
// @log: ['0xcb98643b8786950f0461f3b0edf99d88f274574d', [1, 2, 3]]
```

Now that we are aware of how to encode and decode primitive types & values, let's take a look at how ABI coding is applied in real-world scenarios.

## Contract Function Calls

When calling a function on a smart contract, an ABI is used to encode the function signature and its parameters into a bytecode format that can be understood by the Ethereum Virtual Machine (EVM). It is equally important for decoding the response (or revert reason) from the contract, hence allowing for two-way communication.

### Read-only Functions

A [Pure Function](https://docs.soliditylang.org/en/latest/contracts.html#pure-functions) or [View Function](https://docs.soliditylang.org/en/latest/contracts.html#view-functions) (commonly known as a "contract read" function) does not modify the state of the blockchain. These functions have a `stateMutability` of `pure` or `view`. 

They can only read the state of the contract, and cannot make any changes to it. Since pure/view functions do not change the state of the contract, they do not require any gas to be executed. This means that they can be called without the need for a transaction (via an `eth_call` JSON-RPC method).

Let's take a look at how we can encode a [read-only `balanceOf` function call](https://eips.ethereum.org/EIPS/eip-20#balanceOf) on an ERC20 contract, and then call it using `eth_call`.

::::steps

#### Define the `balanceOf` Function

First, we will define the `balanceOf` function using Ox's [`AbiFunction.from`](/api/AbiFunction/from) function:

```ts twoslash
import { AbiFunction } from 'ox'; 

const balanceOf = AbiFunction.from(
  'function balanceOf(address) returns (uint256)'
)
```

:::note

If you're using a JSON ABI, you can also extract the Function using [`AbiFunction.fromAbi`](/api/AbiFunction/fromAbi):

```ts twoslash
// @noErrors
const erc20Abi = [...] // [!code focus]
const balanceOf = AbiFunction.fromAbi(abi, 'balanceOf') // [!code focus]
```

:::

#### Encode the Function Call

Next, we will encode the function call using [`AbiFunction.encodeData`](/api/AbiFunction/encodeData):

In this example, we will encode arguments to get the balance of the `0xcb98643b8786950f0461f3b0edf99d88f274574d` address.

```ts twoslash
import { AbiFunction, Value } from 'ox'; 

const balanceOf = AbiFunction.from('function balanceOf(address) returns (uint256)')

const data = AbiFunction.encodeData( // [!code focus]
  balanceOf, // [!code focus]
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d'] // [!code focus]
) // [!code focus]
```

#### Perform the Call

Now, we can perform the call using `eth_call` via a [JSON-RPC Transport](/api/RpcTransport) or [EIP-1193 Provider](/api/Provider). This will invoke the `balanceOf` function on the ERC20 contract.

```ts twoslash
import 'ox/window'
import { AbiFunction, Provider, TransactionRequest, Value } from 'ox'

const balanceOf = AbiFunction.from('function balanceOf(address) returns (uint256)')

const data = AbiFunction.encodeData(
  balanceOf,
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d']
)

const provider = Provider.from(window.ethereum) // [!code focus]

const result = await provider.request({ // [!code focus]
  method: 'eth_call', // [!code focus]
  params: [{ // [!code focus]
    data, // [!code focus]
    to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // [!code focus]
  }], // [!code focus]
}) // [!code focus]
```

#### Decode the Result

Now, we can decode the result using [`AbiFunction.decodeResult`](/api/AbiFunction/decodeResult):

```ts twoslash
import 'ox/window'
import { AbiFunction, Provider, TransactionRequest, Value } from 'ox'

const balanceOf = AbiFunction.from('function balanceOf(address) returns (uint256)')

const data = AbiFunction.encodeData(
  balanceOf,
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d']
)

const provider = Provider.from(window.ethereum) 

const result = await provider.request({ 
  method: 'eth_call', 
  params: [{ 
    data, 
    to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
  }], 
}) 

const balance = AbiFunction.decodeResult(balanceOf, result) // [!code focus]
```

::::

### State-Modifying Functions

A **State-Modifying Function** (commonly known as a "contract write" function) modifies the state of the blockchain. 
These functions have a `stateMutability` of `nonpayable` or `payable`. 

These types of functions require gas to be executed, and hence a transaction is needed to be broadcast in order to change the state (via an `eth_sendTransaction` JSON-RPC method).

Let's take a look at how we can encode a [state-modifying `approve` function call](https://eips.ethereum.org/EIPS/eip-20#approve) on an ERC20 contract, and then broadcast it to the network.

::::steps

#### Define the `approve` Function

First, we will define the `approve` function using Ox's [`AbiFunction.from`](/api/AbiFunction/from) function:

```ts twoslash
import { AbiFunction } from 'ox'; 

const approve = AbiFunction.from('function approve(address, uint256) returns (bool)')
```

:::note

If you're using a JSON ABI, you can also extract the Function using [`AbiFunction.fromAbi`](/api/AbiFunction/fromAbi):

```ts twoslash
// @noErrors
const erc20Abi = [...] // [!code focus]
const approve = AbiFunction.fromAbi(abi, 'approve') // [!code focus]
```

:::

#### Encode the Function Call

Next, we will encode the function call using [`AbiFunction.encodeData`](/api/AbiFunction/encodeData):

In this example, we will encode arguments to approve 100 USDC to be spent by the `0xcb98643b8786950f0461f3b0edf99d88f274574d`.

```ts twoslash
import { AbiFunction, Value } from 'ox'; 

const approve = AbiFunction.from('function approve(address, uint256) returns (bool)')

const data = AbiFunction.encodeData( // [!code focus]
  approve, // [!code focus]
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d', Value.from('100', 18)] // [!code focus]
) // [!code focus]
```

#### Broadcast the Transaction

Now, we can broadcast the `data` to the network using `eth_sendTransaction` via a [JSON-RPC Transport](/api/RpcTransport) or [EIP-1193 Provider](/api/Provider). This will invoke the `approve` function on the USDC contract.

```ts twoslash
import 'ox/window'
import { AbiFunction, Provider, TransactionRequest, Value } from 'ox'

const approve = AbiFunction.from('function approve(address, uint256) returns (bool)')

const data = AbiFunction.encodeData(
  approve,
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d', Value.fromEther('100')]
)

const transaction = TransactionRequest.toRpc({ // [!code focus]
  chainId: 1, // [!code focus]
  //       ↑ Ethereum Mainnet // [!code focus]
  data, // [!code focus]
  to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // [!code focus]
  //   ↑ USDC Contract Address // [!code focus]
}) // [!code focus]

const provider = Provider.from(window.ethereum) // [!code focus]

const hash = await provider.request({ // [!code focus]
  method: 'eth_sendTransaction', // [!code focus]
  params: [transaction], // [!code focus]
}) // [!code focus]
```

#### Bonus: Simulate

We can also "simulate" a Transaction by using `eth_call` instead of `eth_sendTransaction`. Using an `eth_call` means we can also retrieve the result of the function call and decode it with [`AbiFunction.decodeResult`](/api/AbiFunction/decodeResult):

```ts twoslash
// @noErrors
import 'ox/window'
import { AbiFunction, Provider, TransactionRequest, Value } from 'ox'

const approve = AbiFunction.from('function approve(address, uint256) returns (bool)')

const data = AbiFunction.encodeData(
  approve,
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d', Value.fromEther('100')]
)

const transaction = TransactionRequest.toRpc({ 
  chainId: 1, 
  //       ↑ Ethereum Mainnet 
  data, 
  to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
  //   ↑ USDC Contract Address 
}) 

const provider = Provider.from(window.ethereum) 
// ---cut---
const hash = await provider.request({ // [!code --]
  method: 'eth_sendTransaction', // [!code --]
const result = await provider.request({ // [!code ++]
  method: 'eth_call', // [!code ++]
  params: [transaction], 
}) 

const success = AbiFunction.decodeResult(approve, result) // [!code ++]
```

#### Bonus: Estimate Gas

We can also estimate the gas required to execute a Transaction by using `eth_estimateGas` instead of `eth_sendTransaction`:

```ts twoslash
// @noErrors
import 'ox/window'
import { AbiFunction, Provider, TransactionRequest, Value } from 'ox'

const approve = AbiFunction.from('function approve(address, uint256) returns (bool)')

const data = AbiFunction.encodeData(
  approve,
  ['0xcb98643b8786950f0461f3b0edf99d88f274574d', Value.fromEther('100')]
)

const transaction = TransactionRequest.toRpc({ 
  chainId: 1, 
  //       ↑ Ethereum Mainnet 
  data, 
  to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 
  //   ↑ USDC Contract Address 
}) 

const provider = Provider.from(window.ethereum) 
// ---cut---
const hash = await provider.request({ // [!code --]
  method: 'eth_sendTransaction', // [!code --]
const gas = await provider.request({ // [!code ++]
  method: 'eth_estimateGas', // [!code ++]
  params: [transaction], 
}) 
```

::::

## Contract Event Filtering

ABIs can also be used to filter contract events by a topic (hashed event signature), and optional indexed parameters. This is useful for applications that need to extract or listen for specific events – such as ERC20 transfers or L2 messages – on Ethereum. We can also ABI-decode extracted event to retrieve the event name and arguments.

TODO

## Contract Deployment

When deploying a smart contract, an ABI can be used to encode constructor arguments to pass to the transaction calldata, along with the deployment bytecode.

TODO
