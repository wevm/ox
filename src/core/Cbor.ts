import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Cursor from './internal/cursor.js'

/**
 * Encodes a value into CBOR (Concise Binary Object Representation) format.
 *
 * @example
 * ```ts twoslash
 * import { Cbor } from 'ox'
 *
 * Cbor.encode([1, 2, 3])
 * // @log: '0x83010203'
 *
 * Cbor.encode({ foo: 'bar', baz: [1, 2, 3] })
 * // @log: '0xa263666f6f636261726362617a83010203'
 *
 * Cbor.encode('hello', { as: 'Bytes' })
 * // @log: Uint8Array(6) [ 101, 104, 101, 108, 108, 111 ]
 * ```
 *
 * @param data - The value to encode.
 * @param options - Encoding options.
 * @returns The CBOR-encoded value.
 */
export function encode<as extends 'Hex' | 'Bytes' = 'Hex'>(
  data: unknown,
  options: encode.Options<as> = {},
): encode.ReturnType<as> {
  const { as = 'Hex' } = options

  const encodable = getEncodable(data)
  const cursor = Cursor.create(new Uint8Array(encodable.length))
  encodable.encode(cursor)

  if (as === 'Hex') return Hex.fromBytes(cursor.bytes) as encode.ReturnType<as>
  return cursor.bytes as encode.ReturnType<as>
}

export declare namespace encode {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** The format to return the encoded value in. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Bytes' ? Bytes.Bytes : never)

  type ErrorType =
    | Cursor.create.ErrorType
    | Hex.fromBytes.ErrorType
    | UnsupportedBigIntError
    | UnexpectedTokenError
    | NumberTooLargeError
    | StringTooLargeError
    | ByteStringTooLargeError
    | ArrayTooLargeError
    | ObjectTooLargeError
    | Errors.GlobalErrorType
}

/**
 * Decodes CBOR (Concise Binary Object Representation) data into a JavaScript value.
 *
 * @example
 * ```ts twoslash
 * import { Cbor } from 'ox'
 *
 * Cbor.decode('0x83010203')
 * // @log: [1, 2, 3]
 *
 * Cbor.decode('0xa263666f6f636261726362617a83010203')
 * // @log: { foo: 'bar', baz: [1, 2, 3] }
 *
 * Cbor.decode(new Uint8Array([101, 104, 101, 108, 108, 111]))
 * // @log: 'hello'
 * ```
 *
 * @param data - The CBOR-encoded data to decode.
 * @param options - Decoding options.
 * @returns The decoded value.
 */
export function decode<type = unknown>(data: Hex.Hex | Bytes.Bytes): type {
  const bytes = (() => {
    if (typeof data === 'string') {
      if (data.length > 3 && data.length % 2 !== 0)
        throw new Hex.InvalidLengthError(data)
      return Bytes.fromHex(data)
    }
    return data
  })()

  const cursor = Cursor.create(bytes)

  return decodeCursor(cursor) as type
}

export declare namespace decode {
  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Cursor.create.ErrorType
    | Hex.InvalidLengthError
    | decodeCursor.ErrorType
    | Errors.GlobalErrorType
}

export class InvalidMajorTypeError extends Errors.BaseError {
  override readonly name = 'Cbor.InvalidMajorTypeError'

  constructor({ majorType }: { majorType: number }) {
    super(`Invalid CBOR major type: ${majorType}`)
  }
}

export class InvalidAdditionalInfoError extends Errors.BaseError {
  override readonly name = 'Cbor.InvalidAdditionalInfoError'

  constructor({ additionalInfo }: { additionalInfo: number }) {
    super(`Invalid CBOR additional info: ${additionalInfo}`)
  }
}

export class Unsupported64BitIntegerError extends Errors.BaseError {
  override readonly name = 'Cbor.Unsupported64BitIntegerError'

  constructor() {
    super('64-bit integers are not supported in CBOR decoding.')
  }
}

export class UnsupportedTagError extends Errors.BaseError {
  override readonly name = 'Cbor.UnsupportedTagError'

  constructor({ tag }: { tag: number }) {
    super(`CBOR tagged data (tag ${tag}) is not yet supported.`)
  }
}

export class InvalidIndefiniteLengthChunkError extends Errors.BaseError {
  override readonly name = 'Cbor.InvalidIndefiniteLengthChunkError'

