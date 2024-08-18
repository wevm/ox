---
description: Checks if the given address is a valid address
---

# Address.isAddress 

Checks if the given address is a valid address.

## Imports

```ts twoslash
// @noErrors
// Named Module Import
import { Address } from 'ox'

// Module Imports
import * as Address from 'ox/Address'
import { isAddress } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

const isAddress = Address.isAddress('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e')
// true

const isAddress = Address.isAddress('0xdeadbeef')
// false
```

## Return Type

`boolean`

Whether the address is a valid address.

## Parameters

### value

- **Type:** `string`

Value to check if it is a valid address.

```ts twoslash
import { Address } from 'ox';

const isAddress = Address.isAddress(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e' // [!code focus]
);
```

### options

#### options.strict

- **Type:** `boolean`
- **Default:** `true`

Enables strict mode. Whether or not to compare the address against its checksum.

```ts twoslash
import { Address } from 'ox';

const address = Address.isAddress(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
  { strict: false } // [!code focus]
);
```