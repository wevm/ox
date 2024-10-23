# Bytes & Hex

## Overview

When working with Ethereum, data can commonly be represented as either:

- **hexadecimal strings** (a `0x`-prefixed string containing of hexadecimal characters), and/or
- **byte arrays** (a sequence of unsigned 8-bit integers)

For the purposes of this guide, we will refer to them as "Hex" and "Bytes" respectively.

[Bytes](/api/Bytes) & [Hex](/api/Hex) are representations of byte data, commonly used for addresses, hashes, signatures, and other encoded/serialized data.

The following types are used to represent Hex & Bytes:
- [`Hex.Hex`](/api/Hex/types#hexhex): a `string` prefixed with `0x`.
- [`Bytes.Bytes`](/api/Bytes/types#bytesbytes) – a `Uint8Array` instance.

## Instantiation

`Hex` & `Bytes` can be instantiated from their respective `.from` functions: [`Hex.from`](/api/Hex#from) & [`Bytes.from`](/api/Bytes#from).

```ts twoslash
import { Bytes, Hex } from 'ox'

const hex = Hex.from('0xdeadbeef')
// '0xdeadbeef'

const bytes = Bytes.from([0xde, 0xad, 0xbe, 0xef])
// Uint8Array [0xde, 0xad, 0xbe, 0xef] 
```

:::tip
**Tip:** Hex can also be instantiated from Bytes, and vice versa:

```ts twoslash
import { Bytes, Hex } from 'ox'
// ---cut---
const hex = Hex.from(Bytes.from([0xde, 0xad, 0xbe, 0xef]))
// @log: '0xdeadbeef'

const bytes = Bytes.from(Hex.from('0xdeadbeef'))
// @log: Uint8Array [0xde, 0xad, 0xbe, 0xef] 
```
:::

It is also possible to instantiate `Hex` and `Bytes` from primitive JavaScript types using:

- [`Hex.fromBoolean`](/api/Hex#fromboolean) / [`Bytes.fromBoolean`](/api/Bytes#fromboolean)
- [`Hex.fromNumber`](/api/Hex#fromnumber) / [`Bytes.fromNumber`](/api/Bytes#fromnumber)
- [`Hex.fromString`](/api/Hex#fromstring) / [`Bytes.fromString`](/api/Bytes#fromstring)

```ts twoslash
import { Bytes, Hex } from 'ox'

const bool = Hex.fromBoolean(true)
// @log: '0x01'

const bigint = Hex.fromNumber(420n)
// @log: '0x01a4'

const number = Bytes.fromNumber(420)
// @log: Uint8Array [1, 164]

const string = Hex.fromString('hello')
// @log: '0x68656c6c6f'
```

## Conversion

`Hex` & `Bytes` can be converted to primitive JavaScript types using:

- [`Hex.toBigInt`](/api/Hex#tobigint) / [`Bytes.toBigInt`](/api/Bytes#tobigint)
- [`Hex.toBoolean`](/api/Hex#toboolean) / [`Bytes.toBoolean`](/api/Bytes#toboolean)
- [`Hex.toNumber`](/api/Hex#tonumber) / [`Bytes.toNumber`](/api/Bytes#tonumber)
- [`Hex.toString`](/api/Hex#tostring) / [`Bytes.toString`](/api/Bytes#tostring)

```ts twoslash
import { Bytes, Hex } from 'ox'

const bool = Bytes.toBoolean(Bytes.from([1]))
// @log: true

const bigint = Hex.toBigInt('0x01a4')
// @log: 420n

const number = Bytes.toNumber(Bytes.from([1, 164]))
// @log: 420

const string = Hex.toString('0x68656c6c6f')
// @log: 'hello'
```

## Manipulation

### Concatenation

Hex & Bytes can be concatenated using their respective `.concat` methods: [`Hex.concat`](/api/Hex/concat) & [`Bytes.concat`](/api/Bytes/concat):

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.concat('0xdead', '0xbeef')
// @log: '0xdeadbeef'

Bytes.concat(
  Bytes.from([0xde, 0xad]),
  Bytes.from([0xbe, 0xef]),
)
// @log: Uint8Array [0xde, 0xad, 0xbe, 0xef]
```

### Equality

Hex & Bytes can be compared for equality using the `isEqual` method: [`Hex.isEqual`](/api/Hex/isEqual) & [`Bytes.isEqual`](/api/Bytes/isEqual):

```ts twoslash
import { Bytes } from 'ox'

const a = Bytes.from([0xde, 0xad, 0xbe, 0xef])
const b = Bytes.from([0xca, 0xfe, 0xba, 0xbe])

Bytes.isEqual(a, b)
// @log: false
```

### Padding

Hex & Bytes can be padded to the left or right with empty bytes using their respective `.padLeft` & `.padRight` methods: [`Hex.padLeft`](/api/Hex/padLeft), [`Hex.padRight`](/api/Hex/padRight), [`Bytes.padLeft`](/api/Bytes/padLeft), [`Bytes.padRight`](/api/Bytes/padRight). 

By default, the length of the final size is `32` bytes.

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.padLeft(Hex.from('0xdead'))
// @log: '0x00000000000000000000000000000000000000000000000000000000000000dead'

Bytes.padLeft(Bytes.from([0xde, 0xad]), 4)
// @log: Uint8Array [0x00, 0x00, 0xde, 0xad]

Hex.padRight(Hex.from('0xdead'))
// @log: '0xdead000000000000000000000000000000000000000000000000000000000000'

Bytes.padRight(Bytes.from([0xde, 0xad]), 4)
// @log: Uint8Array [0xde, 0xad, 0x00, 0x00]
```

### Size

The size of a `Hex` or `Bytes` can be retrieved using the `.size` property: [`Hex.size`](/api/Hex#size) & [`Bytes.size`](/api/Bytes#size).

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.size('0xdeadbeefdeadbeefdeadbeefdeadbeef')
// @log: 16

Bytes.size(Bytes.from([0xde, 0xad, 0xbe, 0xef]))
// @log: 4
```

### Slicing

Hex & Bytes can be sliced using their respective `.slice` functions: [`Hex.slice`](/api/Hex/slice) & [`Bytes.slice`](/api/Bytes/slice).

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.slice('0x0123456789', 1, 4)
// @log: '0x234567'

Bytes.slice(Bytes.from([0xde, 0xad, 0xbe, 0xef]), 0, 2)
// @log: Uint8Array [0xde, 0xad]
```

### Trimming

Hex & Bytes can be trimmed of their leading & trailing empty bytes using their respective functions: [`Hex.trimLeft`](/api/Hex/trimLeft), [`Hex.trimRight`](/api/Hex/trimRight), [`Bytes.trimLeft`](/api/Bytes/trimLeft), [`Bytes.trimRight`](/api/Bytes/trimRight).

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.trimLeft('0x00000000000000000000000000000000000000000000000000000000000000dead')
// @log: '0xdead'

Bytes.trimLeft(Bytes.from([0x00, 0x00, 0xde, 0xad]))
// @log: Uint8Array [0xde, 0xad]

Hex.trimRight('0xdead000000000000000000000000000000000000000000000000000000000000')
// @log: '0xdead'

Bytes.trimRight(Bytes.from([0xde, 0xad, 0x00, 0x00]))
// @log: Uint8Array [0xde, 0xad]
```

### Validation

Hex & Bytes can be validated using their respective `.validate` functions: [`Hex.validate`](/api/Hex#validate) & [`Bytes.validate`](/api/Bytes#validate).

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.validate('0xdeadbeefz')
// @log: false

Bytes.validate(Bytes.from([0xde, 0xad, 0xbe, 0xef]))
// @log: true
```

It is also possible to assert that a `Hex` or `Bytes` is valid using `.assert`: [`Hex.assert`](/api/Hex#assert) & [`Bytes.assert`](/api/Bytes#assert). This will throw an error if the value is invalid.

```ts twoslash
import { Bytes, Hex } from 'ox'

Hex.assert('abc')
// @error: Error: Hex.InvalidHexValueError

Bytes.assert(Bytes.from([0xde, 0xad, 0xbe, 0xef]))
// @log: no error :)
```
