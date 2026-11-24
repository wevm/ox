import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Cursor from './internal/cursor.js'
import type { RecursiveArray } from './internal/types.js'

/** Maximum nesting depth permitted when decoding an RLP value. */
const depthLimit = 1_024

const hexRegex = /^0x[0-9a-fA-F]*$/

/** Two hex digits for each byte value, for list and item prefixes. */
const hexes = /*#__PURE__*/ Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0'),
)

/** Longest input, in bytes, whose hex leaves are cut from it (see `to`). */
const sourceMaxLength = 2_048

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

  // Hex leaves are cut from the input as lowercase hex, rather than copied out
  // of bytes and encoded one by one. Valid hex decoded to hex is read as hex,
  // without decoding the whole input to bytes. A long input decodes leaf by
  // leaf, so small leaves do not keep it alive.
  let state: State
  if (
    typeof value === 'string' &&
    to_ === 'Hex' &&
    value.length % 2 === 0 &&
    value.length <= 2 + sourceMaxLength * 2 &&
    hexRegex.test(value)
  )
    state = { position: 0, source: value.toLowerCase() }
  else {
    let bytes: Bytes.Bytes
    if (typeof value === 'string') {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new Hex.InvalidLengthError(value)
      bytes = Bytes.fromHex(value)
    } else bytes = value as Bytes.Bytes
    const source =
      to_ === 'Hex' &&
      typeof value !== 'string' &&
      bytes.length <= sourceMaxLength
        ? Hex.fromBytes(bytes)
        : undefined
    state = { bytes, position: 0, source }
  }
  const result = decodeRlpCursor(state, to_)

  // RLP payloads encode exactly one item (Yellow Paper, Appendix B).
  const size = sizeOf(state)
  if (state.position < size)
    throw new TrailingBytesError({ count: size - state.position })

  return result as to.ReturnType<to>
}

/** @internal */
export declare namespace to {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    Bytes: RecursiveArray<Bytes.Bytes>
    Hex: RecursiveArray<Hex.Hex>
  }[to]

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | decodeRlpCursor.ErrorType
    | Hex.InvalidLengthError
    | TrailingBytesError
    | Errors.GlobalErrorType
}

/**
 * Decoder position over the encoded input: its bytes, its lowercase hex for
 * hex leaves to be cut from (`source`), or both. A `Cursor` satisfies it, but
 * the decoder only reads `bytes` and moves `position`.
 *
 * @internal
 */
type State = {
  bytes?: Bytes.Bytes | undefined
  position: number
  source?: string | undefined
}

/**
 * The size of the input in bytes.
 *
 * @internal
 */
function sizeOf(state: State): number {
  // Checked against `undefined`, so a value that is not bytes, such as `0`,
  // fails as an invalid prefix, as before, rather than reading `source`.
  return state.bytes !== undefined
    ? state.bytes.length
    : (state.source!.length - 2) / 2
}

/**
 * The byte at `position`, from `bytes` or from two digits of `source`.
 *
 * @internal
 */
function byteAt(state: State, position: number): number {
  if (state.bytes !== undefined) return state.bytes[position]!
  const i = 2 + position * 2
  const high = state.source!.charCodeAt(i)
  const low = state.source!.charCodeAt(i + 1)
  // `source` is lowercase hex: `0`-`9` are 48-57 and `a`-`f` 97-102.
  return (
    ((high < 58 ? high - 48 : high - 87) << 4) |
    (low < 58 ? low - 48 : low - 87)
  )
}

/** @internal */
export function decodeRlpCursor<to extends 'Hex' | 'Bytes' = 'Hex'>(
  cursor: State,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
  depth = 0,
): decodeRlpCursor.ReturnType<to> {
  if (depth >= depthLimit)
    throw new DepthLimitExceededError({ limit: depthLimit })

  const { bytes, source } = cursor
  const size = sizeOf(cursor)
  if (size === 0)
    return (to === 'Hex' ? '0x' : bytes) as decodeRlpCursor.ReturnType<to>

  assertPosition(size, cursor.position)
  const prefix = byteAt(cursor, cursor.position)
  if (prefix >= 0x80) cursor.position++

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    if (length > 0) assertPosition(size, cursor.position + length - 1)
    const start = cursor.position
    cursor.position += length
    // A single byte below `0x80` must be its own encoding (no length
    // prefix); wrapping it in an explicit one-byte-length prefix is a
    // non-canonical alternate encoding of the same value (Yellow Paper,
    // Appendix B).
    if (prefix >= 0x80 && length === 1) {
      const byte = byteAt(cursor, start)
      if (byte < 0x80)
        throw new NonCanonicalError({
          reason: `single byte \`0x${byte.toString(16).padStart(2, '0')}\` is wrapped in an explicit length prefix instead of being encoded as itself`,
        })
    }
    if (to !== 'Hex')
      return bytes!.subarray(
        start,
        cursor.position,
      ) as decodeRlpCursor.ReturnType<to>
    return (
      source
        ? `0x${source.slice(2 + start * 2, 2 + cursor.position * 2)}`
        : Hex.fromBytes(bytes!.subarray(start, cursor.position))
    ) as decodeRlpCursor.ReturnType<to>
  }

  // list
  const length = readLength(cursor, prefix, 0xc0)
  return readList(
    cursor,
    length,
    to,
    depth + 1,
  ) as {} as decodeRlpCursor.ReturnType<to>
}

