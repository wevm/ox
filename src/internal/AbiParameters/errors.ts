import { type AbiParameter, formatAbiParameters } from 'abitype'
import { BaseError } from '../Errors/base.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

export class AbiParameters_DataSizeTooSmallError extends BaseError {
  override readonly name = 'AbiParameters.DataSizeTooSmallError'
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

export class AbiParameters_ZeroDataError extends BaseError {
  override readonly name = 'AbiParameters.ZeroDataError'
  constructor() {
    super('Cannot decode zero data ("0x") with ABI parameters.')
  }
}

/**
 * The length of the array value does not match the length specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from('uint256[3]'), [[69n, 420n]])
 * //                                               ↑ expected: 3  ↑ ❌ length: 2
 * // @error: AbiParameters.ArrayLengthMismatchError: ABI encoding array length mismatch
 * // @error: for type `uint256[3]`. Expected: `3`. Given: `2`.
 * ```
 *
 * ### Solution
 *
 * Pass an array of the correct length.
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from(['uint256[3]']), [[69n, 420n, 69n]])
 * //                                   ↑ ✅ length: 3
 * ```
 */
export class AbiParameters_ArrayLengthMismatchError extends BaseError {
  override readonly name = 'AbiParameters.ArrayLengthMismatchError'
  constructor({
    expectedLength,
    givenLength,
    type,
  }: { expectedLength: number; givenLength: number; type: string }) {
    super(
      `Array length mismatch for type \`${type}\`. Expected: \`${expectedLength}\`. Given: \`${givenLength}\`.`,
      {
        docsPath: '/errors#abiparametersarraylengthmismatcherror',
      },
    )
  }
}

/**
 * The size of the bytes value does not match the size specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from('bytes8'), [['0xdeadbeefdeadbeefdeadbeef']])
 * //                                            ↑ expected: 8 bytes  ↑ ❌ size: 12 bytes
 * // @error: AbiParameters_BytesSizeMismatchError: Size of bytes "0xdeadbeefdeadbeefdeadbeef"
 * // @error: (bytes12) does not match expected size (bytes8).
 * ```
 *
 * ### Solution
 *
 * Pass a bytes value of the correct size.
 *
 * ```ts twoslash
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from(['bytes8']), ['0xdeadbeefdeadbeef'])
 * //                                                       ↑ ✅ size: 8 bytes
 * ```
 */
export class AbiParameters_BytesSizeMismatchError extends BaseError {
  override readonly name = 'AbiParameters.BytesSizeMismatchError'
  constructor({ expectedSize, value }: { expectedSize: number; value: Hex }) {
    super(
      `Size of bytes "${value}" (bytes${Hex_size(
        value,
      )}) does not match expected size (bytes${expectedSize}).`,
      {
        docsPath: '/errors#abiparametersbytessizemismatcherror',
      },
    )
  }
}

/**
 * The length of the values to encode does not match the length of the ABI parameters.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from(['string', 'uint256']), ['hello'])
 * // @error: AbiParameters_LengthMismatchError: ABI encoding params/values length mismatch.
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
export class AbiParameters_LengthMismatchError extends BaseError {
  override readonly name = 'AbiParameters.LengthMismatchError'
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
        docsPath: '/errors#abiparameterslengthmismatcherror',
      },
    )
  }
}

/**
 * The value provided is not a valid array as specified in the corresponding ABI parameter.
 *
 * ### Example
 *
 * ```ts twoslash
 * // @noErrors
 * import { AbiParameters } from 'ox'
 * // ---cut---
 * AbiParameters.encode(AbiParameters.from(['uint256[3]']), [69])
 * ```
 *
 * ### Solution
 *
 * Pass an array value.
 */
export class AbiParameters_InvalidArrayError extends BaseError {
  override readonly name = 'AbiParameters.InvalidArrayError'
  constructor(value: unknown) {
    super(`Value \`${value}\` is not a valid array.`, {
      docsPath: '/errors#abiparametersinvalidarrayerror',
    })
  }
}

export class AbiParameters_InvalidTypeError extends BaseError {
  override readonly name = 'AbiParameters.InvalidTypeError'
  constructor(type: string) {
    super(`Type \`${type}\` is not a valid ABI Type.`, {
      docsPath: '/errors#abiparametersinvalidtypeerror',
    })
  }
}
