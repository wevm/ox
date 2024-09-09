import { sha256 as noble_sha256 } from '@noble/hashes/sha256'

import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import { Hex_isHex } from '../Hex/isHex.js'
import type { Hex } from '../Hex/types.js'

/**
 * Calculates the [Sha256](https://en.wikipedia.org/wiki/SHA-256) hash of a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value.
 *
 * This function is a re-export of `sha256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes), an audited & minimal JS hashing library.
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
 * @param to - The return type.
 * @returns Sha256 hash.
 */
export function Hash_sha256<to extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  to_?: to | undefined,
): Hash_sha256.ReturnType<to> {
  const to = to_ || 'Hex'
  const bytes = noble_sha256(
    Hex_isHex(value, { strict: false }) ? Bytes_from(value) : value,
  )
  if (to === 'Bytes') return bytes as never
  return Hex_from(bytes) as never
}

export declare namespace Hash_sha256 {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_from.ErrorType
    | Hex_isHex.ErrorType
    | Hex_from.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hash_sha256.parseError = (error: unknown) => error as Hash_sha256.ErrorType
