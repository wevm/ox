import {
  type Abi,
  type AbiParameter,
  formatAbiItem,
  formatAbiParameters,
} from 'abitype'
import { BaseError } from '../errors/base.js'
import { Hex_size } from '../hex/size.js'
import type { Hex } from '../hex/types.js'
import { normalizeSignature } from './getSignature.js'

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

/**
 * ### Why?
 *
 * The length of the array value does not match the length specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['uint256[3]'], [[69n, 420n]])
 * //                             ↑ expected: 3  ↑ ❌ length: 2
 * // @error: AbiEncodingArrayLengthMismatchError: ABI encoding array length mismatch
 * // @error: for type `uint256[3]`. Expected: `3`. Given: `2`.
 * ```
 *
 * ### Solution
 *
 * Pass an array of the correct length.
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['uint256[3]'], [[69n, 420n, 69n]])
 * //                           ↑ ✅ length: 3
 * ```
 */
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

/**
 * ### Why?
 *
 * The size of the bytes value does not match the size specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['bytes8'], [['0xdeadbeefdeadbeefdeadbeef']])
 * //                          ↑ expected: 8 bytes  ↑ ❌ size: 12 bytes
 * // @error: AbiEncodingBytesSizeMismatchError: Size of bytes "0xdeadbeefdeadbeefdeadbeef"
 * // @error: (bytes12) does not match expected size (bytes8).
 * ```
 *
 * ### Solution
 *
 * Pass a bytes value of the correct size.
 *
 * ```ts twoslash
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['bytes8'], ['0xdeadbeefdeadbeef'])
 * //                        ↑ ✅ size: 8 bytes
 * ```
 */
export class AbiEncodingBytesSizeMismatchError extends BaseError {
  override readonly name = 'AbiEncodingBytesSizeMismatchError'
  constructor({ expectedSize, value }: { expectedSize: number; value: Hex }) {
    super(
      `Size of bytes "${value}" (bytes${Hex_size(
        value,
      )}) does not match expected size (bytes${expectedSize}).`,
      {
        docsPath: '/errors#abiencodingbytessizemismatcherror',
      },
    )
  }
}

/**
 * ### Why?
 *
 * The length of the values to encode does not match the length of the ABI parameters.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['string', 'uint256'], ['hello'])
 * // @error: AbiEncodingLengthMismatchError: ABI encoding params/values length mismatch.
 * // @error: Expected length (params): 2
 * // @error: Given length (values): 1
 * ```
 *
 * ### Solution
 *
 * Pass the correct number of values to encode.
 *
 * ### Solution
 *
 * Pass a [valid ABI type](https://docs.soliditylang.org/en/develop/abi-spec.html#types).
 */
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

/**
 * ### Why?
 *
 * The value provided is not a valid array as specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { Abi } from 'ox'
 * // ---cut---
 * Abi.encodeParameters(['uint256[3]'], [69])
 * ```
 *
 * ### Solution
 *
 * Pass an array value.
 */
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
