---
description: "Create WebAuthn credentials, derive keys, and verify passkey signatures."
---

# WebAuthn Signers

## Overview

The [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) contains a number of different credential types, including a credential with support for the P256 curve. This means that you can use WebAuthn-enabled authenticators like a [Passkey](https://passkeys.dev) or a [Yubikey](https://en.wikipedia.org/wiki/YubiKey) to sign transactions and arbitrary payloads. 

By combining WebAuthn Signers with Account Abstraction, this means that Smart Contract Accounts can verify WebAuthn-P256 signatures with onchain arbitrary signature verification mechanisms such as [EIP-1271: Signature Verification for Contracts](https://eips.ethereum.org/EIPS/eip-1271).

Ox exports the [`WebAuthn`](/api/WebAuthn) module, which contains utilities for working with WebAuthn credentials, PRFs, and P256 signatures.

## Examples

### Registering a WebAuthn Credential

A WebAuthn credential can be registered using the [`WebAuthn.createCredential`](/api/WebAuthn/createCredential) function.

```ts twoslash
import { WebAuthn } from 'ox'

const credential = await WebAuthn.createCredential({ name: 'Example' }) // [!code focus]
//    ^?



```

### Deriving Keys

Set `prf: true` to evaluate the credential-bound PRF, then derive signing and encryption keys from its output.

```ts twoslash
import { AesGcm, Ed25519, MlDsa44, Secp256k1, WebAuthn } from 'ox'

const credential = await WebAuthn.createCredential({
  name: 'Example',
  prf: true,
})
const secp256k1PrivateKey = Secp256k1.fromPrf(credential.prf)
const ed25519PrivateKey = Ed25519.fromPrf(credential.prf)
const mlDsa44PrivateKey = MlDsa44.fromPrf(credential.prf)
const encryptionKey = await AesGcm.fromPrf(credential.prf)
```

Each module uses a fixed derivation domain, so these keys are independent. Use the same PRF input with the same credential to reproduce them.

```ts twoslash
import { Ed25519, WebAuthn } from 'ox'

const credentialId = 'oZ48...'
const response = await WebAuthn.getCredential({
  credentialId,
  prf: true,
})
const privateKey = Ed25519.fromPrf(response.prf)
```

:::warning
Treat PRF outputs and derived keys as secrets. Do not serialize or send the raw WebAuthn credential or response.

PRF-derived keys are software keys. Code on any origin allowed to use the same RP ID can request the same output after user verification.
:::

### Releasing the PRF Output

The PRF output is the root secret — every key above derives from it. It carries a `Symbol.dispose` handler that zero-fills it, so it can be bound with a [`using` declaration](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/using) to release it as soon as the scope exits.

```ts twoslash
import { Secp256k1, WebAuthn } from 'ox'

async function sign(payload: `0x${string}`) {
  const credential = await WebAuthn.createCredential({
    name: 'Example',
    prf: true,
  })

  using prf = credential.prf
  const privateKey = Secp256k1.fromPrf(prf)
  return Secp256k1.sign({ payload, privateKey })
  // `prf` is zero-filled on scope exit.
}
```

It can also be released manually at any point with `prf.fill(0)` (equivalent to what disposal does). The `fromPrf` functions zero their intermediate material internally; keys derived with the default `Hex` output are immutable strings, while `as: 'Bytes'` hands you the only copy, which you can release with `privateKey.fill(0)`. `AesGcm.fromPrf` needs no cleanup — it returns a non-extractable `CryptoKey`.

### Signing a Payload

Once we have a credential, we can use the [`WebAuthn.sign`](/api/WebAuthn/sign) function to sign a challenge (payload).

```ts twoslash
import { WebAuthn } from 'ox'

const credential = await WebAuthn.createCredential({ name: 'Example' })

const { metadata, signature } = await WebAuthn.sign({ // [!code focus]
  challenge: '0xdeadbeef', // [!code focus]
  credentialId: credential.id, // [!code focus]
}) // [!code focus]

metadata // [!code focus]
// ^?









signature // [!code focus]
// ^?







```

:::note
The return value of `WebAuthn.sign` contains the `metadata` and `signature` of the signed challenge. The `metadata` contains information about the authenticator that was used to sign the challenge, and is also used to verify the signature.
:::

### Verifying a Signature

Signatures can be verified using the [`WebAuthn.verify`](/api/WebAuthn/verify) function.

```ts twoslash
import { WebAuthn } from 'ox'

const credential = await WebAuthn.createCredential({
  name: 'Example',
})

const { metadata, signature } = await WebAuthn.sign({
  credentialId: credential.id,
  challenge: '0xdeadbeef',
})

const verified = await WebAuthn.verify({ // [!code focus]
  metadata, // [!code focus]
  challenge: '0xdeadbeef', // [!code focus]
  publicKey: credential.publicKey, // [!code focus]
  signature, // [!code focus]
}) // [!code focus]
```

## Related Modules

| Module                    | Description                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| [WebAuthn](/api/WebAuthn) | Utilities for WebAuthn credentials, PRFs, and P256 signatures.      |
