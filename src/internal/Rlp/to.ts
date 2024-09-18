import { Bytes_fromHex } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import { BaseError } from '../Errors/base.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_InvalidLengthError } from '../Hex/errors.js'
import { Hex_fromBytes } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { type Cursor, createCursor } from '../cursor.js'
import type { RecursiveArray } from '../types.js'

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a {@link ox#Bytes.Bytes} value.
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 * Rlp.toBytes('0x8b68656c6c6f20776f726c64')
 * // Uint8Array([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param value - The value to decode.
 * @returns The decoded {@link ox#Bytes.Bytes} value.
 */
export function Rlp_toBytes(value: Bytes | Hex): Rlp_toBytes.ReturnType {
  return Rlp_to(value, 'Bytes')
}

export declare namespace Rlp_toBytes {
  type ErrorType = Rlp_to.ErrorType
  type ReturnType = Rlp_to.ReturnType<'Bytes'>
}

Rlp_toBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Rlp_toBytes.ErrorType

/**
 * Decodes a Recursive-Length Prefix (RLP) value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 * Rlp.toHex('0x8b68656c6c6f20776f726c64')
 * // 0x68656c6c6f20776f726c64
 * ```
 *
 * @param value - The value to decode.
 * @returns The decoded {@link ox#Hex.Hex} value.
 */
export function Rlp_toHex(value: Bytes | Hex): Rlp_toHex.ReturnType {
  return Rlp_to(value, 'Hex')
}

export declare namespace Rlp_toHex {
  type ErrorType = Rlp_to.ErrorType
  type ReturnType = Rlp_to.ReturnType<'Hex'>
}

Rlp_toHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Rlp_toHex.ErrorType

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function Rlp_to<value extends Bytes | Hex, to extends 'Hex' | 'Bytes'>(
  value: value,
  to: to | 'Hex' | 'Bytes',
): Rlp_to.ReturnType<to> {
  const to_ = to ?? (typeof value === 'string' ? 'Hex' : 'Bytes')

  const bytes = (() => {
    if (typeof value === 'string') {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new Hex_InvalidLengthError(value)
      return Bytes_fromHex(value)
    }
    return value as Bytes
  })()

  const cursor = createCursor(bytes, {
    recursiveReadLimit: Number.POSITIVE_INFINITY,
  })
  const result = decodeRlpCursor(cursor, to_)

  return result as Rlp_to.ReturnType<to>
}

/** @internal */
export declare namespace Rlp_to {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (to extends 'Bytes' ? RecursiveArray<Bytes> : never)
    | (to extends 'Hex' ? RecursiveArray<Hex> : never)

  type ErrorType =
    | Bytes_fromHex.ErrorType
    | decodeRlpCursor.ErrorType
    | createCursor.ErrorType
    | Hex_InvalidLengthError
    | GlobalErrorType
}

/** @internal */
Rlp_to.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Rlp_to.ErrorType

/** @internal */
export function decodeRlpCursor<to extends 'Hex' | 'Bytes' = 'Hex'>(
  cursor: Cursor,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
): decodeRlpCursor.ReturnType<to> {
  if (cursor.bytes.length === 0)
    return (
      to === 'Hex' ? Hex_fromBytes(cursor.bytes) : cursor.bytes
    ) as decodeRlpCursor.ReturnType<to>

  const prefix = cursor.readByte()
  if (prefix < 0x80) cursor.decrementPosition(1)

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    const bytes = cursor.readBytes(length)
    return (
      to === 'Hex' ? Hex_fromBytes(bytes) : bytes
    ) as decodeRlpCursor.ReturnType<to>
  }

  // list
  const length = readLength(cursor, prefix, 0xc0)
  return readList(cursor, length, to) as {} as decodeRlpCursor.ReturnType<to>
}

/** @internal */
export declare namespace decodeRlpCursor {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> = Rlp_to.ReturnType<to>
  type ErrorType =
    | Hex_fromBytes.ErrorType
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
