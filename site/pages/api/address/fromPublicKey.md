---
description: Converts an ECDSA public key to an Ethereum address.
---

# Address.fromPublicKey

**Alias:** `publicKeyToAddress`

Converts an ECDSA public key to an Ethereum address.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Address } from 'ox'

// Entrypoint Imports
import * as Address from 'ox/Address'
import { publicKeyToAddress } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

const address = Address.fromPublicKey('0x...')
// '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'

const address = Address.fromPublicKey(
  '0x...', 
  { checksum: false }
)
// '0xa0cf798816d4b9b9866b5330eea46a18382f251e'
```

## Return Type

`Address`

The checksummed Address.

## Parameters

### publicKey

- **Type:** `Hex | Bytes`

An ECDSA public key to convert to an Address.

```ts twoslash
import { Address } from 'ox';

const address = Address.fromPublicKey(
  '0x...', // [!code focus]
);
```

### options

#### options.checksum

- **Type:** `boolean`

Whether to checksum the address.

```ts twoslash
import { Address } from 'ox';

const address = Address.fromPublicKey(
  '0x...',
  { checksum: false } // [!code focus]
);
```