  constructor({ type }: { type: string }) {
    super(`Invalid chunk type in indefinite-length ${type}`)
  }
}

export class InvalidSimpleValueError extends Errors.BaseError {
  override readonly name = 'Cbor.InvalidSimpleValueError'

  constructor({ value }: { value: number }) {
    super(`Invalid CBOR simple value: ${value}`)
  }
}

export class UnsupportedBigIntError extends Errors.BaseError {
  override readonly name = 'Cbor.UnsupportedBigIntError'

  constructor() {
    super('BigInt values are not supported in CBOR encoding.')
  }
}

export class UnexpectedTokenError extends Errors.BaseError {
  override readonly name = 'Cbor.UnexpectedTokenError'

  constructor({ token }: { token: string }) {
    super(`Unexpected token: ${token}`)
  }
}

export class NumberTooLargeError extends Errors.BaseError {
  override readonly name = 'Cbor.NumberTooLargeError'

  constructor({ number }: { number: string }) {
    super(
      `Number exceeds maximum safe integer (${Number.MAX_SAFE_INTEGER}): ${number}`,
    )
  }
}

export class StringTooLargeError extends Errors.BaseError {
  override readonly name = 'Cbor.StringTooLargeError'

  constructor({ size }: { size: number }) {
    super(`String length exceeds maximum (4294967295): ${size}`)
  }
}

export class ArrayTooLargeError extends Errors.BaseError {
  override readonly name = 'Cbor.ArrayTooLargeError'

  constructor({ size }: { size: number }) {
    super(`Array length exceeds maximum (4294967295): ${size}`)
  }
}

export class ObjectTooLargeError extends Errors.BaseError {
  override readonly name = 'Cbor.ObjectTooLargeError'

  constructor({ size }: { size: number }) {
    super(`Object size exceeds maximum (4294967295): ${size}`)
  }
}

export class ByteStringTooLargeError extends Errors.BaseError {
  override readonly name = 'Cbor.ByteStringTooLargeError'

  constructor({ size }: { size: number }) {
    super(`Byte string length exceeds maximum (4294967295): ${size}`)
  }
}

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

