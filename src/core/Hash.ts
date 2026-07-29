import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as engine from './internal/hash.js'

/**
 * Calculates the [BLAKE3](https://github.com/BLAKE3-team/BLAKE3) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Backed by `blake3` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library, unless another implementation is installed with {@link ox#Engine.set}.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.blake3('0xdeadbeef')
 * // @log: '0x53147f3ce49ed4f60dfa5b9654c36ba6103c11f5737df3dabd4cbd296c4161bd'
 * ```
 *
 * @example
 * ### Configure Return Type
 *
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.blake3('0xdeadbeef', { as: 'Bytes' })
 * // @log: Uint8Array [...]
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 * @param options - Options.
 * @returns BLAKE3 hash.
 */
export function blake3<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: blake3.Options<as> = {},
): blake3.ReturnType<as> {
  const isBytes = value instanceof Uint8Array
  const { as = isBytes ? 'Bytes' : 'Hex' } = options
  const bytes = engine.blake3(isBytes ? value : Bytes.from(value))
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace blake3 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** The return type. Defaults to the input format. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Backed by `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library, unless another implementation is installed with {@link ox#Engine.set}.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.keccak256('0xdeadbeef')
 * // @log: '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
 * ```
 *
 * @example
 * ### Calculate Hash of a String
 *
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 *
 * Hash.keccak256(Hex.fromString('hello world'))
 * // @log: '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0'
 * ```
 *
 * @example
 * ### Configure Return Type
 *
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.keccak256('0xdeadbeef', { as: 'Bytes' })
 * // @log: Uint8Array [...]
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 * @param options - Options.
 * @returns Keccak256 hash.
 */
export function keccak256<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: keccak256.Options<as> = {},
): keccak256.ReturnType<as> {
  const isBytes = value instanceof Uint8Array
  const { as = isBytes ? 'Bytes' : 'Hex' } = options
  const bytes = engine.keccak256(isBytes ? value : Bytes.from(value))
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace keccak256 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Calculates the [HMAC-SHA256](https://en.wikipedia.org/wiki/HMAC) of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Backed by `hmac` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library, unless another implementation is installed with {@link ox#Engine.set}.
 *
 * @example
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 *
 * Hash.hmac256(Hex.fromString('key'), '0xdeadbeef')
 * // @log: '0x...'
 * ```
 *
 * @example
 * ### Configure Return Type
 *
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 *
 * Hash.hmac256(Hex.fromString('key'), '0xdeadbeef', {
 *   as: 'Bytes'
 * })
 * // @log: Uint8Array [...]
 * ```
 *
 * @param key - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} key.
 * @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 * @param options - Options.
 * @returns HMAC-SHA256 hash.
 */
export function hmac256<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  key: Hex.Hex | Bytes.Bytes,
  value: value | Hex.Hex | Bytes.Bytes,
  options: hmac256.Options<as> = {},
): hmac256.ReturnType<as> {
  const isBytes = value instanceof Uint8Array
  const { as = isBytes ? 'Bytes' : 'Hex' } = options
  const keyBytes = key instanceof Uint8Array ? key : Bytes.from(key)
  const valueBytes = isBytes ? value : Bytes.from(value)
  const bytes = engine.hmacSha256(keyBytes, valueBytes)
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace hmac256 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Calculates the [Ripemd160](https://en.wikipedia.org/wiki/RIPEMD) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Backed by `ripemd160` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library, unless another implementation is installed with {@link ox#Engine.set}.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.ripemd160('0xdeadbeef')
 * // '0x226821c2f5423e11fe9af68bd285c249db2e4b5a'
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 * @param options - Options.
 * @returns Ripemd160 hash.
 */
export function ripemd160<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: ripemd160.Options<as> = {},
): ripemd160.ReturnType<as> {
  const isBytes = value instanceof Uint8Array
  const { as = isBytes ? 'Bytes' : 'Hex' } = options
  const bytes = engine.ripemd160(isBytes ? value : Bytes.from(value))
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace ripemd160 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Calculates the [Sha256](https://en.wikipedia.org/wiki/SHA-256) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * Backed by `sha256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library, unless another implementation is installed with {@link ox#Engine.set}.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.sha256('0xdeadbeef')
 * // '0x5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953'
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 * @param options - Options.
 * @returns Sha256 hash.
 */
export function sha256<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: sha256.Options<as> = {},
): sha256.ReturnType<as> {
  const isBytes = value instanceof Uint8Array
  const { as = isBytes ? 'Bytes' : 'Hex' } = options
  const bytes = engine.sha256(isBytes ? value : Bytes.from(value))
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace sha256 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Checks if a string is a valid hash value.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.validate('0x')
 * // @log: false
 *
 * Hash.validate(
 *   '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0'
 * )
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns Whether the value is a valid hash.
 */
export function validate(value: string): value is Hex.Hex {
  return Hex.validate(value) && Hex.size(value) === 32
}

export declare namespace validate {
  type ErrorType =
    | Hex.validate.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}
