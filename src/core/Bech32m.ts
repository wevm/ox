import type * as Errors from './Errors.js'
import { BaseError } from './Errors.js'

/**
 * Encodes data bytes with a human-readable part (HRP) into a bech32m string (BIP-350).
 *
 * @example
 * ```ts twoslash
 * import { Bech32m } from 'ox'
 *
 * const encoded = Bech32m.encode('tempo', new Uint8Array(20))
 * // @log: 'tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm'
 * ```
 *
 * @param hrp - The human-readable part (e.g. `"tempo"`, `"tempoz"`).
 * @param data - The data bytes to encode.
 * @returns The bech32m-encoded string.
 */
export function encode(hrp: string, data: Uint8Array): string {
  const data5 = convertBits(data, 8, 5, true)
  const checksum = createChecksum(hrp, data5)
  let result = hrp + '1'
  for (const d of data5.concat(checksum)) result += alphabet[d]
  return result
}

export declare namespace encode {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Decodes a bech32m string (BIP-350) into a human-readable part and data bytes.
 *
 * @example
 * ```ts twoslash
 * import { Bech32m } from 'ox'
 *
 * const { hrp, data } = Bech32m.decode('tempo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwa7xtm')
 * // @log: { hrp: 'tempo', data: Uint8Array(20) }
 * ```
 *
 * @param str - The bech32m-encoded string to decode.
 * @returns The decoded HRP and data bytes.
 */
export function decode(str: string): decode.ReturnType {
  const lower = str.toLowerCase()
  const pos = lower.lastIndexOf('1')
  if (pos < 1) throw new NoSeparatorError()
  if (pos + 7 > lower.length) throw new InvalidChecksumError()

  const hrp = lower.slice(0, pos)
  const dataChars = lower.slice(pos + 1)

  const data5: number[] = []
  for (const c of dataChars) {
    const v = alphabetMap[c]
    if (v === undefined) throw new InvalidCharacterError({ character: c })
    data5.push(v)
  }

  if (!verifyChecksum(hrp, data5)) throw new InvalidChecksumError()

  const data8 = convertBits(data5.slice(0, -6), 5, 8, false)
  return { hrp, data: new Uint8Array(data8) }
}

export declare namespace decode {
  type ReturnType = {
    /** The human-readable part. */
    hrp: string
    /** The decoded data bytes. */
    data: Uint8Array
  }

  type ErrorType =
    | NoSeparatorError
    | InvalidChecksumError
    | InvalidCharacterError
    | InvalidPaddingError
    | Errors.GlobalErrorType
}

/** Thrown when a bech32m string has no separator. */
export class NoSeparatorError extends BaseError {
  override readonly name = 'Bech32m.NoSeparatorError'
  constructor() {
    super('Bech32m string has no separator.')
  }
}

/** Thrown when a bech32m string has an invalid checksum. */
export class InvalidChecksumError extends BaseError {
  override readonly name = 'Bech32m.InvalidChecksumError'
  constructor() {
    super('Invalid bech32m checksum.')
  }
}

/** Thrown when a bech32m string contains an invalid character. */
export class InvalidCharacterError extends BaseError {
  override readonly name = 'Bech32m.InvalidCharacterError'
  constructor({ character }: { character: string }) {
    super(`Invalid bech32m character: "${character}".`)
  }
}

/** Thrown when the padding bits are invalid during base32 conversion. */
export class InvalidPaddingError extends BaseError {
  override readonly name = 'Bech32m.InvalidPaddingError'
  constructor() {
    super('Invalid padding in bech32m data.')
  }
}

/** @internal */
const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'

/** @internal */
const alphabetMap = /*#__PURE__*/ (() => {
  const map: Record<string, number> = {}
  for (let i = 0; i < alphabet.length; i++) map[alphabet[i]!] = i
  return map
})()

/** @internal */
const BECH32M_CONST = 0x2bc830a3

/** @internal */
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

/** @internal */
function polymod(values: number[]): number {
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) if ((b >> i) & 1) chk ^= GEN[i]!
  }
  return chk
}

/** @internal */
function hrpExpand(hrp: string): number[] {
  const ret: number[] = []
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) >> 5)
  ret.push(0)
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.charCodeAt(i) & 31)
  return ret
}

/** @internal */
function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])
  const mod = polymod(values) ^ BECH32M_CONST
  const ret: number[] = []
  for (let i = 0; i < 6; i++) ret.push((mod >> (5 * (5 - i))) & 31)
  return ret
}

/** @internal */
function verifyChecksum(hrp: string, data: number[]): boolean {
  return polymod(hrpExpand(hrp).concat(data)) === BECH32M_CONST
}

/** @internal */
function convertBits(
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