type Encodable = {
  length: number
  encode(cursor: Cursor.Cursor): void
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function getEncodable(value: unknown): Encodable {
  if (typeof value === 'undefined')
    return { length: 1, encode: (cursor) => cursor.pushUint8(0xf7) }

  if (value === null)
    return { length: 1, encode: (cursor) => cursor.pushUint8(0xf6) }

  if (typeof value === 'boolean')
    return {
      length: 1,
      encode: (cursor) => cursor.pushUint8(value ? 0xf5 : 0xf4),
    }

  if (typeof value === 'number') return getEncodable.number(value as number)

  if (typeof value === 'bigint') throw new UnsupportedBigIntError()

  if (typeof value === 'string') return getEncodable.string(value as string)

  if (Array.isArray(value)) return getEncodable.array(value)

  if (value instanceof Uint8Array) return getEncodable.byteString(value)

  if (value instanceof ArrayBuffer)
    return getEncodable.byteString(new Uint8Array(value))

  if (ArrayBuffer.isView(value))
    return getEncodable.byteString(
      new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
    )

  if (typeof value === 'object')
    return getEncodable.object(value as Record<string, unknown>)

  throw new UnexpectedTokenError({ token: String(value) })
}

/** @internal */
namespace getEncodable {
  /** @internal */
  export function number(value: number): Encodable {
    // Handle non-safe integers (floats, NaN, Infinity)
    if (!Number.isSafeInteger(value)) {
      // Use Float32 if the value can be represented without precision loss
      // This creates smaller encodings when possible (5 bytes vs 9 bytes)
      const float32 = Math.fround(value)
      if (Number.isNaN(value) || value === float32)
        return {
          length: 5, // 1 byte prefix + 4 bytes float32
          encode(cursor) {
            cursor.pushUint8(0xfa)
            cursor.dataView.setFloat32(cursor.position, value, false)
            cursor.position += 4
          },
        }
      return {
        length: 9, // 1 byte prefix + 8 bytes float64
        encode(cursor) {
          cursor.pushUint8(0xfb)
          cursor.dataView.setFloat64(cursor.position, value, false)
          cursor.position += 8
        },
      }
    }

    // Handle positive integers
    if (value >= 0) {
      if (value <= 0x17)
        return { length: 1, encode: (cursor) => cursor.pushUint8(value) }
      if (value <= 0xff)
        return {
          length: 2, // 1 byte prefix + 1 byte uint8
          encode: (cursor) => {
            cursor.pushUint8(0x18)
            cursor.pushUint8(value)
          },
        }
      if (value <= 0xffff)
        return {
          length: 3, // 1 byte prefix + 2 bytes uint16
          encode: (cursor) => {
            cursor.pushUint8(0x19)
            cursor.pushUint16(value)
          },
        }
      if (value <= 0xffffffff)
        return {
          length: 5, // 1 byte prefix + 4 bytes uint32
          encode: (cursor) => {
            cursor.pushUint8(0x1a)
            cursor.pushUint32(value)
          },
        }
      throw new NumberTooLargeError({ number: value.toString(10) })
    }

    // Handle negative integers
    // CBOR encodes -n as (n-1)
    const positiveNumber = -1 - value

    if (value >= -24)
      return {
        length: 1,
        encode: (cursor) => cursor.pushUint8(0x20 + positiveNumber),
      }
    if (positiveNumber <= 0xff)
      return {
        length: 2, // 1 byte prefix + 1 byte uint8
        encode: (cursor) => {
          cursor.pushUint8(0x38)
          cursor.pushUint8(positiveNumber)
        },
      }
    if (positiveNumber <= 0xffff)
      return {
        length: 3, // 1 byte prefix + 2 bytes uint16
        encode: (cursor) => {
          cursor.pushUint8(0x39)
          cursor.pushUint16(positiveNumber)
        },
      }
    if (positiveNumber <= 0xffffffff)
      return {
        length: 5, // 1 byte prefix + 4 bytes uint32
        encode: (cursor) => {
          cursor.pushUint8(0x3a)
          cursor.pushUint32(positiveNumber)
        },
      }
    throw new NumberTooLargeError({ number: value.toString(10) })
  }

  /** @internal */
  export function string(value: string): Encodable {
    const encoded = Bytes.fromString(value)
    const size = encoded.length

    if (size <= 0x17)
      return {
        length: 1 + size, // 1 byte prefix + size bytes
        encode(cursor) {
          cursor.pushUint8(0x60 + size)
          if (size > 0) cursor.pushBytes(encoded)
        },
      }
    if (size <= 0xff)
      return {
        length: 2 + size, // 1 byte prefix + 1 byte uint8 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x78)
          cursor.pushUint8(size)
          cursor.pushBytes(encoded)
        },
      }

    if (size <= 0xffff)
      return {
        length: 3 + size, // 1 byte prefix + 2 bytes uint16 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x79)
          cursor.pushUint16(size)
          cursor.pushBytes(encoded)
        },
      }

    if (size <= 0xffffffff)
      return {
        length: 5 + size, // 1 byte prefix + 4 bytes uint32 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x7a)
          cursor.pushUint32(size)
          cursor.pushBytes(encoded)
        },
      }

    throw new StringTooLargeError({ size })
  }

  /** @internal */
  export function array(value: unknown[]): Encodable {
    const items = value.map((item) => getEncodable(item))
    const bodyLength = items.reduce((acc, item) => acc + item.length, 0)
    const size = value.length

    if (size <= 0x17)
      return {
        length: 1 + bodyLength, // 1 byte prefix + body length
        encode(cursor) {
          cursor.pushUint8(0x80 + size)
          for (const item of items) item.encode(cursor)
        },
      }
    if (size <= 0xff)
      return {
        length: 2 + bodyLength, // 1 byte prefix + 1 byte uint8 + body length
        encode(cursor) {
          cursor.pushUint8(0x98)
          cursor.pushUint8(size)
          for (const item of items) item.encode(cursor)
        },
      }
    if (size <= 0xffff)
      return {
        length: 3 + bodyLength, // 1 byte prefix + 2 bytes uint16 + body length
        encode(cursor) {
          cursor.pushUint8(0x99)
          cursor.pushUint16(size)
          for (const item of items) item.encode(cursor)
        },
      }
    if (size <= 0xffffffff)
      return {
        length: 5 + bodyLength, // 1 byte prefix + 4 bytes uint32 + body length
        encode(cursor) {
          cursor.pushUint8(0x9a)
          cursor.pushUint32(size)
          for (const item of items) item.encode(cursor)
        },
      }
    throw new ArrayTooLargeError({ size })
  }

  /** @internal */
  export function byteString(value: Uint8Array): Encodable {
    const size = value.byteLength

    if (size <= 0x17)
      return {
        length: 1 + size, // 1 byte prefix + size bytes
        encode(cursor) {
          cursor.pushUint8(0x40 + size)
          cursor.pushBytes(value)
        },
      }
    if (size <= 0xff)
      return {
        length: 2 + size, // 1 byte prefix + 1 byte uint8 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x58)
          cursor.pushUint8(size)
          cursor.pushBytes(value)
        },
      }
    if (size <= 0xffff)
      return {
        length: 3 + size, // 1 byte prefix + 2 bytes uint16 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x59)
          cursor.pushUint16(size)
          cursor.pushBytes(value)
        },
      }
    if (size <= 0xffffffff)
      return {
        length: 5 + size, // 1 byte prefix + 4 bytes uint32 + size bytes
        encode(cursor) {
          cursor.pushUint8(0x5a)
          cursor.pushUint32(size)
          cursor.pushBytes(value)
        },
      }
    throw new ByteStringTooLargeError({ size })
  }

  /** @internal */
  export function object(value: Record<string, unknown>): Encodable {
    const keys = Object.keys(value)
    const entries = keys.map((key) => ({
      key: getEncodable(key),
      value: getEncodable(value[key]),
    }))
    const bodyLength = entries.reduce(
      (acc, entry) => acc + entry.key.length + entry.value.length,
      0,
    )
    const size = keys.length

    if (size <= 0x17)
      return {
        length: 1 + bodyLength, // 1 byte prefix + body length
        encode(cursor) {
          cursor.pushUint8(0xa0 + size)
          for (const entry of entries) {
            entry.key.encode(cursor)
            entry.value.encode(cursor)
          }
        },
      }
    if (size <= 0xff)
      return {
        length: 2 + bodyLength, // 1 byte prefix + 1 byte uint8 + body length
        encode(cursor) {
          cursor.pushUint8(0xb8)
          cursor.pushUint8(size)
          for (const entry of entries) {
            entry.key.encode(cursor)
            entry.value.encode(cursor)
          }
        },
      }
    if (size <= 0xffff)
      return {
        length: 3 + bodyLength, // 1 byte prefix + 2 bytes uint16 + body length
        encode(cursor) {
          cursor.pushUint8(0xb9)
          cursor.pushUint16(size)
          for (const entry of entries) {
            entry.key.encode(cursor)
            entry.value.encode(cursor)
          }
        },
      }
    if (size <= 0xffffffff)
      return {
        length: 5 + bodyLength, // 1 byte prefix + 4 bytes uint32 + body length
        encode(cursor) {
          cursor.pushUint8(0xba)
          cursor.pushUint32(size)
          for (const entry of entries) {
            entry.key.encode(cursor)
            entry.value.encode(cursor)
          }
        },
      }
    throw new ObjectTooLargeError({ size })
  }
}

