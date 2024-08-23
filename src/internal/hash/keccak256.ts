import { keccak_256 } from '@noble/hashes/sha3'

import { toBytes } from '../bytes/toBytes.js'
import { isHex } from '../data/isHex.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'Hex' | 'Bytes'

/**
 * Calculates the [Keccak256](https://en.wikipedia.org/wiki/SHA-3) hash of a Bytes or Hex value.
 *
 * This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) – an audited & minimal JS hashing library.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 * Hash.keccak256('0xdeadbeef')
 * // '0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1'
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Hash, Hex } from 'ox'
 * Hash.keccak256(Hex.from('hello world'))
 * // '0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0'
 * ```
 */
export function keccak256<to extends To = 'Hex'>(
  value: Hex | Bytes,
  to_?: to | undefined,
): keccak256.ReturnType<to> {
  const to = to_ || 'Hex'
  const bytes = keccak_256(
    isHex(value, { strict: false }) ? toBytes(value) : value,
  )
  if (to === 'Bytes') return bytes as keccak256.ReturnType<to>
  return toHex(bytes) as keccak256.ReturnType<to>
}

export declare namespace keccak256 {
  type ReturnType<to extends To> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | toBytes.ErrorType
    | toHex.ErrorType
    | isHex.ErrorType
    | GlobalErrorType
}

keccak256.parseError = (error: unknown) => error as keccak256.ErrorType
