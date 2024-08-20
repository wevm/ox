---
description: Computes the ECDSA public key from a provided private key.
---

# Secp256k1.getPublicKey

Computes the ECDSA public key from a provided private key.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Secp256k1 } from 'ox'

// Entrypoint Imports
import * as Secp256k1 from 'ox/Secp256k1'
import { getPublicKey } from 'ox/Secp256k1'
```

## Usage

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const privateKey = '0x...' as const
const publicKey = Secp256k1.getPublicKey({ privateKey })
```

## Returns

`Hex | Bytes`

The public key.

## Parameters

### privateKey

- **Type:** `Hex | Bytes`

Private key to compute the public key from.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const publicKey = Secp256k1.getPublicKey({
  privateKey: '0x...' // [!code focus]
})
```

### options.to

- **Type:** `'hex' | 'bytes'`
- **Default:** `'hex'`

Format of the returned public key.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const publicKey = Secp256k1.getPublicKey({
  privateKey: '0x...',
  to: 'bytes' // [!code focus]
})
```