/** @internal */
// biome-ignore lint/correctness/noUnusedVariables: _
function decodeCursor(cursor: Cursor.Cursor): unknown {
  const initialByte = cursor.readUint8()
  const majorType = initialByte >> 5
  const additionalInfo = initialByte & 0b00011111

  switch (majorType) {
    // Major type 0: Unsigned integer
    case 0:
      return decodeCursor.readUnsignedInteger(cursor, additionalInfo)

    // Major type 1: Negative integer
    case 1:
      return decodeCursor.readNegativeInteger(cursor, additionalInfo)

    // Major type 2: Byte string
    case 2:
      return decodeCursor.readByteString(cursor, additionalInfo)

    // Major type 3: Text string
    case 3:
      return decodeCursor.readTextString(cursor, additionalInfo)

    // Major type 4: Array
    case 4:
      return decodeCursor.readArray(cursor, additionalInfo)

    // Major type 5: Map
    case 5:
      return decodeCursor.readMap(cursor, additionalInfo)

    // Major type 6: Tagged data (not yet supported)
    case 6:
      throw new UnsupportedTagError({ tag: additionalInfo })

    // Major type 7: Simple values and floats
    case 7:
      return decodeCursor.readSimpleOrFloat(cursor, additionalInfo)

    default:
      throw new InvalidMajorTypeError({ majorType })
  }
}

