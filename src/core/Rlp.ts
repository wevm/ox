import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as internal_bytes from './internal/bytes.js'
import * as Cursor from './internal/cursor.js'
import type { ExactPartial, RecursiveArray } from './internal/types.js'

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
export function toBytes(
  value: Bytes.Bytes | Hex.Hex,
): RecursiveArray<Bytes.Bytes> {
  return to(value, 'Bytes')
}

export declare namespace toBytes {
  type ErrorType = to.ErrorType
}

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
export function toHex(value: Bytes.Bytes | Hex.Hex): RecursiveArray<Hex.Hex> {
  return to(value, 'Hex')
}

export declare namespace toHex {
  type ErrorType = to.ErrorType
}

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export function to<
  value extends Bytes.Bytes | Hex.Hex,
  to extends 'Hex' | 'Bytes',
>(value: value, to: to | 'Hex' | 'Bytes'): to.ReturnType<to> {
  const to_ = to ?? (typeof value === 'string' ? 'Hex' : 'Bytes')

  const bytes =
    typeof value === 'string' ? Bytes.fromHex(value) : (value as Bytes.Bytes)

  const cursor = Cursor.create(bytes, {
    recursiveReadLimit: Number.POSITIVE_INFINITY,
  })
  const result = decodeRlpCursor(cursor, to_)

  return result as to.ReturnType<to>
}

/** @internal */
export declare namespace to {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (to extends 'Bytes' ? RecursiveArray<Bytes.Bytes> : never)
    | (to extends 'Hex' ? RecursiveArray<Hex.Hex> : never)

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | decodeRlpCursor.ErrorType
    | Cursor.create.ErrorType
    | Hex.InvalidLengthError
    | Errors.GlobalErrorType
}

/** @internal */

/** @internal */
export function decodeRlpCursor<to extends 'Hex' | 'Bytes' = 'Hex'>(
  cursor: Cursor.Cursor,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
): decodeRlpCursor.ReturnType<to> {
  if (cursor.bytes.length === 0)
    return (
      to === 'Hex' ? Hex.fromBytes(cursor.bytes) : cursor.bytes
    ) as decodeRlpCursor.ReturnType<to>

  const prefix = cursor.readByte()
  if (prefix < 0x80) cursor.decrementPosition(1)

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    const bytes = cursor.readBytes(length)
    return (
      to === 'Hex' ? Hex.fromBytes(bytes) : bytes
    ) as decodeRlpCursor.ReturnType<to>
  }

  // list
  const length = readLength(cursor, prefix, 0xc0)
  return readList(cursor, length, to) as {} as decodeRlpCursor.ReturnType<to>
}

/** @internal */
export declare namespace decodeRlpCursor {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> = to.ReturnType<to>
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | readLength.ErrorType
    | readList.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
export function readLength(
  cursor: Cursor.Cursor,
  prefix: number,
  offset: number,
) {
  if (offset === 0x80 && prefix < 0x80) return 1
  if (prefix <= offset + 55) return prefix - offset
  if (prefix === offset + 55 + 1) return cursor.readUint8()
  if (prefix === offset + 55 + 2) return cursor.readUint16()
  if (prefix === offset + 55 + 3) return cursor.readUint24()
  if (prefix === offset + 55 + 4) return cursor.readUint32()
  throw new Errors.BaseError('Invalid RLP prefix')
}

/** @internal */
export declare namespace readLength {
  type ErrorType = Errors.BaseError | Errors.GlobalErrorType
}

/** @internal */
export function readList<to extends 'Hex' | 'Bytes'>(
  cursor: Cursor.Cursor,
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
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Rlp } from 'ox'
 *
 * Rlp.from('0x68656c6c6f20776f726c64', { as: 'Hex' })
 * // @log: 0x8b68656c6c6f20776f726c64
 *
 * Rlp.from(Bytes.from([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100]), { as: 'Bytes' })
 * // @log: Uint8Array([104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} or {@link ox#Hex.Hex} value to encode.
 * @param options - Options.
 * @returns The RLP value.
 */
export function from<as extends 'Hex' | 'Bytes'>(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
  options: from.Options<as>,
): from.ReturnType<as> {
  const { as } = options

  // Two-walk encode without the per-node `Encodable` closure tree:
  // 1. `measure` walks the input once and caches each list's `bodyLength`
  //    in a side array indexed by visit order. This makes the second walk
  //    O(N) instead of O(N²) for nested inputs.
  // 2. `writeEncoded` walks again, reads cached body lengths, and writes
  //    bytes straight into the pre-sized buffer. Hex leaves are
  //    nibble-decoded directly into the destination, skipping the per-leaf
  //    `Bytes.fromHex` allocation.
  const ctx: EncodeCtx = { lengths: [], cursor: 0 }
  const totalLength = measure(value, ctx)

  // Hex-output fast path: when the caller asked for hex AND every leaf is
  // already hex, emit a hex string directly instead of allocating an
  // intermediate `Uint8Array` and round-tripping through `Hex.fromBytes`.
  // This is the dominant shape for transaction envelope serialize.
  if (as === 'Hex' && isAllHex(value)) {
    const parts: string[] = []
    writeEncodedHex(parts, value as RecursiveArray<Hex.Hex>, {
      lengths: ctx.lengths,
      cursor: 0,
    })
    return `0x${parts.join('')}` as from.ReturnType<as>
  }

  const bytes = new Uint8Array(totalLength)
  writeEncoded(bytes, 0, value, { lengths: ctx.lengths, cursor: 0 })

  if (as === 'Hex') return Hex.fromBytes(bytes) as from.ReturnType<as>
  return bytes as from.ReturnType<as>
}

export declare namespace from {
  type Options<as extends 'Hex' | 'Bytes'> = {
    /** The type to convert the RLP value to. */
    as: as | 'Hex' | 'Bytes'
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Cursor.create.ErrorType
    | Hex.fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Rlp } from 'ox'
 *
 * Rlp.fromBytes(Bytes.from([139, 104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100]))
 * // @log: Uint8Array([104, 101, 108, 108, 111,  32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param bytes - The {@link ox#Bytes.Bytes} value to encode.
 * @param options - Options.
 * @returns The RLP value.
 */
export function fromBytes<as extends 'Hex' | 'Bytes' = 'Bytes'>(
  bytes: RecursiveArray<Bytes.Bytes>,
  options: fromBytes.Options<as> = {},
): fromBytes.ReturnType<as> {
  const { as = 'Bytes' } = options
  return from(bytes, { as }) as never
}

export declare namespace fromBytes {
  type Options<as extends 'Hex' | 'Bytes' = 'Bytes'> = ExactPartial<
    from.Options<as>
  >

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Bytes'> = from.ReturnType<as>

