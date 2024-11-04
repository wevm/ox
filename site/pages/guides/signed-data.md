# Signed & Typed Data 

## Overview

The [ERC-191 Signed Data](https://eips.ethereum.org/EIPS/eip-191) standard defines a specification for handling signed data in Ethereum contracts.
By defining a structured format for signable data, ERC-191 helps prevent vulnerabilities associated with obscured transaction signing and multi-signature wallets.

Signable data are prefixed with a version byte (e.g. `0x45` for Personal Messages). This protects an end-user from signing obscured transaction data constructed by a malicious actor and consequently losing funds.

Ox supports the following ERC-191 versions:

| Module                                    | Name                                    | Version |
| ----------------------------------------- | --------------------------------------- | ------- |
| [`PersonalMessage`](/api/PersonalMessage) | Personal Message (aka. `personal_sign`) | `0x45`  |
| [`TypedData`](/api/TypedData)             | Typed Data                              | `0x01`  |
| [`ValidatorData`](/api/ValidatorData)     | Data with intended validator            | `0x00`  |

## Personal Messages

Personal messages are a common use-case for ERC-191. They are typically used to sign arbitrary messages that will be displayed to the user, for example, a [Sign-In With Ethereum (SIWE) message](/guides/siwe#create-siwe-message).

A signable Personal Message payload can be computed using [`PersonalMessage.getSignPayload`](/api/PersonalMessage/getSignPayload):

```ts twoslash
import { Hex, PersonalMessage } from 'ox'

const payload = PersonalMessage.getSignPayload(
  Hex.fromString('hello world')
)
```

We can then sign the payload by using a [Signer](/guides/ecdsa#signers). For this example, we will use [`Secp256k1.sign`](/api/Secp256k1/sign):

```ts twoslash
import { Hex, PersonalMessage, Secp256k1 } from 'ox'

const payload = PersonalMessage.getSignPayload(
  Hex.fromString('hello world')
)

const signature = Secp256k1.sign({ // [!code focus]
  payload, // [!code focus]
  privateKey: '0x...', // [!code focus]
}) // [!code focus]
```

### Wallets 

Most Wallets expose a [`personal_sign` RPC interface](https://docs.metamask.io/wallet/reference/json-rpc-methods/personal_sign/) that can be used to sign Personal Messages. This means you can use the `personal_sign` RPC method to sign a message without the ceremony of constructing and signing it yourself.

```ts twoslash
import 'ox/window'
import { Hex, Provider } from 'ox'

const provider = Provider.from(window.ethereum)

const [address] = await provider.request({ method: 'eth_requestAccounts' })

const signature = await provider.request({ // [!code focus]
  method: 'personal_sign', // [!code focus]
  params: [Hex.fromString('hello world'), address], // [!code focus]
}) // [!code focus]
```

## Typed Data

Typed Data is another type of signed data that is used to present structured data to the user to sign.
This structure (and encoding format) is defined by the [EIP-712 standard](https://eips.ethereum.org/EIPS/eip-712).

A signable Typed Data payload can be computed using [`TypedData.getSignPayload`](/api/TypedData/getSignPayload):

```ts twoslash
import { TypedData } from 'ox'
 
const payload = TypedData.getSignPayload({ 
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})
```

We can then sign the payload by using a [Signer](/guides/ecdsa#signers). For this example, we will use [`Secp256k1.sign`](/api/Secp256k1/sign):

```ts twoslash
import { Hex, Secp256k1, TypedData } from 'ox'

const payload = TypedData.getSignPayload({ 
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
})

const signature = Secp256k1.sign({ // [!code focus]
  payload, // [!code focus]
  privateKey: '0x...', // [!code focus]
}) // [!code focus]
```

### Wallets 

Most Wallets expose a [`eth_signTypedData_v4` RPC interface](https://docs.metamask.io/wallet/reference/json-rpc-methods/eth_signtypeddata_v4/) that can be used to sign Typed Data. This means you can use the `eth_signTypedData_v4` RPC method to sign a message without the ceremony of constructing and signing it yourself.

```ts twoslash
// @noErrors
import 'ox/window'
import { Hex, Provider, Secp256k1, TypedData } from 'ox'

const provider = Provider.from(window.ethereum)

const [address] = await provider.request({ method: 'eth_requestAccounts' })

const payload = TypedData.serialize({ /* ... */ }) // [!code focus]

const signature = await provider.request({ // [!code focus]
  method: 'eth_signTypedData_v4', // [!code focus]
  params: [address, payload], // [!code focus]
}) // [!code focus]
```

## Related Modules

| Module                                  | Description                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [PersonalMessage](/api/PersonalMessage) | Utilities & types for working with [EIP-191 Personal Messages](https://eips.ethereum.org/EIPS/eip-191#version-0x45-e) |
| [TypedData](/api/TypedData)             | Utility functions for working with [EIP-712 Typed Data](https://eips.ethereum.org/EIPS/eip-712)                       |
| [ValidatorData](/api/ValidatorData)     | Utilities & types for working with [EIP-191 Validator Data](https://eips.ethereum.org/EIPS/eip-191#0x00)              |
