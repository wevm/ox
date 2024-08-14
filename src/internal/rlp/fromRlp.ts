import { type HexToBytesErrorType, hexToBytes } from '../bytes/toBytes.js'
import { BaseError, type BaseErrorType } from '../errors/base.js'
import {
  InvalidHexValueError,
  type InvalidHexValueErrorType,
} from '../errors/data.js'
import type { ErrorType } from '../errors/error.js'
import { type BytesToHexErrorType, bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'
import {
  type CreateCursorErrorType,
  type Cursor,
  createCursor,
} from '../utils/cursor.js'
import type { RecursiveArray } from './toRlp.js'

type To = 'hex' | 'bytes'

export type FromRlpReturnType<to extends To> =
  | (to extends 'bytes' ? RecursiveArray<Bytes> : never)
  | (to extends 'hex' ? RecursiveArray<Hex> : never)

export type FromRlpErrorType =
  | CreateCursorErrorType
  | FromRlpCursorErrorType
  | HexToBytesErrorType
  | InvalidHexValueErrorType
  | ErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Bytes} or {@link Hex} value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.to('0x8b68656c6c6f20776f726c64')
 * // 0x68656c6c6f20776f726c64
 */
export function fromRlp<
  value extends Bytes | Hex,
  to extends To = value extends Bytes ? 'bytes' : 'hex',
>(value: value, to_?: to | To | undefined): FromRlpReturnType<to> {
  const to = to_ ?? (typeof value === 'string' ? 'hex' : 'bytes')

  const bytes = (() => {
    if (typeof value === 'string') {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new InvalidHexValueError(value)
      return hexToBytes(value)
    }
    return value as Bytes
  })()

  const cursor = createCursor(bytes, {
    recursiveReadLimit: Number.POSITIVE_INFINITY,
  })
  const result = fromRlpCursor(cursor, to)

  return result as FromRlpReturnType<to>
}

export type RlpToBytesErrorType = FromRlpErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Bytes} value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.toBytes('0x8b68656c6c6f20776f726c64')
 * // Uint8Array([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 */
export function rlpToBytes(value: Bytes | Hex): FromRlpReturnType<'bytes'> {
  return fromRlp(value, 'bytes')
}

export type RlpToHexErrorType = FromRlpErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a decoded {@link Hex} value.
 *
 * @example
 * import { Rlp } from 'ox'
 * Rlp.toHex('0x8b68656c6c6f20776f726c64')
 * // 0x68656c6c6f20776f726c64
 */
export function rlpToHex(value: Bytes | Hex): FromRlpReturnType<'hex'> {
  return fromRlp(value, 'hex')
}

/////////////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////////////

type FromRlpCursorErrorType =
  | BytesToHexErrorType
  | ReadLengthErrorType
  | ReadListErrorType
  | ErrorType

function fromRlpCursor<to extends To = 'hex'>(
  cursor: Cursor,
  to: to | To | undefined = 'hex',
): FromRlpReturnType<to> {
  if (cursor.bytes.length === 0)
    return (
      to === 'hex' ? bytesToHex(cursor.bytes) : cursor.bytes
    ) as FromRlpReturnType<to>

  const prefix = cursor.readByte()
  if (prefix < 0x80) cursor.decrementPosition(1)

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    const bytes = cursor.readBytes(length)
    return (to === 'hex' ? bytesToHex(bytes) : bytes) as FromRlpReturnType<to>
  }

  // list
  const length = readLength(cursor, prefix, 0xc0)
  return readList(cursor, length, to) as {} as FromRlpReturnType<to>
}

type ReadLengthErrorType = BaseErrorType | ErrorType

function readLength(cursor: Cursor, prefix: number, offset: number) {
  if (offset === 0x80 && prefix < 0x80) return 1
  if (prefix <= offset + 55) return prefix - offset
  if (prefix === offset + 55 + 1) return cursor.readUint8()
  if (prefix === offset + 55 + 2) return cursor.readUint16()
  if (prefix === offset + 55 + 3) return cursor.readUint24()
  if (prefix === offset + 55 + 4) return cursor.readUint32()
  throw new BaseError('Invalid RLP prefix')
}

type ReadListErrorType = ErrorType

function readList<to extends To>(cursor: Cursor, length: number, to: to | To) {
  const position = cursor.position
  const value: FromRlpReturnType<to>[] = []
  while (cursor.position - position < length)
    value.push(fromRlpCursor(cursor, to))
  return value
}
