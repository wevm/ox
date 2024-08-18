---
description: Computes the checksum address for the given address
---

# Address.checksum

**Alias:** `checksumAddress`

Computes the checksum address for the given address.

## Imports

```ts twoslash
// @noErrors
// Named Module Import 
import { Address } from 'ox'

// Module Imports
import * as Address from 'ox/Address'
import { checksumAddress } from 'ox/Address'
```

## Usage

```ts twoslash
// @noErrors
import { Address } from 'ox';

Address.checksum('0xa0cf798816d4b9b9866b5330eea46a18382f251e')
// '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'
```