/** @internal */
namespace decodeCursor {
  export type ErrorType =
    | readUnsignedInteger.ErrorType
    | readNegativeInteger.ErrorType
    | readByteString.ErrorType
    | readTextString.ErrorType
    | readArray.ErrorType
    | readMap.ErrorType
    | readSimpleOrFloat.ErrorType
    | UnsupportedTagError
    | InvalidMajorTypeError
    | Errors.GlobalErrorType

  /** @internal */
  // biome-ignore lint/correctness/noUnusedVariables: _
  function readLength(cursor: Cursor.Cursor, additionalInfo: number): number {
    if (additionalInfo < 24) return additionalInfo
    if (additionalInfo === 24) return cursor.readUint8()
    if (additionalInfo === 25) return cursor.readUint16()
    if (additionalInfo === 26) return cursor.readUint32()
    if (additionalInfo === 27) throw new Unsupported64BitIntegerError()
    throw new InvalidAdditionalInfoError({ additionalInfo })
  }

  /** @internal */
  export declare namespace readLength {
    type ErrorType =
      | Unsupported64BitIntegerError
      | InvalidAdditionalInfoError
      | Errors.GlobalErrorType
  }

  /** @internal */
  export function readUnsignedInteger(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): number {
    return readLength(cursor, additionalInfo)
  }

  /** @internal */
  export declare namespace readUnsignedInteger {
    type ErrorType = readLength.ErrorType | Errors.GlobalErrorType
  }

  /** @internal */
  export function readNegativeInteger(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): number {
    const value = readLength(cursor, additionalInfo)
    return -1 - value
  }

  /** @internal */
  export declare namespace readNegativeInteger {
    type ErrorType = readLength.ErrorType | Errors.GlobalErrorType
  }

  /** @internal */
  export function readByteString(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): Bytes.Bytes {
    // Indefinite-length byte string
    if (additionalInfo === 31) {
      const chunks: Bytes.Bytes[] = []
      let totalLength = 0

      while (true) {
        const byte = cursor.inspectUint8()
        if (byte === 0xff) {
          cursor.readUint8() // consume the break byte
          break
        }
        const chunk = decodeCursor(cursor) as Bytes.Bytes
        if (!(chunk instanceof Uint8Array))
          throw new InvalidIndefiniteLengthChunkError({ type: 'byte string' })
        chunks.push(chunk)
        totalLength += chunk.length
      }

      // Concatenate chunks
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      return result
    }

    const length = readLength(cursor, additionalInfo)
    return cursor.readBytes(length)
  }

  /** @internal */
  export declare namespace readByteString {
    type ErrorType =
      | readLength.ErrorType
      | InvalidIndefiniteLengthChunkError
      | Errors.GlobalErrorType
  }

  /** @internal */
  export function readTextString(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): string {
    // Indefinite-length text string
    if (additionalInfo === 31) {
      const chunks: string[] = []

      while (true) {
        const byte = cursor.inspectUint8()
        if (byte === 0xff) {
          cursor.readUint8() // consume the break byte
          break
        }
        const chunk = decodeCursor(cursor)
        if (typeof chunk !== 'string')
          throw new InvalidIndefiniteLengthChunkError({ type: 'text string' })
        chunks.push(chunk)
      }

      return chunks.join('')
    }

    const length = readLength(cursor, additionalInfo)
    const bytes = cursor.readBytes(length)
    return Bytes.toString(bytes)
  }

  /** @internal */
  export declare namespace readTextString {
    type ErrorType =
      | readLength.ErrorType
      | Bytes.toString.ErrorType
      | InvalidIndefiniteLengthChunkError
      | Errors.GlobalErrorType
  }

