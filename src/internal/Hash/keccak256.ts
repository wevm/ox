import { keccak_256 } from '@noble/hashes/sha3'

import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import { Hex_isHex } from '../Hex/isHex.js'
import type { Hex } from '../Hex/types.js'

/**
 * Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library.
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
 * @param to - The return type.
 * @returns Keccak256 hash.
 */
export function Hash_keccak256<as extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  options: Hash_keccak256.Options<as> = {},
): Hash_keccak256.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = keccak_256(
    Hex_isHex(value, { strict: false }) ? Bytes_fromHex(value) : value,
  )
  if (as === 'Bytes') return bytes as never
  return Hex_fromBytes(bytes) as never
}

export declare namespace Hash_keccak256 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Hex_fromBytes.ErrorType
    | Hex_isHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hash_keccak256.parseError = (error: unknown) =>
  error as Hash_keccak256.ErrorType
