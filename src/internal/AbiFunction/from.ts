import * as AbiItem from '../../AbiItem.js'
import type * as Errors from '../../Errors.js'
import type {
  AbiFunction,
  AbiFunction_Signature,
  AbiFunction_Signatures,
} from './types.js'

/**
 * Parses an arbitrary **JSON ABI Function** or **Human Readable ABI Function** into a typed {@link ox#AbiFunction.AbiFunction}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from({
 *   type: 'function',
 *   name: 'approve',
 *   stateMutability: 'nonpayable',
 *   inputs: [
 *     {
 *       name: 'spender',
 *       type: 'address',
 *     },
 *     {
 *       name: 'amount',
 *       type: 'uint256',
 *     },
 *   ],
 *   outputs: [{ type: 'bool' }],
 * })
 *
 * approve
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
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from(
 *   'function approve(address spender, uint256 amount) returns (bool)' // [!code hl]
 * )
 *
 * approve
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
 * import { AbiFunction } from 'ox'
 *
 * const approve = AbiFunction.from([
 *   'struct Foo { address spender; uint256 amount; }', // [!code hl]
 *   'function approve(Foo foo) returns (bool)',
 * ])
 *
 * approve
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
 * @param abiFunction - The ABI Function to parse.
 * @returns Typed ABI Function.
 */
export function AbiFunction_from<
  const abiFunction extends AbiFunction | string | readonly string[],
>(
  abiFunction: (abiFunction | AbiFunction | string | readonly string[]) &
    (
      | (abiFunction extends string
          ? AbiFunction_Signature<abiFunction>
          : never)
      | (abiFunction extends readonly string[]
          ? AbiFunction_Signatures<abiFunction>
          : never)
      | AbiFunction
    ),
  options: AbiFunction_from.Options = {},
): AbiFunction_from.ReturnType<abiFunction> {
  return AbiItem.from(abiFunction as AbiFunction, options) as never
}

export declare namespace AbiFunction_from {
  type Options = {
    /**
     * Whether or not to prepare the extracted function (optimization for encoding performance).
     * When `true`, the `hash` property is computed and included in the returned value.
     *
     * @default true
     */
    prepare?: boolean | undefined
  }

  type ReturnType<
    abiFunction extends AbiFunction | string | readonly string[],
  > = AbiItem.from.ReturnType<abiFunction>

  type ErrorType = AbiItem.from.ErrorType | Errors.GlobalErrorType
}

AbiFunction_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiFunction_from.ErrorType
