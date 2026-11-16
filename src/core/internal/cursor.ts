import type { Bytes } from '../Bytes.js'
import * as Errors from '../Errors.js'

/** @internal */
export type Cursor = {
  bytes: Bytes
  /** Lazy: created on first access, since most cursors never use it. */
  readonly dataView: DataView
  /** Backing field of `dataView`. */
  _dataView: DataView | undefined
  position: number
  /**
   * Bitset of positions read so far, one bit per byte in 30-bit words. Lazy:
   * only allocated when the recursive read limit is finite.
   */
  readPositions: number[] | undefined
  /** Total number of bytes read. */
  readSize: number
  /** Maximum total number of bytes that can be read. */
  readSizeLimit: number
  recursiveReadCount: number
  recursiveReadLimit: number
  remaining: number
  assertReadLimit(position?: number): void
  assertReadSize(length: number): void
  assertPosition(position: number): void
  decrementPosition(offset: number): void
  incrementPosition(offset: number): void
  inspectByte(position?: number): Bytes[number]
  inspectBytes(length: number, position?: number): Bytes
  inspectUint8(position?: number): number
  inspectUint16(position?: number): number
  inspectUint24(position?: number): number
  inspectUint32(position?: number): number
  pushByte(byte: Bytes[number]): void
  pushBytes(bytes: Bytes): void
  pushUint8(value: number): void
  pushUint16(value: number): void
  pushUint24(value: number): void
  pushUint32(value: number): void
  readByte(): Bytes[number]
  readBytes(length: number, size?: number): Bytes
  readUint8(): number
  readUint16(): number
  readUint24(): number
  readUint32(): number
  setPosition(position: number): () => void
  _touch(): void
}

const staticCursor: Cursor = {
  bytes: new Uint8Array(),
  get dataView() {
    return (this._dataView ??= new DataView(
      this.bytes.buffer,
      this.bytes.byteOffset,
      this.bytes.byteLength,
    ))
  },
  _dataView: undefined,
  position: 0,
  readPositions: undefined,
  readSize: 0,
  readSizeLimit: Number.POSITIVE_INFINITY,
  recursiveReadCount: 0,
  recursiveReadLimit: Number.POSITIVE_INFINITY,
  assertReadLimit() {
    if (this.recursiveReadCount >= this.recursiveReadLimit)
      throw new RecursiveReadLimitExceededError({
        count: this.recursiveReadCount + 1,
        limit: this.recursiveReadLimit,
      })
  },
  assertReadSize(length) {
    this.readSize += length
    if (this.readSize > this.readSizeLimit)
      throw new ReadSizeLimitExceededError({
        limit: this.readSizeLimit,
        size: this.readSize,
      })
  },
  assertPosition(position) {
    if (position < 0 || position > this.bytes.length - 1)
      throw new PositionOutOfBoundsError({
        length: this.bytes.length,
        position,
      })
  },
  decrementPosition(offset) {
    if (offset < 0) throw new NegativeOffsetError({ offset })
    const position = this.position - offset
    this.assertPosition(position)
    this.position = position
  },
  incrementPosition(offset) {
    if (offset < 0) throw new NegativeOffsetError({ offset })
    const position = this.position + offset
    this.assertPosition(position)
    this.position = position
  },
  inspectByte(position_) {
    const position = position_ ?? this.position
    this.assertPosition(position)
    return this.bytes[position]!
  },
  inspectBytes(length, position_) {
    const position = position_ ?? this.position
    this.assertPosition(position + length - 1)
    return this.bytes.subarray(position, position + length)
  },
  inspectUint8(position_) {
    const position = position_ ?? this.position
    this.assertPosition(position)
    return this.bytes[position]!
  },
  inspectUint16(position_) {
    const position = position_ ?? this.position
    this.assertPosition(position + 1)
    return this.dataView.getUint16(position)
  },
  inspectUint24(position_) {
    const position = position_ ?? this.position
    this.assertPosition(position + 2)
    return (
      (this.dataView.getUint16(position) << 8) +
      this.dataView.getUint8(position + 2)
    )
  },
  inspectUint32(position_) {
    const position = position_ ?? this.position
    this.assertPosition(position + 3)
    return this.dataView.getUint32(position)
  },
  pushByte(byte: Bytes[number]) {
    this.assertPosition(this.position)
    this.bytes[this.position] = byte
    this.position++
  },
  pushBytes(bytes: Bytes) {
    this.assertPosition(this.position + bytes.length - 1)
    this.bytes.set(bytes, this.position)
    this.position += bytes.length
  },
  pushUint8(value: number) {
    this.assertPosition(this.position)
    this.bytes[this.position] = value
    this.position++
  },
  pushUint16(value: number) {
    this.assertPosition(this.position + 1)
    this.dataView.setUint16(this.position, value)
    this.position += 2
  },
  pushUint24(value: number) {
    this.assertPosition(this.position + 2)
    this.dataView.setUint16(this.position, value >> 8)
    this.dataView.setUint8(this.position + 2, value & ~4294967040)
    this.position += 3
  },
  pushUint32(value: number) {
    this.assertPosition(this.position + 3)
    this.dataView.setUint32(this.position, value)
    this.position += 4
  },
  readByte() {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectByte()
    this.assertReadSize(1)
    this.position++
    return value
  },
  readBytes(length, size) {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectBytes(length)
    this.assertReadSize(length)
    this.position += size ?? length
    return value
  },
  readUint8() {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectUint8()
    this.assertReadSize(1)
    this.position += 1
    return value
  },
  readUint16() {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectUint16()
    this.assertReadSize(2)
    this.position += 2
    return value
  },
  readUint24() {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectUint24()
    this.assertReadSize(3)
    this.position += 3
    return value
  },
  readUint32() {
    this.assertReadLimit()
    this._touch()
    const value = this.inspectUint32()
    this.assertReadSize(4)
    this.position += 4
    return value
  },
  get remaining() {
    return this.bytes.length - this.position
  },
  setPosition(position) {
    const oldPosition = this.position
    this.assertPosition(position)
    this.position = position
    return () => (this.position = oldPosition)
  },
  _touch() {
    if (this.recursiveReadLimit === Number.POSITIVE_INFINITY) return
    // Words of 30 bits stay small integers, so a plain array holds them. A
    // typed array over 64 bytes is allocated off-heap, which costs more than
    // decoding a short payload. Reads stop at the end of the data, so a bit
    // per byte plus one covers every position a read starts from.
    // oxlint-disable-next-line unicorn/no-new-array -- `Array.from({ length })` is about 20 times slower to fill.
    const positions = (this.readPositions ??= new Array<number>(
      Math.floor(this.bytes.length / 30) + 1,
    ).fill(0))
    const index = Math.floor(this.position / 30)
    const bit = 1 << (this.position - index * 30)
    if (positions[index]! & bit) this.recursiveReadCount++
    else positions[index]! |= bit
  },
}