  type ErrorType = from.ErrorType | Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Hex.Hex} value into a Recursive-Length Prefix (RLP) value.
 *
 * @example
 * ```ts twoslash
 * import { Rlp } from 'ox'
 *
 * Rlp.fromHex('0x68656c6c6f20776f726c64')
 * // @log: 0x8b68656c6c6f20776f726c64
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to encode.
 * @param options - Options.
 * @returns The RLP value.
 */
export function fromHex<as extends 'Hex' | 'Bytes' = 'Hex'>(
  hex: RecursiveArray<Hex.Hex>,
  options: fromHex.Options<as> = {},
): fromHex.ReturnType<as> {
  const { as = 'Hex' } = options
  return from(hex, { as }) as never
}

export declare namespace fromHex {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = ExactPartial<
    from.Options<as>
  >

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = from.ReturnType<as>

  type ErrorType = from.ErrorType | Errors.GlobalErrorType
}

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the byte length needed to encode `length` itself (1-4 bytes per
 * RLP), or throws when `length` exceeds the protocol cap.
 */
function getSizeOfLength(length: number) {
  if (length <= 0xff) return 1
  if (length <= 0xff_ff) return 2
  if (length <= 0xff_ff_ff) return 3
  if (length <= 0xff_ff_ff_ff) return 4
  throw new Errors.BaseError('Length is too large.')
}

/**
 * Side-channel used by `measure` and `writeEncoded` to share precomputed
 * list body lengths. `lengths` is filled in pre-order (DFS) by `measure` and
 * read back in the same order by `writeEncoded` via `cursor`. This avoids
 * re-walking subtrees from `writeEncoded` (which would be O(N²) on nested
 * inputs) without allocating a per-node `Encodable` closure tree.
 */
type EncodeCtx = { lengths: number[]; cursor: number }

/**
 * Walks `value` once, caches each list's `bodyLength` into `ctx.lengths`,
 * and returns the total encoded byte length. Allocates nothing per node
 * beyond the shared `lengths` array entries.
 */
function measure(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
  ctx: EncodeCtx,
): number {
  if (Array.isArray(value)) {
    // Reserve this list's slot before descending so children's slots come
    // after ours; `writeEncoded` walks in the same order and reads slot N
    // when it visits the Nth list.
    const slot = ctx.lengths.length
    ctx.lengths.push(0)
    let bodyLength = 0
    for (let i = 0; i < value.length; i++) bodyLength += measure(value[i]!, ctx)
    ctx.lengths[slot] = bodyLength
    if (bodyLength <= 55) return 1 + bodyLength
    return 1 + getSizeOfLength(bodyLength) + bodyLength
  }

  // Hex leaf: byte length = ceil((hex.length - 2) / 2). The `>> 1` of
  // `length - 1` yields ceil for both odd- and even-nibble inputs.
  if (typeof value === 'string') {
    const byteLen = (value.length - 1) >> 1
    if (byteLen === 0) return 1
    if (byteLen === 1) {
      // Single-byte values < 0x80 encode as themselves (no prefix).
      const odd = (value.length & 1) === 1
      const firstChar = value.charCodeAt(odd ? 2 : 3)
      const high = odd
        ? 0
        : (internal_bytes.charCodeToBase16(value.charCodeAt(2)) ?? 0) << 4
      const low = internal_bytes.charCodeToBase16(firstChar) ?? 0
      const byte = high | low
      if (byte < 0x80) return 1
      return 2
    }
    if (byteLen <= 55) return 1 + byteLen
    return 1 + getSizeOfLength(byteLen) + byteLen
  }

  // Bytes leaf
  const len = (value as Bytes.Bytes).length
  if (len === 1 && (value as Bytes.Bytes)[0]! < 0x80) return 1
  if (len <= 55) return 1 + len
  return 1 + getSizeOfLength(len) + len
}

/**
 * Writes `value`'s RLP encoding into `bytes` starting at `offset` and returns
 * the next free offset. Reads list body lengths from `ctx.lengths` in the
 * same DFS order that `measure` filled them. Hex leaves are nibble-decoded
 * directly into the destination, skipping the per-leaf `Bytes.fromHex`
 * allocation.
 */
function writeEncoded(
  bytes: Uint8Array,
  offset: number,
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
  ctx: EncodeCtx,
): number {
  if (Array.isArray(value)) {
    const bodyLength = ctx.lengths[ctx.cursor++]!

    let cursor = offset
    if (bodyLength <= 55) {
      bytes[cursor++] = 0xc0 + bodyLength
    } else {
      const sizeOfBodyLength = getSizeOfLength(bodyLength)
      bytes[cursor++] = 0xc0 + 55 + sizeOfBodyLength
      cursor = writeBigEndian(bytes, cursor, bodyLength, sizeOfBodyLength)
    }
    for (let i = 0; i < value.length; i++)
      cursor = writeEncoded(bytes, cursor, value[i]!, ctx)
    return cursor
  }

  if (typeof value === 'string') return writeHexLeaf(bytes, offset, value)

  return writeBytesLeaf(bytes, offset, value as Bytes.Bytes)
}

/**
 * Hex-leaf fast path: writes the RLP encoding of a hex string directly into
 * `bytes` by nibble-decoding the source hex chars into the destination
 * buffer. Even-pads odd-nibble hex (e.g. `'0x1'`) on the fly.
 */
function writeHexLeaf(bytes: Uint8Array, offset: number, hex: Hex.Hex): number {
  const dataStart = 2
  let byteLen = (hex.length - 2) >> 1
  let highNibbleFromOddPad = false
  if ((hex.length & 1) === 1) {
    // Odd-nibble: first emitted byte's high nibble is `0` (left-pad).
    byteLen += 1
    highNibbleFromOddPad = true
  }

  // Empty leaf -> single 0x80 prefix byte (zero-length string in RLP).
  if (byteLen === 0) {
    bytes[offset] = 0x80
    return offset + 1
  }

  // Single-byte fast path: if the byte < 0x80, write it as-is (no prefix).
  if (byteLen === 1) {
    let byte: number
    if (highNibbleFromOddPad) {
      byte = internal_bytes.charCodeToBase16(hex.charCodeAt(dataStart)) ?? 0
    } else {
      const high =
        internal_bytes.charCodeToBase16(hex.charCodeAt(dataStart)) ?? 0
      const low =
        internal_bytes.charCodeToBase16(hex.charCodeAt(dataStart + 1)) ?? 0
      byte = (high << 4) | low
    }
    if (byte < 0x80) {
      bytes[offset] = byte
      return offset + 1
    }
    bytes[offset] = 0x80 + 1
    bytes[offset + 1] = byte
    return offset + 2
  }

  let dest = offset
  if (byteLen <= 55) {
    bytes[dest++] = 0x80 + byteLen
  } else {
    const sizeOfBytesLength = getSizeOfLength(byteLen)
    bytes[dest++] = 0x80 + 55 + sizeOfBytesLength
    dest = writeBigEndian(bytes, dest, byteLen, sizeOfBytesLength)
  }

  // Decode hex nibbles directly into the destination buffer.
  let src = dataStart
  if (highNibbleFromOddPad) {
    const low = internal_bytes.charCodeToBase16(hex.charCodeAt(src++))
    if (low === undefined) throw invalidNibble(hex)
    bytes[dest++] = low
  }
  while (src < hex.length) {
    const high = internal_bytes.charCodeToBase16(hex.charCodeAt(src++))
    const low = internal_bytes.charCodeToBase16(hex.charCodeAt(src++))
    if (high === undefined || low === undefined) throw invalidNibble(hex)
    bytes[dest++] = (high << 4) | low
  }
  return dest
}

function writeBytesLeaf(
  bytes: Uint8Array,
  offset: number,
  leaf: Bytes.Bytes,
): number {
  const len = leaf.length

  if (len === 1 && leaf[0]! < 0x80) {
    bytes[offset] = leaf[0]!
    return offset + 1
  }

  let dest = offset
  if (len <= 55) {
    bytes[dest++] = 0x80 + len
  } else {
    const sizeOfBytesLength = getSizeOfLength(len)
    bytes[dest++] = 0x80 + 55 + sizeOfBytesLength
    dest = writeBigEndian(bytes, dest, len, sizeOfBytesLength)
  }
  bytes.set(leaf, dest)
  return dest + len
}

/**
 * Returns true if every leaf in the (possibly nested) input is a hex string.
 * Used to gate the hex-output fast path in `from`.
 */
function isAllHex(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
): boolean {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++)
      if (!isAllHex(value[i]!)) return false
    return true
  }
  return typeof value === 'string'
}

/**
 * Hex-output fast path: writes the RLP encoding of `value` directly as hex
 * substrings into `parts`. Avoids the intermediate `Uint8Array` allocation
 * (and the trailing `Hex.fromBytes` round-trip) used by the bytes path.
 *
 * Length-prefix bytes are formatted via the cached `hexes[]` table so we
 * never call `toString(16)` per node.
 */
function writeEncodedHex(
  parts: string[],
  value: RecursiveArray<Hex.Hex>,
  ctx: EncodeCtx,
): void {
  if (Array.isArray(value)) {
    const bodyLength = ctx.lengths[ctx.cursor++]!
    if (bodyLength <= 55) {
      parts.push(hexes[0xc0 + bodyLength]!)
    } else {
      const sizeOfBodyLength = getSizeOfLength(bodyLength)
      parts.push(hexes[0xc0 + 55 + sizeOfBodyLength]!)
      parts.push(bigEndianHex(bodyLength, sizeOfBodyLength))
    }
    for (let i = 0; i < value.length; i++)
      writeEncodedHex(parts, value[i]!, ctx)
    return
  }

  // Hex leaf: even-pad odd-nibble inputs and skip the `0x` prefix.
  const hex = value as string
  const odd = (hex.length & 1) === 1
  const body = odd ? `0${hex.slice(2)}` : hex.slice(2)
  const byteLen = body.length >> 1

  if (byteLen === 0) {
    parts.push(hexes[0x80]!)
    return
  }
  if (byteLen === 1) {
    const byte = parseInt(body, 16)
    if (byte < 0x80) {
      parts.push(body)
    } else {
      parts.push(hexes[0x81]!)
      parts.push(body)
    }
    return
  }
  if (byteLen <= 55) {
    parts.push(hexes[0x80 + byteLen]!)
    parts.push(body)
    return
  }
  const sizeOfBytesLength = getSizeOfLength(byteLen)
  parts.push(hexes[0x80 + 55 + sizeOfBytesLength]!)
  parts.push(bigEndianHex(byteLen, sizeOfBytesLength))
  parts.push(body)
}

const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/**
 * Returns the big-endian hex encoding of `value` in `size` bytes.
 */
function bigEndianHex(value: number, size: number): string {
  if (size === 1) return hexes[value & 0xff]!
  if (size === 2)
    return `${hexes[(value >>> 8) & 0xff]!}${hexes[value & 0xff]!}`
  if (size === 3)
    return `${hexes[(value >>> 16) & 0xff]!}${hexes[(value >>> 8) & 0xff]!}${hexes[value & 0xff]!}`
  return `${hexes[(value >>> 24) & 0xff]!}${hexes[(value >>> 16) & 0xff]!}${hexes[(value >>> 8) & 0xff]!}${hexes[value & 0xff]!}`
}

function writeBigEndian(
  bytes: Uint8Array,
  offset: number,
  value: number,
  size: number,
): number {
  if (size === 1) {
    bytes[offset] = value & 0xff
  } else if (size === 2) {
    bytes[offset] = (value >>> 8) & 0xff
    bytes[offset + 1] = value & 0xff
  } else if (size === 3) {
    bytes[offset] = (value >>> 16) & 0xff
    bytes[offset + 1] = (value >>> 8) & 0xff
    bytes[offset + 2] = value & 0xff
  } else {
    bytes[offset] = (value >>> 24) & 0xff
    bytes[offset + 1] = (value >>> 16) & 0xff
    bytes[offset + 2] = (value >>> 8) & 0xff
    bytes[offset + 3] = value & 0xff
  }
  return offset + size
}

function invalidNibble(hex: Hex.Hex): Errors.BaseError {
  return new Errors.BaseError(`Invalid hex string \`${hex}\`.`)
}
