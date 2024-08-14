# Bytes.from 

**Alias:** `toBytes`

Encodes an arbitrary value to `Uint8Array` **[Bytes](/api/bytes)**.

## Imports

```ts twoslash
// @noErrors
// Namespace 
import { Bytes } from 'ox'

// Module
import * as Bytes from 'ox/Bytes'

// Function
import { toBytes } from 'ox/Bytes'
```

## Usage

```ts twoslash
// @noErrors
import { Bytes } from 'ox';

const bytes = Bytes.from(420)
// Uint8Array([1, 164])

const bytes = Bytes.from('abc');
// Uint8Array([97, 98, 99])

const bytes = Bytes.from('abc', { size: 32 });
// Uint8Array([97, 98, 99, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

const bytes = Bytes.from(true, { size: 8 })
// Uint8Array([0, 0, 0, 0, 0, 0, 0, 1])
```

## Return Type

`Uint8Array`

## Parameters

### value

- **Type:** `string | bigint | number | boolean | Hex | Bytes`

An arbitrary value to encode to Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.from(
  'hello world' // [!code focus]
);
```

### options

#### options.size

- **Type:** `number`

Size of the output Bytes.

```ts twoslash
import { Bytes } from 'ox';

const bytes = Bytes.from(
  'hello world',
  { size: 32 } // [!code focus]
);
```