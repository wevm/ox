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
   * Positions read so far, so a repeated read can be counted. Word-aligned
   * positions, where ABI data is read, go in a bit set with one bit per 32
   * bytes; other positions go in a set. Both are allocated on first use.
   */
  alignedReads: Uint8Array | undefined
  unalignedReads: Set<number> | undefined
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
  alignedReads: undefined,
  unalignedReads: undefined,
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
    // V8 keeps typed arrays of up to 64 bytes on its heap, and a view of one
    // first moves it to an ArrayBuffer of its own, which costs far more than
    // copying the bytes.
    return this.bytes.length <= 64
      ? this.bytes.slice(position, position + length)
      : this.bytes.subarray(position, position + length)
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
    const { position } = this
    if (position % 32 !== 0 || position > this.bytes.length) {
      const reads = (this.unalignedReads ??= new Set())
      if (reads.has(position)) this.recursiveReadCount++
      else reads.add(position)
      return
    }
    // One bit per 32-byte word, so the set is 1/256 the size of the data. It
    // is sized from the data's length at the time of the read, so a resizable
    // buffer that grows while decoding still has every read counted.
    const word = position / 32
    const index = Math.floor(word / 8)
    let reads = this.alignedReads
    if (!reads || index >= reads.length) {
      const grown = new Uint8Array(
        Math.max(Math.floor(this.bytes.length / 256) + 1, index + 1),
      )
      if (reads) grown.set(reads)
      reads = this.alignedReads = grown
    }
    const bit = 1 << (word & 7)
    if (reads[index]! & bit) this.recursiveReadCount++
    else reads[index]! |= bit
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
  cursor.alignedReads = undefined
  cursor.unalignedReads = undefined
  cursor.recursiveReadLimit = recursiveReadLimit
  // A well-formed payload reads each byte once. Allow twice that, plus as many
  // bytes as `recursiveReadLimit` repeated 32-byte reads (256 KiB by default),
  // so that offsets pointing many times at one region can add at most that
  // fixed amount to the decoded output, whatever the size of the data.
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
