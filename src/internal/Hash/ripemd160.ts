import { ripemd160 } from '@noble/hashes/ripemd160'

import { Bytes_fromHex } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/from.js'
import { Hex_isHex } from '../Hex/isHex.js'
import type { Hex } from '../Hex/types.js'

/**
 * Calculates the [Ripemd160](https://en.wikipedia.org/wiki/RIPEMD) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * This function is a re-export of `ripemd160` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library.
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
 * @param to - The return type.
 * @returns Ripemd160 hash.
 */
export function Hash_ripemd160<to extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  to?: to | undefined,
): Hash_ripemd160.ReturnType<to> {
  const to_ = to || 'Hex'
  const bytes = ripemd160(
    Hex_isHex(value, { strict: false }) ? Bytes_fromHex(value) : value,
  )
  if (to_ === 'Bytes') return bytes as Hash_ripemd160.ReturnType<to>
  return Hex_fromBytes(bytes) as Hash_ripemd160.ReturnType<to>
}

export declare namespace Hash_ripemd160 {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Hex_isHex.ErrorType
    | Hex_fromBytes.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hash_ripemd160.parseError = (error: unknown) =>
  error as Hash_ripemd160.ErrorType
