import {
  type Abi,
  type AbiParameter,
  formatAbiItem,
  formatAbiParameters,
} from 'abitype'
import { normalizeSignature } from '../abi/getSignature.js'
import { size } from '../hex/size.js'
import type { Hex } from '../types/data.js'
import { BaseError } from './base.js'

export class AbiDecodingDataSizeTooSmallError extends BaseError {
  override readonly name = 'AbiDecodingDataSizeTooSmallError'
  constructor({
    data,
    parameters,
    size,
  }: { data: Hex; parameters: readonly AbiParameter[]; size: number }) {
    super(`Data size of ${size} bytes is too small for given parameters.`, {
      metaMessages: [
        `Params: (${formatAbiParameters(parameters as readonly [AbiParameter])})`,
        `Data:   ${data} (${size} bytes)`,
      ],
    })
  }
}

export class AbiDecodingZeroDataError extends BaseError {
  override readonly name = 'AbiDecodingZeroDataError'
  constructor() {
    super('Cannot decode zero data ("0x") with ABI parameters.')
  }
}

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
        'ABI encoding parameters/values length mismatch.',
        `Expected length (parameters): ${expectedLength}`,
        `Given length (values): ${givenLength}`,
      ].join('\n'),
      {
        docsPath: '/errors#abiencodinglengthmismatcherror',
      },
    )
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

export class InvalidAbiTypeError extends BaseError {
  override readonly name = 'InvalidAbiTypeError'
  constructor(type: string) {
    super(`Type \`${type}\` is not a valid ABI Type.`, {
      docsPath: '/errors#invalidabitypeerror',
    })
  }
}