/** @internal */
export declare namespace decodeRlpCursor {
  type ReturnType<to extends 'Hex' | 'Bytes' = 'Hex'> = to.ReturnType<to>
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | readLength.ErrorType
    | readList.ErrorType
    | Cursor.PositionOutOfBoundsError
    | DepthLimitExceededError
    | NonCanonicalError
    | Errors.GlobalErrorType
}

/** @internal */
export function readLength(cursor: State, prefix: number, offset: number) {
  if (offset === 0x80 && prefix < 0x80) return 1
  if (prefix <= offset + 55) return prefix - offset
  // Long-form lengths must use the minimal number of length-bytes: a value
  // that fits in fewer bytes (or in the short form, i.e. <= 55) encoded via
  // a longer form is a non-canonical alternate encoding of the same value
  // (Yellow Paper, Appendix B).
  if (prefix === offset + 55 + 1) {
    const length = readUint(cursor, 1)
    if (length <= 55)
      throw new NonCanonicalError({
        reason: `length \`${length}\` fits in the short form and must not use a one-byte length prefix`,
      })
    return length
  }
  if (prefix === offset + 55 + 2) {
    const length = readUint(cursor, 2)
    if (length <= 0xff)
      throw new NonCanonicalError({
        reason: `length \`${length}\` fits in fewer length-bytes and must not use a two-byte length prefix`,
      })
    return length
  }
  if (prefix === offset + 55 + 3) {
    const length = readUint(cursor, 3)
    if (length <= 0xffff)
      throw new NonCanonicalError({
        reason: `length \`${length}\` fits in fewer length-bytes and must not use a three-byte length prefix`,
      })
    return length
  }
  if (prefix === offset + 55 + 4) {
    const length = readUint(cursor, 4)
    if (length <= 0xffffff)
      throw new NonCanonicalError({
        reason: `length \`${length}\` fits in fewer length-bytes and must not use a four-byte length prefix`,
      })
    return length
  }
  throw new Errors.BaseError('Invalid RLP prefix')
}

/** @internal */
export declare namespace readLength {
  type ErrorType =
    | Cursor.PositionOutOfBoundsError
    | NonCanonicalError
    | Errors.BaseError
    | Errors.GlobalErrorType
}

/** @internal */
export function readList<to extends 'Hex' | 'Bytes'>(
  cursor: State,
  length: number,
  to: to | 'Hex' | 'Bytes',
  depth = 0,
) {
  const position = cursor.position
  const value: decodeRlpCursor.ReturnType<to>[] = []
  while (cursor.position - position < length) {
    // Every item takes at least one byte; without this check, empty bytes
    // (which `decodeRlpCursor` decodes without reading) would loop forever.
    assertPosition(sizeOf(cursor), cursor.position)
    value.push(decodeRlpCursor(cursor, to, depth))
  }
  // Items must consume exactly the declared list length.
  if (cursor.position - position !== length)
    throw new ListBoundaryExceededError({
      consumed: cursor.position - position,
      declared: length,
    })
  return value
}

/** @internal */
export declare namespace readList {
  type ErrorType =
    | DepthLimitExceededError
    | ListBoundaryExceededError
    | Errors.GlobalErrorType
}

function assertPosition(length: number, position: number) {
  if (position < 0 || position > length - 1)
    throw new Cursor.PositionOutOfBoundsError({ length, position })
}

// Reads a big-endian unsigned integer of up to 4 bytes.
function readUint(cursor: State, size: number) {
  const { position } = cursor
  assertPosition(sizeOf(cursor), position + size - 1)
  let value = 0
  for (let i = 0; i < size; i++)
    value = value * 256 + byteAt(cursor, position + i)
  cursor.position += size
  return value
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
  const hex = `0x${encode(value)}` as Hex.Hex
  if (as === 'Hex') return hex as from.ReturnType<as>
  return Bytes.fromHex(hex) as from.ReturnType<as>
}

