---
description: Recovers the signing address from the signed payload and signature.
---

# Secp256k1.recoverAddress

Recovers the signing address from the signed payload and signature.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Secp256k1 } from 'ox'

// Entrypoint Imports
import * as Secp256k1 from 'ox/Secp256k1'
import { recoverAddress } from 'ox/Secp256k1'
```

## Usage

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})

const address = Secp256k1.recoverAddress({ // [!code focus]
  payload: '0xdeadbeef', // [!code focus]
  signature, // [!code focus]
}) // [!code focus]
```

## Returns

`Address`

The recovered address.

## Parameters

### payload

- **Type:** `Hex | Bytes`

Payload that was signed.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})
// ---cut---
const address = Secp256k1.recoverAddress({
  payload: '0xdeadbeef', // [!code focus]
  signature,
})
```

### signature

- **Type:** `Signature`

Signature of the signed payload.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

// ---cut---
const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})

const address = Secp256k1.recoverAddress({
  payload: '0xdeadbeef',
  signature, // [!code focus]
})
```

### options.to

- **Type:** `'hex' | 'bytes'`

Format of the returned address.

```ts twoslash
// @noErrors
import { Secp256k1 } from 'ox'

const signature = Secp256k1.sign({ 
  payload: '0xdeadbeef', 
  privateKey: '0x...' 
})
// ---cut---
const address = Secp256k1.recoverAddress({
  payload: '0xdeadbeef',
  signature,
  to: 'hex', // [!code focus]
})
```