/** @internal */
export function create(
  bytes: Bytes,
  { recursiveReadLimit = 8_192 }: create.Config = {},
): Cursor {
  const cursor: Cursor = Object.create(staticCursor)
  cursor.bytes = bytes
  cursor._dataView = undefined
  cursor.readPositions = undefined
  cursor.recursiveReadLimit = recursiveReadLimit
  // A well-formed payload reads each byte once. Allow twice that, plus as many
  // bytes as `recursiveReadLimit` repeated 32-byte reads, so that offsets
  // pointing many times at one region cannot make the decoded output many
  // times larger than the data.
  cursor.readSizeLimit = 2 * bytes.length + 32 * recursiveReadLimit
  return cursor
}

/** @internal */
export declare namespace create {
  type Config = { recursiveReadLimit?: number | undefined }

  type ErrorType = Errors.GlobalErrorType
}

/** @internal */
export class NegativeOffsetError extends Errors.BaseError {
  override readonly name = 'Cursor.NegativeOffsetError'

  constructor({ offset }: { offset: number }) {
    super(`Offset \`${offset}\` cannot be negative.`)
  }
}

/** @internal */
export class PositionOutOfBoundsError extends Errors.BaseError {
  override readonly name = 'Cursor.PositionOutOfBoundsError'

  constructor({ length, position }: { length: number; position: number }) {
    super(
      `Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`,
    )
  }
}

/** @internal */
export class ReadSizeLimitExceededError extends Errors.BaseError {
  override readonly name = 'Cursor.ReadSizeLimitExceededError'

  constructor({ limit, size }: { limit: number; size: number }) {
    super(
      `Read size limit of \`${limit}\` bytes exceeded (read size: \`${size}\` bytes).`,
    )
  }
}

/** @internal */
export class RecursiveReadLimitExceededError extends Errors.BaseError {
  override readonly name = 'Cursor.RecursiveReadLimitExceededError'

  constructor({ count, limit }: { count: number; limit: number }) {
    super(
      `Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`,
    )
  }
}
