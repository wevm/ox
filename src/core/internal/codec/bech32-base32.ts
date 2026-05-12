import * as Errors from '../../Errors.js'

/**
 * Bech32/BIP-173 base32 alphabet. Shared between `Base32` and `Bech32m`.
 *
 * @internal
 */
export const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** @internal */
export const alphabetMap = /*#__PURE__*/ (() => {
  const map: Record<string, number> = {}
  for (let i = 0; i < alphabet.length; i++) map[alphabet[i]!] = i
  return map
})()

/**
 * Repacks bits between two power-of-two bases (`fromBits` -> `toBits`).
 *
 * When `pad` is `true`, leftover bits are zero-padded to a final symbol. When
 * `pad` is `false`, leftover bits must be zero (canonical form per BIP-173)
 * and a non-zero remainder throws `InvalidPaddingError`.
 *
 * @internal
 */
export function convertBits(
  data: Iterable<number>,
  fromBits: number,
  toBits: number,
  pad: boolean,
): number[] {
  let acc = 0
  let bits = 0
  const maxv = (1 << toBits) - 1
  const ret: number[] = []
  for (const value of data) {
    acc = (acc << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      ret.push((acc >> bits) & maxv)
    }
  }
  if (pad) {
    if (bits > 0) ret.push((acc << (toBits - bits)) & maxv)
  } else if (bits >= fromBits || (acc << (toBits - bits)) & maxv) {
    throw new InvalidPaddingError()
  }
  return ret
}

/** Thrown when leftover bits during base32 conversion are non-zero. */
export class InvalidPaddingError extends Errors.BaseError {
  override readonly name = 'Bech32m.InvalidPaddingError'

  constructor() {
    super('Invalid padding in base32 data.')
  }
}

/** @internal */
export declare namespace convertBits {
  type ErrorType = InvalidPaddingError | Errors.GlobalErrorType
}
