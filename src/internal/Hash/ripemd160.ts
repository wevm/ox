import { ripemd160 as nobile_ripemd160 } from '@noble/hashes/ripemd160'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hash from '../../Hash.js'
import * as Hex from '../../Hex.js'

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
export function ripemd160<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: Hash.ripemd160.Options<as> = {},
): ripemd160.ReturnType<as> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const bytes = nobile_ripemd160(Bytes.from(value))
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

/* v8 ignore next */
ripemd160.parseError = (error: unknown) => error as ripemd160.ErrorType
