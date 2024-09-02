import { keccak_256 } from '@noble/hashes/sha3'

import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import { Hex_isHex } from '../Hex/isHex.js'
import type { Hex } from '../Hex/types.js'

/**
 * Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of a {@link Bytes#Bytes} or {@link Hex#Hex} value.
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
 * ### Calculate Hash of UTF-8 String
 *
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 *
 * Hash.keccak256(Hex.from('hello world'))
 * // @log: '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0'
 * ```
 *
 * @example
 * ### Configure Return Type
 *
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.keccak256('0xdeadbeef', 'Bytes')
 * // @log: Uint8Array [...]
 * ```
 *
 * @param value - {@link Bytes#Bytes} or {@link Hex#Hex} value.
 * @param to - The return type.
 * @returns Keccak256 hash.
 */
export function Hash_keccak256<to extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  to?: to | undefined,
): Hash_keccak256.ReturnType<to> {
  const to_ = to || 'Hex'
  const bytes = keccak_256(
    Hex_isHex(value, { strict: false }) ? Bytes_from(value) : value,
  )
  if (to_ === 'Bytes') return bytes as Hash_keccak256.ReturnType<to>
  return Hex_from(bytes) as Hash_keccak256.ReturnType<to>
}

export declare namespace Hash_keccak256 {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_from.ErrorType
    | Hex_from.ErrorType
    | Hex_isHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hash_keccak256.parseError = (error: unknown) =>
  error as Hash_keccak256.ErrorType
