import type { Bytes, Hex } from '../types/data.js'
import { BaseError } from './base.js'

export type IntegerOutOfRangeErrorType = IntegerOutOfRangeError & {
  name: 'IntegerOutOfRangeError'
}
export class IntegerOutOfRangeError extends BaseError {
  constructor({
    max,
    min,
    signed,
    size,
    value,
  }: {
    max?: string | undefined
    min: string
    signed?: boolean | undefined
    size?: number | undefined
    value: string
  }) {
    super(
      `Number "${value}" is not in safe ${
        size ? `${size * 8}-bit ${signed ? 'signed' : 'unsigned'} ` : ''
      }integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`,
      { name: 'IntegerOutOfRangeError' },
    )
  }
}

export type InvalidBytesBooleanErrorType = InvalidBytesBooleanError & {
  name: 'InvalidBytesBooleanError'
}
export class InvalidBytesBooleanError extends BaseError {
  constructor(bytes: Bytes) {
    super(
      `Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`,
      {
        name: 'InvalidBytesBooleanError',
      },
    )
  }
}

export type InvalidHexBooleanErrorType = InvalidHexBooleanError & {
  name: 'InvalidHexBooleanError'
}
export class InvalidHexBooleanError extends BaseError {
  constructor(hex: Hex) {
    super(
      `Hex value "${hex}" is not a valid boolean. The hex value must be "0x0" (false) or "0x1" (true).`,
      { name: 'InvalidHexBooleanError' },
    )
  }
}

export type InvalidHexValueErrorType = InvalidHexValueError & {
  name: 'InvalidHexValueError'
}
export class InvalidHexValueError extends BaseError {
  constructor(value: Hex) {
    super(
      `Hex value "${value}" is an odd length (${value.length}). It must be an even length.`,
      {
        name: 'InvalidHexValueError',
      },
    )
  }
}

export type InvalidTypeErrorType = InvalidTypeError & {
  name: 'InvalidTypeError'
}
export class InvalidTypeError extends BaseError {
  constructor(type: string) {
    super(`Type "${type}" is invalid.`, { name: 'InvalidTypeError' })
  }
}

export type SizeOverflowErrorType = SizeOverflowError & {
  name: 'SizeOverflowError'
}
export class SizeOverflowError extends BaseError {
  constructor({ givenSize, maxSize }: { givenSize: number; maxSize: number }) {
    super(
      `Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`,
      {
        name: 'SizeOverflowError',
      },
    )
  }
}

export type SliceOffsetOutOfBoundsErrorType = SliceOffsetOutOfBoundsError & {
  name: 'SliceOffsetOutOfBoundsError'
}
export class SliceOffsetOutOfBoundsError extends BaseError {
  constructor({
    offset,
    position,
    size,
  }: { offset: number; position: 'start' | 'end'; size: number }) {
    super(
      `Slice ${
        position === 'start' ? 'starting' : 'ending'
      } at offset "${offset}" is out-of-bounds (size: ${size}).`,
      { name: 'SliceOffsetOutOfBoundsError' },
    )
  }
}

export type SizeExceedsPaddingSizeErrorType = SizeExceedsPaddingSizeError & {
  name: 'SizeExceedsPaddingSizeError'
}
export class SizeExceedsPaddingSizeError extends BaseError {
  constructor({
    size,
    targetSize,
    type,
  }: {
    size: number
    targetSize: number
    type: 'hex' | 'bytes'
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} size (${size}) exceeds padding size (${targetSize}).`,
      { name: 'SizeExceedsPaddingSizeError' },
    )
  }
}
