---
showOutline: 1
---

# AES-GCM Encryption

## Overview

[AES-GCM](https://cryptosys.net/pki/manpki/pki_aesgcmauthencryption.html) (AES with Galois/Counter Mode) is an encryption standard that combines high-performance encryption with built-in message integrity. 

The inputs for AES-GCM encryption are:

- arbitrary **[data](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#data)**: data to be encrypted
- a **[key](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#key)**: typically derived from a secure key derivation function like [PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#pbkdf2)
- an **[initialization vector (IV)](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams#iv)**: a unique one-time value used once for each encryption operation

## Encryption

Encryption of data is a two-step process. First, we will need to **generate a key** from a password using a secure key derivation function like [PBKDF2](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#pbkdf2). Once we have a key, we can then use it to encrypt our data.

Let's walk through an example of encrypting some arbitrary secret data.

::::steps

### Step 1: Derive a Key

First, we will need to derive a key from a password. We can use the [`AesGcm.getKey` function](/api/AesGcm/getKey) to do this.

```ts twoslash
import { AesGcm } from 'ox'

const key = await AesGcm.getKey({ password: 'qwerty' })
```

:::note
Ox uses the [PBKDF2 algorithm](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#pbkdf2) from the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) to derive keys from passwords.

It is also possible to set more derivation options like `salt` and `iterations`. [See more](/api/AesGcm/getKey#options)
:::

### Step 2: Encrypt Data

Now that we have a key, we can use it to encrypt some data using [`AesGcm.encrypt`](/api/AesGcm/encrypt).

```ts twoslash
import { AesGcm, Hex } from 'ox'

const key = await AesGcm.getKey({ password: 'qwerty' })

const data = Hex.fromString('i am top secret') // [!code focus]

const encrypted = await AesGcm.encrypt(data, key) // [!code focus]
```

### Step 3: Decrypt Data

We can decrypt encrypted data using the [`AesGcm.decrypt` function](/api/AesGcm/decrypt).

```ts twoslash
import { AesGcm, Hex } from 'ox'

const key = await AesGcm.getKey({ password: 'qwerty' })

const data = Hex.fromString('i am top secret')

const encrypted = await AesGcm.encrypt(data, key)

const decrypted = await AesGcm.decrypt(encrypted, key) // [!code focus]
```

::::

## Related Modules

| Module                | Description                               |
| --------------------- | ----------------------------------------- |
| [AesGcm](/api/AesGcm) | Utility functions for AES-GCM encryption. |
