---
description: Converts an address string to a typed Address
---

# Address.from 

**Alias:** `toAddress`

Converts an address string to a typed (checksummed) Address.

## Imports

```ts twoslash
// @noErrors
// Named Import
import { Address } from 'ox'

// Entrypoint Imports
import * as Address from 'ox/Address'
import { toAddress } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

const address = Address.from('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
// '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'

const address = Address.from(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e', 
  { checksum: false }
)
// '0xa0cf798816d4b9b9866b5330eea46a18382f251e'

const address = Address.from('hello')
// InvalidAddressError: Address "0xa" is invalid.
```

## Return Type

`Address`

The checksummed Address.

## Parameters

### address

- **Type:** `string`

An address string to convert to a typed Address.

```ts twoslash
import { Address } from 'ox';

const address = Address.from(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e' // [!code focus]
);
```

### options

#### options.checksum

- **Type:** `boolean`

Whether to checksum the address.

```ts twoslash
import { Address } from 'ox';

const address = Address.from(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
  { checksum: false } // [!code focus]
);
```