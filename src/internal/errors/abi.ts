import { type Abi, formatAbiItem } from 'abitype'
import { normalizeSignature } from '../abi/getSignature.js'
import { size } from '../data/size.js'
import type { Hex } from '../types/data.js'
import { BaseError } from './base.js'

export class AbiEncodingArrayLengthMismatchError extends BaseError {
  override readonly name = 'AbiEncodingArrayLengthMismatchError'
  constructor({
    expectedLength,
    givenLength,
    type,
  }: { expectedLength: number; givenLength: number; type: string }) {
    super(
      `ABI encoding array length mismatch for type \`${type}\`. Expected: \`${expectedLength}\`. Given: \`${givenLength}\`.`,
      {
        docsPath: '/errors#abiencodingarraylengthmismatcherror',
      },
    )
  }
}

export class AbiEncodingBytesSizeMismatchError extends BaseError {
  override readonly name = 'AbiEncodingBytesSizeMismatchError'
  constructor({ expectedSize, value }: { expectedSize: number; value: Hex }) {
    super(
      `Size of bytes "${value}" (bytes${size(
        value,
      )}) does not match expected size (bytes${expectedSize}).`,
      {
        docsPath: '/errors#abiencodingbytessizemismatcherror',
      },
    )
  }
}

export class AbiEncodingLengthMismatchError extends BaseError {
  override readonly name = 'AbiEncodingLengthMismatchError'
  constructor({
    expectedLength,
    givenLength,
  }: { expectedLength: number; givenLength: number }) {
    super(
      [
        'ABI encoding params/values length mismatch.',
        `Expected length (params): ${expectedLength}`,
        `Given length (values): ${givenLength}`,
      ].join('\n'),
      {
        docsPath: '/errors#abiencodinglengthmismatcherror',
      },
    )
  }
}

export class AbiEncodingInvalidTypeError extends BaseError {
  override readonly name = 'AbiEncodingInvalidTypeError'
  constructor(type: string) {
    super(`Type \`${type}\` is not a valid encoding type.`, {
      docsPath: '/errors#abiencodinginvalidtypeerror',
    })
  }
}

export class AbiEncodingInvalidArrayError extends BaseError {
  override readonly name = 'AbiEncodingInvalidArrayError'
  constructor(value: unknown) {
    super(`Value \`${value}\` is not a valid array.`, {
      docsPath: '/errors#abiencodinginvalidarrayerror',
    })
  }
}

export class AbiItemAmbiguityError extends BaseError {
  override readonly name = 'AbiItemAmbiguityError'
  constructor(
    x: { abiItem: Abi[number]; type: string },
    y: { abiItem: Abi[number]; type: string },
  ) {
    super('Found ambiguous types in overloaded ABI items.', {
      docsPath: '/errors#abiitemambiguityerror',
      metaMessages: [
        // TODO: abitype to add support for signature-formatted ABI items.
        `\`${x.type}\` in \`${normalizeSignature(formatAbiItem(x.abiItem))}\`, and`,
        `\`${y.type}\` in \`${normalizeSignature(formatAbiItem(y.abiItem))}\``,
        '',
        'These types encode differently and cannot be distinguished at runtime.',
        'Remove one of the ambiguous items in the ABI.',
      ],
    })
  }
}
