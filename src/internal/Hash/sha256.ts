import { sha256 as noble_sha256 } from '@noble/hashes/sha256'

import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import { Hex_validate } from '../Hex/validate.js'

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
export function Hash_sha256<as extends 'Hex' | 'Bytes' = 'Hex'>(
  value: Hex | Bytes,
  options: Hash_sha256.Options<as> = {},
): Hash_sha256.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = noble_sha256(
    Hex_validate(value, { strict: false }) ? Bytes_fromHex(value) : value,
  )
  if (as === 'Bytes') return bytes as never
  return Hex_fromBytes(bytes) as never
}

export declare namespace Hash_sha256 {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** The return type. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Hex_validate.ErrorType
    | Hex_fromBytes.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Hash_sha256.parseError = (error: unknown) => error as Hash_sha256.ErrorType
