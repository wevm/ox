---
description: Asserts that the given value is a valid address
---

# Address.assert

**Alias:** `assertAddress`

Asserts that the given value is a valid address.

## Imports

```ts twoslash
// @noErrors
// Named Import 
import { Address } from 'ox'

// Entrypoint Imports
import * as Address from 'ox/Address'
import { assertAddress } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

Address.assert('0xa0cf798816d4b9b9866b5330eea46a18382f251e')

Address.assert('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac')
// Address "0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac" is invalid.
//
// Details: Address does not match its checksum counterpart.

Address.assert('0xa')
// Address "0xa" is invalid.
//
// Details: Address is not a 20 byte hexadecimal value.
```

## Returns

`void`

## Parameters

### value

- **Type:** `string`

Value to assert if it is a valid address.

```ts twoslash
import { Address } from 'ox';

Address.assert(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e' // [!code focus]
);
```

## Parameters

### options

#### options.strict

- **Type:** `boolean`
- **Default:** `true`

Enables strict mode. Whether or not to compare the address against its checksum.

```ts twoslash
import { Address } from 'ox';

Address.assert(
  '0xa0cf798816d4b9b9866b5330eea46a18382f251e',
  { strict: false } // [!code focus]
);
```