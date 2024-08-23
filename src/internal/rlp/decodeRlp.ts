import { hexToBytes } from '../bytes/toBytes.js'
import { type Cursor, createCursor } from '../cursor.js'
import { BaseError } from '../errors/base.js'
import { InvalidHexLengthError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import type { RecursiveArray } from './encodeRlp.js'

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Types#Bytes} or {@link Types#Hex} value.
 *
 * - Docs: https://oxlib.sh/api/rlp/decode
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 * Rlp.decode('0x8b68656c6c6f20776f726c64')
 * // 0x68656c6c6f20776f726c64
 * ```
 */
export function decodeRlp<
  value extends Bytes | Hex,
  to extends 'Hex' | 'Bytes' = value extends Bytes ? 'Bytes' : 'Hex',
>(
  value: value,
  to_?: to | 'Hex' | 'Bytes' | undefined,
): decodeRlp.ReturnType<to> {
  const to = to_ ?? (typeof value === 'string' ? 'Hex' : 'Bytes')

  const bytes = (() => {
    if (typeof value === 'string') {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new InvalidHexLengthError(value)
      return hexToBytes(value)
    }
    return value as Bytes
  })()

  const cursor = createCursor(bytes, {
    recursiveReadLimit: Number.POSITIVE_INFINITY,
  })
  const result = decodeRlpCursor(cursor, to)

  return result as decodeRlp.ReturnType<to>
}

export declare namespace decodeRlp {
  type ReturnType<to extends 'Hex' | 'Bytes'> =
    | (to extends 'Bytes' ? RecursiveArray<Bytes> : never)
    | (to extends 'Hex' ? RecursiveArray<Hex> : never)

  type ErrorType =
    | hexToBytes.ErrorType
    | decodeRlpCursor.ErrorType
    | createCursor.ErrorType
    | InvalidHexLengthError
    | GlobalErrorType
}

/* v8 ignore next */
decodeRlp.parseError = (error: unknown) => error as decodeRlp.ErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Types#Bytes} value.
 *
 * - Docs: https://oxlib.sh/api/rlp/toBytes
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 * Rlp.toBytes('0x8b68656c6c6f20776f726c64')
 * // Uint8Array([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 */
export function rlpToBytes(value: Bytes | Hex): rlpToBytes.ReturnType {
  return decodeRlp(value, 'Bytes')
}

export declare namespace rlpToBytes {
  type ErrorType = decodeRlp.ErrorType
  type ReturnType = decodeRlp.ReturnType<'Bytes'>
}

/* v8 ignore next */
rlpToBytes.parseError = (error: unknown) => error as rlpToBytes.ErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Types#Hex} value.
 *
 * - Docs: https://oxlib.sh/api/rlp/toHex
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 * Rlp.toHex('0x8b68656c6c6f20776f726c64')
 * // 0x68656c6c6f20776f726c64
 * ```
 */
export function rlpToHex(value: Bytes | Hex): rlpToHex.ReturnType {
  return decodeRlp(value, 'Hex')
}

export declare namespace rlpToHex {
  type ErrorType = decodeRlp.ErrorType
  type ReturnType = decodeRlp.ReturnType<'Hex'>
}

/* v8 ignore next */
rlpToHex.parseError = (error: unknown) => error as rlpToHex.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function decodeRlpCursor<to extends 'Hex' | 'Bytes' = 'Hex'>(
  cursor: Cursor,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
): decodeRlpCursor.ReturnType<to> {
  if (cursor.bytes.length === 0)
    return (
      to === 'Hex' ? bytesToHex(cursor.bytes) : cursor.bytes
    ) as decodeRlpCursor.ReturnType<to>

  const prefix = cursor.readByte()
  if (prefix < 0x80) cursor.decrementPosition(1)

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    const bytes = cursor.readBytes(length)
    return (
      to === 'Hex' ? bytesToHex(bytes) : bytes
    ) as decodeRlpCursor.ReturnType<to>
  }

  // list
  const length = readLength(cursor, prefix, 0xc0)
  return readList(cursor, length, to) as {} as decodeRlpCursor.ReturnType<to>
}

/** @internal */
export declare namespace decodeRlpCursor {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> = decodeRlp.ReturnType<to>
  type ErrorType =
    | bytesToHex.ErrorType
    | readLength.ErrorType
    | readList.ErrorType
    | GlobalErrorType
}

/** @internal */
export function readLength(cursor: Cursor, prefix: number, offset: number) {
  if (offset === 0x80 && prefix < 0x80) return 1
  if (prefix <= offset + 55) return prefix - offset
  if (prefix === offset + 55 + 1) return cursor.readUint8()
  if (prefix === offset + 55 + 2) return cursor.readUint16()
  if (prefix === offset + 55 + 3) return cursor.readUint24()
  if (prefix === offset + 55 + 4) return cursor.readUint32()
  throw new BaseError('Invalid RLP prefix')
}

/** @internal */
export declare namespace readLength {
  type ErrorType = BaseError | GlobalErrorType
}

/** @internal */
export function readList<to extends 'Hex' | 'Bytes'>(
  cursor: Cursor,
  length: number,
  to: to | 'Hex' | 'Bytes',
) {
  const position = cursor.position
  const value: decodeRlpCursor.ReturnType<to>[] = []
  while (cursor.position - position < length)
    value.push(decodeRlpCursor(cursor, to))
  return value
}

/** @internal */
export declare namespace readList {
  type ErrorType = GlobalErrorType
}