export declare namespace from {
  type Options<as extends 'Hex' | 'Bytes'> = {
    /** The type to convert the RLP value to. */
    as: as | 'Hex' | 'Bytes'
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> = {
    Bytes: Bytes.Bytes
    Hex: Hex.Hex
  }[as]

  type ErrorType =
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
  type Options<as extends 'Hex' | 'Bytes' = 'Bytes'> = {
    /** The type to convert the RLP value to. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

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
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** The type to convert the RLP value to. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = from.ReturnType<as>

  type ErrorType = from.ErrorType | Errors.GlobalErrorType
}

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/**
 * The RLP encoding of `value` as hex without `0x`. Hex leaves are checked,
 * lowercased and concatenated as strings, without decoding each one to bytes
 * and the result back to hex.
 *
 * @internal
 */
function encode(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
): string {
  if (Array.isArray(value)) {
    let body = ''
    for (let i = 0; i < value.length; i++) body += encode(value[i])
    return prefix(body.length / 2, 0xc0) + body
  }
  let hex = typeof value === 'string' ? hexLeaf(value) : undefined
  if (hex === undefined) {
    // Bytes, and strings `hexLeaf` does not take, read as before: a string as
    // `Bytes.fromHex` reads it, which throws on a character that is not hex.
    const bytes =
      typeof value === 'string'
        ? Bytes.fromHex(value as Hex.Hex)
        : (value as Bytes.Bytes)
    // A leaf that is neither hex nor bytes, such as a number, has no length
    // and throws here, as before, instead of encoding as an empty string.
    getSizeOfLength(bytes.length)
    hex = Hex.fromBytes(bytes).slice(2)
  }
  // A single byte below `0x80` is its own encoding.
  if (hex.length === 2 && hex < '80') return hex
  return prefix(hex.length / 2, 0x80) + hex
}

/**
 * The bytes of a `0x`-prefixed hex string as lowercase hex without `0x`, with
 * a leading zero for an odd number of digits. `undefined` for anything else.
 *
 * @internal
 */
function hexLeaf(value: string): string | undefined {
  // A regular expression checks a long leaf faster than a loop.
  if (value.length > 66) {
    if (!hexRegex.test(value)) return
    const hex = value.length % 2 ? `0${value.slice(2)}` : value.slice(2)
    return /[A-F]/.test(hex) ? hex.toLowerCase() : hex
  }
  if (value.charCodeAt(0) !== 48 || value.charCodeAt(1) !== 120) return
  let upper = false
  for (let i = 2; i < value.length; i++) {
    const code = value.charCodeAt(i)
    // 0-9, A-F, a-f
    if (
      code < 48 ||
      (code > 57 && code < 65) ||
      (code > 70 && code < 97) ||
      code > 102
    )
      return
    if (code < 97 && code > 57) upper = true
  }
  const hex = value.length % 2 ? `0${value.slice(2)}` : value.slice(2)
  return upper ? hex.toLowerCase() : hex
}

/**
 * The prefix of an item of `length` bytes, as hex.
 *
 * @internal
 */
function prefix(length: number, offset: 0x80 | 0xc0): string {
  if (length <= 55) return hexes[offset + length]!
  const size = getSizeOfLength(length)
  return (
    (offset + 55 + size).toString(16) +
    length.toString(16).padStart(size * 2, '0')
  )
}

function getSizeOfLength(length: number) {
  if (length <= 0xff) return 1
  if (length <= 0xff_ff) return 2
  if (length <= 0xff_ff_ff) return 3
  if (length <= 0xff_ff_ff_ff) return 4
  throw new Errors.BaseError('Length is too large.')
}

/** Thrown when an RLP value nests deeper than the decode depth limit. */
export class DepthLimitExceededError extends Errors.BaseError {
  override readonly name = 'Rlp.DepthLimitExceededError'

  constructor({ limit }: { limit: number }) {
    super(`RLP depth limit of \`${limit}\` exceeded.`)
  }
}

/** Thrown when RLP list items overrun the list's declared length. */
export class ListBoundaryExceededError extends Errors.BaseError {
  override readonly name = 'Rlp.ListBoundaryExceededError'

  constructor({ consumed, declared }: { consumed: number; declared: number }) {
    super(
      `RLP list items consumed \`${consumed}\` bytes but the list declared a length of \`${declared}\`.`,
    )
  }
}

/** Thrown when an RLP payload contains bytes after the decoded item. */
export class TrailingBytesError extends Errors.BaseError {
  override readonly name = 'Rlp.TrailingBytesError'

  constructor({ count }: { count: number }) {
    super(
      `RLP payload encodes a single item, but \`${count}\` trailing ${
        count === 1 ? 'byte remains' : 'bytes remain'
      }.`,
    )
  }
}

/** Thrown when an RLP payload uses a non-canonical alternate encoding of a value. */
export class NonCanonicalError extends Errors.BaseError {
  override readonly name = 'Rlp.NonCanonicalError'

  constructor({ reason }: { reason: string }) {
    super(`RLP payload is not canonically encoded: ${reason}.`)
  }
}
