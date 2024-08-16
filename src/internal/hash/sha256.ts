import { sha256 as noble_sha256 } from '@noble/hashes/sha256'

import { toBytes } from '../bytes/toBytes.js'
import { isHex } from '../data/isHex.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'hex' | 'bytes'

export declare namespace sha256 {
  type ReturnType<to extends To> =
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'hex' ? Hex : never)

  type ErrorType =
    | toBytes.ErrorType
    | isHex.ErrorType
    | toHex.ErrorType
    | ErrorType_
}

/**
 * Calculates the [Sha256](https://en.wikipedia.org/wiki/SHA-256) hash of a Bytes or Hex value.
 *
 * This function is a re-export of `sha256` from [`@noble/hashes`](https://github.com/paulmillr/noble-hashes) – an audited & minimal JS hashing library.
 *
 * @example
 * import { Hash } from 'ox'
 *
 * Hash.sha256('0xdeadbeef')
 * // '0x5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953'
 */
export function sha256<to extends To = 'hex'>(
  value: Hex | Bytes,
  to_?: to | undefined,
): sha256.ReturnType<to> {
  const to = to_ || 'hex'
  const bytes = noble_sha256(
    isHex(value, { strict: false }) ? toBytes(value) : value,
  )
  if (to === 'bytes') return bytes as sha256.ReturnType<to>
  return toHex(bytes) as sha256.ReturnType<to>
}
