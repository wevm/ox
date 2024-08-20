---
description: Signs the payload with the provided private key.
---

# Secp256k1.sign

Signs the payload with the provided private key.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Secp256k1 } from 'ox'

// Entrypoint Imports
import * as Secp256k1 from 'ox/Secp256k1'
import { sign } from 'ox/Secp256k1'
```

## Usage

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})
```

## Returns

`Signature`

The signature of the signed payload.

## Parameters

### payload

- **Type:** `Hex | Bytes`

Payload to sign.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', // [!code focus]
  privateKey: '0x...' 
})
```

### privateKey

- **Type:** `Hex | Bytes`

ECDSA private key.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef',
  privateKey: '0x...'  // [!code focus]
})
```
