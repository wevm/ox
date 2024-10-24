# WebAuthn Signers

## Overview

The [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) contains a number of different credential types, including a credential with support for the P256 curve. This means that you can use WebAuthn-enabled authenticators like a [Passkey](https://passkeys.dev) or a [Yubikey](https://en.wikipedia.org/wiki/YubiKey) to sign transactions and arbitrary payloads. 

By combining WebAuthn Signers with Account Abstraction, this means that Smart Contract Accounts can verify WebAuthn-P256 signatures with onchain arbitrary signature verification mechanisms such as [EIP-1271: Signature Verification for Contracts](https://eips.ethereum.org/EIPS/eip-1271).

Ox exports the [`WebAuthnP256`](/api/WebAuthnP256) module, which contains utilities for working with a WebAuthn-P256 Signer.

## Example

### Registering a WebAuthn Credential

A WebAuthn credential can be registered using the [`WebAuthnP256.createCredential`](/api/WebAuthnP256/createCredential) function.

```ts twoslash
import { WebAuthnP256 } from 'ox'

const credential = await WebAuthnP256.createCredential({ name: 'Example' }) // [!code focus]
//    ^?



```

### Signing a Payload

Once we have a credential, we can use the [`WebAuthnP256.sign`](/api/WebAuthnP256/sign) function to sign a challenge (payload).

```ts twoslash
import { WebAuthnP256 } from 'ox'

const credential = await WebAuthnP256.createCredential({ name: 'Example' })

const { metadata, signature } = await WebAuthnP256.sign({ // [!code focus]
  credentialId: credential.id, // [!code focus]
  challenge: '0xdeadbeef', // [!code focus]
}) // [!code focus]

metadata // [!code focus]
// ^?









signature // [!code focus]
// ^?







```

:::note
The return value of `WebAuthnP256.sign` contains the `metadata` and `signature` of the signed challenge. The `metadata` contains information about the authenticator that was used to sign the challenge, and is also used to verify the signature.
:::

### Verifying a Signature

Signatures can be verified using the [`WebAuthnP256.verify`](/api/WebAuthnP256/verify) function.

```ts twoslash
import { WebAuthnP256 } from 'ox'

const credential = await WebAuthnP256.createCredential({
  name: 'Example',
})

const { metadata, signature } = await WebAuthnP256.sign({
  credentialId: credential.id,
  challenge: '0xdeadbeef',
})

const verified = await WebAuthnP256.verify({ // [!code focus]
  metadata, // [!code focus]
  challenge: '0xdeadbeef', // [!code focus]
  publicKey: credential.publicKey, // [!code focus]
  signature, // [!code focus]
}) // [!code focus]
```



