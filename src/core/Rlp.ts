import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Cursor from './internal/cursor.js'
import type { ExactPartial, RecursiveArray } from './internal/types.js'

/** Maximum nesting depth permitted when decoding an RLP value. */
const depthLimit = 1_024

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

  const bytes = (() => {
    if (typeof value === 'string') {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new Hex.InvalidLengthError(value)
      return Bytes.fromHex(value)
    }
    return value as Bytes.Bytes
  })()

  const state: State = { bytes, position: 0 }
  const result = decodeRlpCursor(state, to_)

  // RLP payloads encode exactly one item (Yellow Paper, Appendix B).
  if (state.position < bytes.length)
    throw new TrailingBytesError({ count: bytes.length - state.position })

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
    | Hex.InvalidLengthError
    | TrailingBytesError
    | Errors.GlobalErrorType
}

/**
 * Decoder position over the encoded bytes. A `Cursor` satisfies it, but the
 * decoder only reads `bytes` and moves `position`.
 *
 * @internal
 */
type State = Pick<Cursor.Cursor, 'bytes' | 'position'>

/** @internal */
export function decodeRlpCursor<to extends 'Hex' | 'Bytes' = 'Hex'>(
  cursor: State,
  to: to | 'Hex' | 'Bytes' | undefined = 'Hex',
  depth = 0,
): decodeRlpCursor.ReturnType<to> {
  if (depth >= depthLimit)
    throw new DepthLimitExceededError({ limit: depthLimit })

  const { bytes } = cursor
  if (bytes.length === 0)
    return (
      to === 'Hex' ? Hex.fromBytes(bytes) : bytes
    ) as decodeRlpCursor.ReturnType<to>

  assertPosition(bytes, cursor.position)
  const prefix = bytes[cursor.position]!
  if (prefix >= 0x80) cursor.position++

  // bytes
  if (prefix < 0xc0) {
    const length = readLength(cursor, prefix, 0x80)
    if (length > 0) assertPosition(bytes, cursor.position + length - 1)
    const data = bytes.subarray(cursor.position, cursor.position + length)
    cursor.position += length
    // A single byte below `0x80` must be its own encoding (no length
    // prefix); wrapping it in an explicit one-byte-length prefix is a
    // non-canonical alternate encoding of the same value (Yellow Paper,
    // Appendix B).
    if (prefix >= 0x80 && length === 1 && data[0]! < 0x80)
      throw new NonCanonicalError({
        reason: `single byte \`0x${data[0]!.toString(16).padStart(2, '0')}\` is wrapped in an explicit length prefix instead of being encoded as itself`,
      })
    return (
      to === 'Hex' ? Hex.fromBytes(data) : data
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
    assertPosition(cursor.bytes, cursor.position)
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

function assertPosition(bytes: Bytes.Bytes, position: number) {
  if (position < 0 || position > bytes.length - 1)
    throw new Cursor.PositionOutOfBoundsError({
      length: bytes.length,
      position,
    })
}

// Reads a big-endian unsigned integer of up to 4 bytes.
function readUint(cursor: State, size: number) {
  const { bytes, position } = cursor
  assertPosition(bytes, position + size - 1)
  let value = 0
  for (let i = 0; i < size; i++) value = value * 256 + bytes[position + i]!
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

  // Two passes without a per-node closure tree: `measure` decodes leaves and
  // records list body lengths in visit order, and `write` reads both back in
  // the same order into a pre-sized buffer.
  const ctx: EncodeContext = { bodies: [], leaves: [] }
  const bytes = new Uint8Array(measure(value, ctx))
  write(value, bytes, ctx, { body: 0, leaf: 0, offset: 0 })

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

type EncodeContext = {
  /** Body length of each list, in visit order. */
  bodies: number[]
  /** Bytes of each leaf, in visit order. */
  leaves: Bytes.Bytes[]
}

function measure(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
  ctx: EncodeContext,
): number {
  if (Array.isArray(value)) {
    // Reserve this list's slot before its children's, in visit order.
    const index = ctx.bodies.length
    ctx.bodies.push(0)
    let bodyLength = 0
    for (let i = 0; i < value.length; i++) bodyLength += measure(value[i], ctx)
    ctx.bodies[index] = bodyLength
    if (bodyLength <= 55) return 1 + bodyLength
    return 1 + getSizeOfLength(bodyLength) + bodyLength
  }

  const bytes =
    typeof value === 'string'
      ? Bytes.fromHex(value as Hex.Hex)
      : (value as Bytes.Bytes)
  ctx.leaves.push(bytes)
  const sizeOfBytesLength = getSizeOfLength(bytes.length)
  if (bytes.length === 1 && bytes[0]! < 0x80) return 1
  if (bytes.length <= 55) return 1 + bytes.length
  return 1 + sizeOfBytesLength + bytes.length
}

function write(
  value: RecursiveArray<Bytes.Bytes> | RecursiveArray<Hex.Hex>,
  out: Bytes.Bytes,
  ctx: EncodeContext,
  state: { body: number; leaf: number; offset: number },
) {
  if (Array.isArray(value)) {
    writePrefix(out, state, 0xc0, ctx.bodies[state.body++]!)
    for (let i = 0; i < value.length; i++) write(value[i], out, ctx, state)
    return
  }

  const bytes = ctx.leaves[state.leaf++]!
  if (bytes.length === 1 && bytes[0]! < 0x80) {
    out[state.offset++] = bytes[0]!
    return
  }
  writePrefix(out, state, 0x80, bytes.length)
  out.set(bytes, state.offset)
  state.offset += bytes.length
}

function writePrefix(
  out: Bytes.Bytes,
  state: { offset: number },
  offset: number,
  length: number,
) {
  if (length <= 55) {
    out[state.offset++] = offset + length
    return
  }
  const size = getSizeOfLength(length)
  out[state.offset++] = offset + 55 + size
  // Big-endian length in `size` bytes.
  for (let i = size - 1, n = length; i >= 0; i--, n = Math.floor(n / 256))
    out[state.offset + i] = n % 256
  state.offset += size
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
