import { AbiItem_from } from '../AbiItem/from.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type {
  AbiError,
  AbiError_Signature,
  AbiError_Signatures,
} from './types.js'

/**
 * Parses an arbitrary **JSON ABI Error** or **Human Readable ABI Error** into a typed {@link AbiError#AbiError}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const badSignatureVError = AbiError.from({
 *   inputs: [{ name: 'v', type: 'uint8' }],
 *   name: 'BadSignatureV',
 *   type: 'error',
 * })
 *
 * badSignatureVError
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Human Readable ABIs
 *
 * A Human Readable ABI can be parsed into a typed ABI object:
 *
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const badSignatureVError = AbiError.from(
 *   'error BadSignatureV(uint8 v)' // [!code hl]
 * )
 *
 * badSignatureVError
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * It is possible to specify `struct`s along with your definitions:
 *
 * ```ts twoslash
 * import { AbiError } from 'ox'
 *
 * const badSignatureVError = AbiError.from([
 *   'struct Signature { uint8 v; }', // [!code hl]
 *   'error BadSignatureV(Signature signature)',
 * ])
 *
 * badSignatureVError
 * //^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 *
 *
 *
 * @param abiError - The ABI Error to parse.
 * @returns Typed ABI Error.
 */
export function AbiError_from<
  const abiError extends AbiError | string | readonly string[],
>(
  abiError: (abiError | AbiError | string | readonly string[]) &
    (
      | (abiError extends string ? AbiError_Signature<abiError> : never)
      | (abiError extends readonly string[]
          ? AbiError_Signatures<abiError>
          : never)
      | AbiError
    ),
  options: AbiError_from.Options = {},
): AbiError_from.ReturnType<abiError> {
  return AbiItem_from(abiError as AbiError, options) as never
}

export declare namespace AbiError_from {
  type Options = {
    /**
     * Whether or not to prepare the extracted function (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<abiError extends AbiError | string | readonly string[]> =
    AbiItem_from.ReturnType<abiError>

  type ErrorType = AbiItem_from.ErrorType | GlobalErrorType
}

AbiError_from.parseError = (error: unknown) =>
  /** v8 ignore next */
  error as AbiError_from.ErrorType
