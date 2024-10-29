import { ripemd160 } from '@noble/hashes/ripemd160'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Calculates the [Ripemd160](https://en.wikipedia.org/wiki/RIPEMD) hash of a {@link ox#(Bytes:namespace).(Bytes:type)} or {@link ox#(Hex:type)} value.
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
 * @param value - {@link ox#(Bytes:namespace).(Bytes:type)} or {@link ox#(Hex:type)} value.
 * @param options - Options.
 * @returns Ripemd160 hash.
 */
export function Hash_ripemd160<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Hex.Hex | Bytes.Bytes,
  options: Hash_ripemd160.Options<as> = {},
): Hash_ripemd160.ReturnType<as> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const bytes = ripemd160(Bytes.from(value))
  if (as === 'Bytes') return bytes as never
  return Hex.fromBytes(bytes) as never
}

export declare namespace Hash_ripemd160 {
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
Hash_ripemd160.parseError = (error: unknown) =>
  error as Hash_ripemd160.ErrorType
