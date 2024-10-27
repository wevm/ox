import type * as Errors from '../../Errors.js'
import { AbiItem_from } from '../AbiItem/from.js'
import type {
  AbiConstructor,
  AbiConstructor_Signature,
  AbiConstructor_Signatures,
} from './types.js'

/**
 * Parses an arbitrary **JSON ABI Constructor** or **Human Readable ABI Constructor** into a typed {@link ox#AbiConstructor.AbiConstructor}.
 *
 * @example
 * ### JSON ABIs
 *
 * ```ts twoslash
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from({
 *   inputs: [
 *     { name: 'owner', type: 'address' },
 *   ],
 *   payable: false,
 *   stateMutability: 'nonpayable',
 *   type: 'constructor',
 * })
 *
 * constructor
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
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from(
 *   'constructor(address owner)' // [!code hl]
 * )
 *
 * constructor
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
 * import { AbiConstructor } from 'ox'
 *
 * const constructor = AbiConstructor.from([
 *   'struct Foo { address owner; uint256 amount; }', // [!code hl]
 *   'constructor(Foo foo)',
 * ])
 *
 * constructor
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
 * @param abiConstructor - The ABI Constructor to parse.
 * @returns Typed ABI Constructor.
 */
export function AbiConstructor_from<
  const abiConstructor extends AbiConstructor | string | readonly string[],
>(
  abiConstructor: (
    | abiConstructor
    | AbiConstructor
    | string
    | readonly string[]
  ) &
    (
      | (abiConstructor extends string
          ? AbiConstructor_Signature<abiConstructor>
          : never)
      | (abiConstructor extends readonly string[]
          ? AbiConstructor_Signatures<abiConstructor>
          : never)
      | AbiConstructor
    ),
): AbiConstructor_from.ReturnType<abiConstructor> {
  return AbiItem_from(abiConstructor as AbiConstructor) as never
}

export declare namespace AbiConstructor_from {
  type ReturnType<
    abiConstructor extends AbiConstructor | string | readonly string[],
  > = AbiItem_from.ReturnType<abiConstructor>

  type ErrorType = AbiItem_from.ErrorType | Errors.GlobalErrorType
}

AbiConstructor_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiConstructor_from.ErrorType
