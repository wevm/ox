import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'

/**
 * Encodes an integer using Bitcoin's CompactSize variable-length encoding.
 *
 * | Range | Encoding | Bytes |
 * |---|---|---|
 * | 0–252 | Direct value | 1 |
 * | 253–65,535 | `0xFD` + 2 bytes LE | 3 |
 * | 65,536–4,294,967,295 | `0xFE` + 4 bytes LE | 5 |
 * | \> 4,294,967,295 | `0xFF` + 8 bytes LE | 9 |
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * CompactSize.encode(252)
 * // @log: Uint8Array [252]
 *
 * CompactSize.encode(253, { as: 'Hex' })
 * // @log: '0xfdfd00'
 * ```
 *
 * @param value - The integer to encode.
 * @param options - Encoding options.
 * @returns The CompactSize-encoded value.
 */
export function encode<as extends 'Bytes' | 'Hex' = 'Bytes'>(
  value: bigint | number,
  options: encode.Options<as> = {},
): encode.ReturnType<as> {
  const { as = 'Bytes' } = options
  const bytes = encodeToBytes(value)
  if (as === 'Hex') return Hex.fromBytes(bytes) as encode.ReturnType<as>
  return bytes as encode.ReturnType<as>
}

export declare namespace encode {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The format to return the encoded value in. @default 'Bytes' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | InvalidValueError
    | NegativeValueError
    | Errors.GlobalErrorType
}

function encodeToBytes(value: bigint | number): Bytes.Bytes {
  if (typeof value === 'number' && !Number.isSafeInteger(value))
    throw new InvalidValueError({ value })
  const n = BigInt(value)
  if (n < 0n) throw new NegativeValueError({ value: n })
  if (n <= 252n) return new Uint8Array([Number(n)])
  if (n <= 0xffffn) {
    const buf = new Uint8Array(3)
    buf[0] = 0xfd
    const view = new DataView(buf.buffer)
    view.setUint16(1, Number(n), true)
    return buf
  }
  if (n <= 0xffffffffn) {
    const buf = new Uint8Array(5)
    buf[0] = 0xfe
    const view = new DataView(buf.buffer)
    view.setUint32(1, Number(n), true)
    return buf
  }
  const buf = new Uint8Array(9)
  buf[0] = 0xff
  const view = new DataView(buf.buffer)
  view.setBigUint64(1, n, true)
  return buf
}

/**
 * Decodes a CompactSize-encoded value from {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { CompactSize } from 'ox'
 *
 * CompactSize.decode(new Uint8Array([0xfd, 0x00, 0x01]))
 * // @log: { value: 256n, size: 3 }
 *
 * CompactSize.decode('0xfd0001')
 * // @log: { value: 256n, size: 3 }
 * ```
 *
 * @param value - The bytes or hex string to decode from.
 * @returns The decoded value and number of bytes consumed.
 */
export function decode(value: Bytes.Bytes | Hex.Hex): decode.ReturnType {
  const data = value instanceof Uint8Array ? value : Bytes.fromHex(value)
  if (data.length === 0)
    throw new InsufficientBytesError({ expected: 1, actual: 0 })
  const first = data[0]!
  if (first < 0xfd) return { value: BigInt(first), size: 1 }
  const view = new DataView(data.buffer, data.byteOffset)
  if (first === 0xfd) {
    if (data.length < 3)
      throw new InsufficientBytesError({ expected: 3, actual: data.length })
    const result = view.getUint16(1, true)
    if (result < 0xfd) throw new NonMinimalEncodingError()
    return { value: BigInt(result), size: 3 }
  }
  if (first === 0xfe) {
    if (data.length < 5)
      throw new InsufficientBytesError({ expected: 5, actual: data.length })
    const result = view.getUint32(1, true)
    if (result <= 0xffff) throw new NonMinimalEncodingError()
    return { value: BigInt(result), size: 5 }
  }
  if (data.length < 9)
    throw new InsufficientBytesError({ expected: 9, actual: data.length })
  const result = view.getBigUint64(1, true)
  if (result <= 0xffffffffn) throw new NonMinimalEncodingError()
  return {
    value: result,
    size: 9,
  }
}

export declare namespace decode {
  type ReturnType = {
    /** The decoded integer value. */
    value: bigint
    /** The number of bytes consumed. */
    size: number
  }

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | InsufficientBytesError
    | NonMinimalEncodingError
    | Errors.GlobalErrorType
}

/** Thrown when a CompactSize value is negative. */
export class NegativeValueError extends Errors.BaseError {
  override readonly name = 'CompactSize.NegativeValueError'

  constructor({ value }: { value: bigint }) {
    super(`CompactSize value must be non-negative, got ${value}.`)
  }
}

/** Thrown when there are insufficient bytes to decode a CompactSize value. */
export class InsufficientBytesError extends Errors.BaseError {
  override readonly name = 'CompactSize.InsufficientBytesError'

  constructor({ expected, actual }: { expected: number; actual: number }) {
    super(
      `Insufficient bytes for CompactSize decoding. Expected at least ${expected}, got ${actual}.`,
    )
  }
}

/** Thrown when a CompactSize input is not a safe integer. */
export class InvalidValueError extends Errors.BaseError {
  override readonly name = 'CompactSize.InvalidValueError'

  constructor({ value }: { value: number }) {
    super(`CompactSize value \`${value}\` must be a safe integer or a bigint.`)
  }
}

/** Thrown when a CompactSize value is encoded non-minimally. */
export class NonMinimalEncodingError extends Errors.BaseError {
  override readonly name = 'CompactSize.NonMinimalEncodingError'

  constructor() {
    super('CompactSize value is encoded non-minimally.')
  }
}
