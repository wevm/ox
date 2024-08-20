---
description: Signs the payload with the provided private key.
---

# Secp256k1.verify

Verifies a payload was signed by the provided address.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Secp256k1 } from 'ox'

// Entrypoint Imports
import * as Secp256k1 from 'ox/Secp256k1'
import { verify } from 'ox/Secp256k1'
```

## Usage

```ts twoslash
// @noErrors
import { Address, Secp256k1 } from 'ox'

const privateKey = Secp256k1.randomPrivateKey()
const address = Address.from(Secp256k1.getPublicKey({ privateKey }))

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey,
})

const verified = Secp256k1.verify({ // [!code focus]
  address, // [!code focus]
  payload: '0xdeadbeef', // [!code focus]
  signature, // [!code focus]
}) // [!code focus]
```

## Returns

`boolean`

Whether the payload was signed by the provided address.

## Parameters

### address

- **Type:** `Address`

Address to verify.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})
// ---cut---
const verified = Secp256k1.verify({ 
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code focus]
  payload: '0xdeadbeef', 
  signature, 
}) 
```

### payload

- **Type:** `Hex | Bytes`

Payload to verify.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})
// ---cut---
const verified = Secp256k1.verify({ 
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 
  payload: '0xdeadbeef', // [!code focus]
  signature, 
}) 
```

### signature

- **Type:** `Signature`

Signature to verify.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'
// ---cut---
const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})

const verified = Secp256k1.verify({ 
  address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', 
  payload: '0xdeadbeef',
  signature, // [!code focus]
}) 
```

