# Sign-In With Ethereum (SIWE)

```
TODO:
- Switch example over to sign via Secp256k1 instead of JSON-RPC
- Outline JSON-RPC approach for signing
- Outline ERC-6492 verify
```

## Overview

**Sign-In with Ethereum (SIWE)** is a standard described by [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) for how Ethereum accounts authenticate with off-chain services by signing a standard message format. This guide details how to perform SIWE with Ox in a client-server architecture.

## Generate Nonce

Using [`Siwe.generateNonce`](/api/Siwe/generateNonce), you can generate a random nonce that can be used to prevent replay attacks.


```ts twoslash [Server]
import { Siwe } from 'ox'

function handler() {
  const nonce = Siwe.generateNonce()
  return nonce
}
```

Your server should generate a new nonce for each SIWE process it performs. The nonce should be stored for later use (e.g. in the session or database) to validate the signature.

## Create SIWE Message

Before you can create a SIWE message, you need to source the following information:

- `address`: The Ethereum address performing the signing.
- `chainId`: The [EIP-155](https://eips.ethereum.org/EIPS/eip-155) Chain ID to which the session is bound,
- `domain`: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) authority that is requesting the signing.
- `uri`: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986) URI referring to the resource that is the subject of the signing (as in the subject of a claim).
- `version`: The current version of the SIWE Message.

```ts twoslash [Client]
function onClick() {
  const data = {
    address: '<connected address>', // e.g. Wagmi `useAccount()`/`getAccount()`
    chainId: 1,
    domain: window.location.host,
    nonce: '<fetched from server>', // e.g. `await getNonceFromServer()`
    uri: window.location.origin,
    version: '1',
  } as const
}
```

Once you have the information, you can create the SIWE message with [`Siwe.createMessage`](/api/Siwe/createMessage).

```ts twoslash [Client]
import { Siwe } from 'ox'
 
function onClick() {
  const data = {
    address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    chainId: 1,
    domain: 'example.com',
    nonce: '65ed4681d4efe0270b923ff5f4b097b1c95974dc33aeebecd5724c42fd86dfd25dc70b27ef836b2aa22e68f19ebcccc1',
    uri: 'https://example.com/path',
    version: '1',
  } as const satisfies Siwe.Message
  const message = Siwe.createMessage(data) // [!code focus]
}
```

In addition, to the required fields, there are some optional fields you can include:

- `expirationTime`: Time when the signed authentication message is no longer valid.
- `issuedAt`: Time when the message was generated, typically the current time.
- `notBefore`: Time when the signed authentication message will become valid.
- `requestId`: A system-specific identifier that may be used to uniquely refer to the sign-in request.
- `resources`: A list of information or references to information the user wishes to have resolved as part of authentication by the relying party.
- `scheme`: [RFC 3986](https://www.rfc-editor.org/rfc/rfc3986#section-3.1) URI scheme of the origin of the request.
- `statement`: A human-readable ASCII assertion that the user will sign.

## Sign SIWE Message

Once the message is created, the next step is to sign it. In this guide, we will assume a browser wallet will sign over JSON-RPC, but you could also sign with [`Secp256k1.sign`](/api/Secp256k1/sign) if you have access to the private key directly.

```ts twoslash [Client]
import 'ox/window'
//---cut---
import { Hex, Provider, Siwe } from 'ox'
 
async function onClick() {
  const data = {
    address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    chainId: 1,
    domain: 'example.com',
    nonce: '65ed4681d4efe0270b923ff5f4b097b1c95974dc33aeebecd5724c42fd86dfd25dc70b27ef836b2aa22e68f19ebcccc1',
    uri: 'https://example.com/path',
    version: '1',
  } as const satisfies Siwe.Message
  const message = Siwe.createMessage(data)
  const provider = Provider.from(window.ethereum)  // [!code focus]
  const signature = await provider.request({  // [!code focus]
    method: 'personal_sign',  // [!code focus]
    params: [Hex.fromString(message), data.address],  // [!code focus]
  })  // [!code focus]
}
```

:::info
To keep this example simple, we use `window.ethereum` to create our [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Provider. Since `window.ethereum` is considered deprecated, you should use [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) instead. We recommend either using [Wagmi](https://wagmi.sh) to manage the wallet connection and signing, but you can also use a lower-level library like [`mipd`](https://github.com/wevm/mipd) if all you want is the provider.
:::

## Validate Signature

Now that we have our message and signature, we can validate them to confirm the address did indeed sign the message. This validation must be performed in such a way that it cannot be tampered with. In our case, we will use the server.

```ts twoslash [Server]
// @errors: 2322
import { Address, Hash, Hex, PersonalMessage, Secp256k1, Siwe } from 'ox'

function handler() {
  const payload = {
    //  ↑ Sent by client
    message: 'example.com wants you to sign in with your Ethereum account: ...',
    signature: '0x...',
  } as const

  // Parse message string into structured object
  const parsed = Siwe.parseMessage(payload.message)
  if (!parsed.address) return false

  // Validate message fields (e.g. `now >= expirationTime`), nonce, etc.
  const isValid = Siwe.validateMessage({
    message: parsed,
    nonce: '<nonce from session, database, etc.>',
  })
  if (!isValid) return false

  const personalMessage = PersonalMessage.encode(Hex.fromString(payload.message))
  const hash = Hash.keccak256(personalMessage)
  const verified = Address.isEqual(
    Address.from(parsed.address),
    Secp256k1.recoverAddress({ hash, signature: payload.signature }),
  )
  return verified
}
```


## Related Modules

| Module            | Description                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| [Siwe](/api/Siwe) | Utility functions for working with [Sign-In with Ethereum (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361). |