  /** @internal */
  export function readArray(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): unknown[] {
    // Indefinite-length array
    if (additionalInfo === 31) {
      const result: unknown[] = []

      while (true) {
        const byte = cursor.inspectUint8()
        if (byte === 0xff) {
          cursor.readUint8() // consume the break byte
          break
        }
        result.push(decodeCursor(cursor))
      }

      return result
    }

    const length = readLength(cursor, additionalInfo)
    const result: unknown[] = []

    for (let i = 0; i < length; i++) {
      result.push(decodeCursor(cursor))
    }

    return result
  }

  /** @internal */
  export declare namespace readArray {
    type ErrorType = readLength.ErrorType | Errors.GlobalErrorType
  }

  /** @internal */
  export function readMap(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): Record<string, unknown> {
    // Indefinite-length map
    if (additionalInfo === 31) {
      const result: Record<string, unknown> = {}

      while (true) {
        const byte = cursor.inspectUint8()
        if (byte === 0xff) {
          cursor.readUint8() // consume the break byte
          break
        }
        const key = decodeCursor(cursor)
        // Support both string and number keys (for COSE_Key with integer keys)
        const keyStr =
          typeof key === 'string'
            ? key
            : typeof key === 'number'
              ? String(key)
              : String(key)
        const value = decodeCursor(cursor)
        result[keyStr] = value
      }

      return result
    }

    const length = readLength(cursor, additionalInfo)
    const result: Record<string, unknown> = {}

    for (let i = 0; i < length; i++) {
      const key = decodeCursor(cursor)
      // Support both string and number keys (for COSE_Key with integer keys)
      const keyStr =
        typeof key === 'string'
          ? key
          : typeof key === 'number'
            ? String(key)
            : String(key)
      const value = decodeCursor(cursor)
      result[keyStr] = value
    }

    return result
  }

  /** @internal */
  export declare namespace readMap {
    type ErrorType = readLength.ErrorType | Errors.GlobalErrorType
  }

  /** @internal */
  export function readSimpleOrFloat(
    cursor: Cursor.Cursor,
    additionalInfo: number,
  ): unknown {
    // Simple values
    if (additionalInfo === 20) return false
    if (additionalInfo === 21) return true
    if (additionalInfo === 22) return null
    if (additionalInfo === 23) return undefined

    // Float16 (half-precision)
    if (additionalInfo === 25) {
      const bits = cursor.readUint16()
      return getFloat16(bits)
    }

    // Float32
    if (additionalInfo === 26) {
      const value = cursor.dataView.getFloat32(cursor.position, false)
      cursor.position += 4
      return value
    }

    // Float64
    if (additionalInfo === 27) {
      const value = cursor.dataView.getFloat64(cursor.position, false)
      cursor.position += 8
      return value
    }

    // Simple value (additional byte)
    if (additionalInfo === 24) {
      const simpleValue = cursor.readUint8()
      // Simple values 0-19 are assigned, 20-23 are in the initial byte
      // 24-31 are reserved, 32-255 are unassigned
      if (simpleValue < 32)
        throw new InvalidSimpleValueError({ value: simpleValue })
      // For now, treat unassigned simple values as undefined
      return undefined
    }

    throw new InvalidAdditionalInfoError({ additionalInfo })
  }

  /** @internal */
  export declare namespace readSimpleOrFloat {
    type ErrorType =
      | InvalidSimpleValueError
      | InvalidAdditionalInfoError
      | Errors.GlobalErrorType
  }

  /** @internal */
  function getFloat16(bits: number): number {
    // IEEE 754 half-precision (16-bit) float decoding
    // Format: 1 sign bit, 5 exponent bits, 10 fraction bits
    const sign = (bits >> 15) & 0x1
    const exponent = (bits >> 10) & 0x1f
    const fraction = bits & 0x3ff

    // Handle special cases
    if (exponent === 0) {
      // Subnormal numbers or zero
      if (fraction === 0) return sign ? -0 : 0
      // Subnormal: (-1)^sign × 2^(-14) × (0 + fraction/1024)
      const value = 2 ** -14 * (fraction / 1024)
      return sign ? -value : value
    }

    if (exponent === 0x1f) {
      // Infinity or NaN
      if (fraction === 0) return sign ? -Infinity : Infinity
      return NaN
    }

    // Normal numbers: (-1)^sign × 2^(exponent-15) × (1 + fraction/1024)
    const value = 2 ** (exponent - 15) * (1 + fraction / 1024)
    return sign ? -value : value
  }
}
