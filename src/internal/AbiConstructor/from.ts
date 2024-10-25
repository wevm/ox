import type * as Errors from '../../Errors.js'
import { AbiItem_from } from '../AbiItem/from.js'
import type { AbiConstructor, Signature, Signatures } from './types.js'

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
export function from<
  const abiConstructor extends AbiConstructor | string | readonly string[],
>(
  abiConstructor: (
    | abiConstructor
    | AbiConstructor
    | string
    | readonly string[]
  ) &
    (
      | (abiConstructor extends string ? Signature<abiConstructor> : never)
      | (abiConstructor extends readonly string[]
          ? Signatures<abiConstructor>
          : never)
      | AbiConstructor
    ),
): from.ReturnType<abiConstructor> {
  return AbiItem_from(abiConstructor as AbiConstructor) as never
}

export declare namespace from {
  type ReturnType<
    abiConstructor extends AbiConstructor | string | readonly string[],
  > = AbiItem_from.ReturnType<abiConstructor>

  type ErrorType = AbiItem_from.ErrorType | Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType
