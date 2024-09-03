import { Bytes_fromHex } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import { BaseError } from '../Errors/base.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { type Cursor, createCursor } from '../cursor.js'
import type { RecursiveArray } from '../types.js'

type Encodable = {
  length: number
  encode(cursor: Cursor): void
}

/**
 * Encodes a {@link Bytes#Bytes} or {@link Hex#Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Rlp } from 'ox'
 *
 * Rlp.from('0x68656c6c6f20776f726c64', 'Hex')
 * // @log: 0x8b68656c6c6f20776f726c64
 *
 * Rlp.from(Bytes.from([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100]), 'Bytes')
 * // @log: Uint8Array([104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param value - The {@link Bytes#Bytes} or {@link Hex#Hex} value to encode.
 * @param to - The type to convert the RLP value to.
 * @returns The RLP value.
 */
export function Rlp_from<
  value extends RecursiveArray<Bytes> | RecursiveArray<Hex>,
  to extends 'Hex' | 'Bytes',
>(value: value, to: to | 'Hex' | 'Bytes'): Rlp_from.ReturnType<to> {
  const encodable = getEncodable(value)
  const cursor = createCursor(new Uint8Array(encodable.length))
  encodable.encode(cursor)

  if (to === 'Hex')
    return Hex_fromBytes(cursor.bytes) as Rlp_from.ReturnType<to>
  return cursor.bytes as Rlp_from.ReturnType<to>
}

export declare namespace Rlp_from {
  type ReturnType<to extends 'Hex' | 'Bytes'> =
    | (to extends 'Bytes' ? Bytes : never)
    | (to extends 'Hex' ? Hex : never)

  type ErrorType =
    | createCursor.ErrorType
    | Hex_fromBytes.ErrorType
    | Bytes_fromHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Rlp_from.parseError = (error: unknown) => error as Rlp_from.ErrorType

/**
 * Encodes a {@link Bytes#Bytes} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Rlp } from 'ox'
 *
 * Rlp.fromBytes(Bytes.from([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100]))
 * // @log: Uint8Array([104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param bytes - The {@link Bytes#Bytes} value to encode.
 * @param to - The type to convert the RLP value to.
 * @returns The RLP value.
 */
export function Rlp_fromBytes<to extends 'Hex' | 'Bytes' = 'Bytes'>(
  bytes: RecursiveArray<Bytes>,
  to: to | 'Hex' | 'Bytes' | undefined = 'Bytes',
): Rlp_fromBytes.ReturnType<to> {
  return Rlp_from(bytes, to)
}

export declare namespace Rlp_fromBytes {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Bytes'> =
    Rlp_from.ReturnType<to>
  type ErrorType = Rlp_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Rlp_fromBytes.parseError = (error: unknown) => error as Rlp_fromBytes.ErrorType

/**
 * Encodes a {@link Hex#Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 *
 * Rlp.fromHex('0x68656c6c6f20776f726c64')
 * // @log: 0x8b68656c6c6f20776f726c64
 * ```
 *
 * @param hex - The {@link Hex#Hex} value to encode.
 * @param to - The type to convert the RLP value to.
 * @returns The RLP value.
 */
export function Rlp_fromHex<to extends 'Hex' | 'Bytes' = 'Hex'>(
  hex: RecursiveArray<Hex>,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
): Rlp_fromHex.ReturnType<to> {
  return Rlp_from(hex, to)
}

export declare namespace Rlp_fromHex {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> = Rlp_from.ReturnType<to>
  type ErrorType = Rlp_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Rlp_fromHex.parseError = (error: unknown) => error as Rlp_fromHex.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

function getEncodable(
  bytes: RecursiveArray<Bytes> | RecursiveArray<Hex>,
): Encodable {
  if (Array.isArray(bytes))
    return getEncodableList(bytes.map((x) => getEncodable(x)))
  return getEncodableBytes(bytes as any)
}

function getEncodableList(list: Encodable[]): Encodable {
  const bodyLength = list.reduce((acc, x) => acc + x.length, 0)

  const sizeOfBodyLength = getSizeOfLength(bodyLength)
  const length = (() => {
    if (bodyLength <= 55) return 1 + bodyLength
    return 1 + sizeOfBodyLength + bodyLength
  })()

  return {
    length,
    encode(cursor: Cursor) {
      if (bodyLength <= 55) {
        cursor.pushByte(0xc0 + bodyLength)
      } else {
        cursor.pushByte(0xc0 + 55 + sizeOfBodyLength)
        if (sizeOfBodyLength === 1) cursor.pushUint8(bodyLength)
        else if (sizeOfBodyLength === 2) cursor.pushUint16(bodyLength)
        else if (sizeOfBodyLength === 3) cursor.pushUint24(bodyLength)
        else cursor.pushUint32(bodyLength)
      }
      for (const { encode } of list) {
        encode(cursor)
      }
    },
  }
}

function getEncodableBytes(bytesOrHex: Bytes | Hex): Encodable {
  const bytes =
    typeof bytesOrHex === 'string' ? Bytes_fromHex(bytesOrHex) : bytesOrHex

  const sizeOfBytesLength = getSizeOfLength(bytes.length)
  const length = (() => {
    if (bytes.length === 1 && bytes[0]! < 0x80) return 1
    if (bytes.length <= 55) return 1 + bytes.length
    return 1 + sizeOfBytesLength + bytes.length
  })()

  return {
    length,
    encode(cursor: Cursor) {
      if (bytes.length === 1 && bytes[0]! < 0x80) {
        cursor.pushBytes(bytes)
      } else if (bytes.length <= 55) {
        cursor.pushByte(0x80 + bytes.length)
        cursor.pushBytes(bytes)
      } else {
        cursor.pushByte(0x80 + 55 + sizeOfBytesLength)
        if (sizeOfBytesLength === 1) cursor.pushUint8(bytes.length)
        else if (sizeOfBytesLength === 2) cursor.pushUint16(bytes.length)
        else if (sizeOfBytesLength === 3) cursor.pushUint24(bytes.length)
        else cursor.pushUint32(bytes.length)
        cursor.pushBytes(bytes)
      }
    },
  }
}

function getSizeOfLength(length: number) {
  if (length < 2 ** 8) return 1
  if (length < 2 ** 16) return 2
  if (length < 2 ** 24) return 3
  if (length < 2 ** 32) return 4
  throw new BaseError('Length is too large.')
}
