import { ripemd160 as noble_ripemd160 } from '@noble/hashes/ripemd160'

import { toBytes } from '../bytes/toBytes.js'
import { isHex } from '../data/isHex.js'
import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Calculates the [Ripemd160](https://en.wikipedia.org/wiki/RIPEMD) hash of a Bytes or Hex value.
 *
 * This function is a re-export of `keccak_256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) – an audited & minimal JS hashing library.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.ripemd160('0xdeadbeef')
 * // '0x226821c2f5423e11fe9af68bd285c249db2e4b5a'
 * ```
 */
export function ripemd160<to extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  to_?: to | undefined,
): ripemd160.ReturnType<to> {
  const to = to_ || 'Hex'
  const bytes = noble_ripemd160(
    isHex(value, { strict: false }) ? toBytes(value) : value,
  )
  if (to === 'Bytes') return bytes as ripemd160.ReturnType<to>
  return toHex(bytes) as ripemd160.ReturnType<to>
}

export declare namespace ripemd160 {
  type ReturnType<to extends 'Hex' | 'Bytes'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | toBytes.ErrorType
    | isHex.ErrorType
    | toHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
ripemd160.parseError = (error: unknown) => error as ripemd160.ErrorType
