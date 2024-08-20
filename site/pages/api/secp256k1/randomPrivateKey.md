---
description: Generates a random ECDSA private key on the secp256k1 curve.
---

# Secp256k1.randomPrivateKey

Generates a random ECDSA private key on the secp256k1 curve.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Secp256k1 } from 'ox'

// Entrypoint Imports
import * as Secp256k1 from 'ox/Secp256k1'
import { randomPrivateKey } from 'ox/Secp256k1'
```

## Usage

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const privateKey = Secp256k1.randomPrivateKey()
```

## Returns

`Hex | Bytes`

A private key.

## Parameters

### options.to

- **Type:** `'hex' | 'bytes'`
- **Default:** `'hex'`

Format of the returned private key.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const privateKey = Secp256k1.randomPrivateKey({ 
  to: 'bytes' // [!code focus]
})
```