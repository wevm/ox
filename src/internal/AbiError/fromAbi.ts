import * as AbiError from '../../AbiError.js'
import type { Abi } from '../Abi/types.js'
import { AbiItem_NotFoundError } from '../AbiItem/errors.js'
import { AbiItem_fromAbi } from '../AbiItem/fromAbi.js'
import type { AbiItem_ExtractArgs } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_slice } from '../Hex/slice.js'
import type { Hex } from '../Hex/types.js'
import { Hex_validate } from '../Hex/validate.js'
import type { IsNarrowable, IsNever } from '../types.js'

/**
 * Extracts an {@link ox#AbiError.AbiError} from an {@link ox#Abi.Abi} given a name and optional arguments.
 *
 * @example
 * ### Extracting by Name
 *
 * ABI Errors can be extracted by their name using the `name` option:
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 *
 * const item = AbiError.fromAbi(abi, 'BadSignatureV') // [!code focus]
 * //    ^?
 *
 *
 *
 *
 *
 *
 * ```
 *
 * @example
 * ### Extracting by Selector
 *
 * ABI Errors can be extract by their selector when {@link ox#Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiError.fromAbi(abi, '0x095ea7b3') // [!code focus]
 * //    ^?
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
 * :::note
 *
 * Extracting via a hex selector is useful when extracting an ABI Error from JSON-RPC error data.
 *
 * :::
 *
 * @param abi - The ABI to extract from.
 * @param name - The name (or selector) of the ABI item to extract.
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function fromAbi<
  const abi extends Abi | readonly unknown[],
  name extends AbiError.Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
  //
  allNames = AbiError.Name<abi>,
>(
  abi: abi | Abi | readonly unknown[],
  name: Hex | (name extends allNames ? name : never),
  options?: AbiItem_fromAbi.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>
  >,
): fromAbi.ReturnType<abi, name, args> {
  if (name === 'Error') return AbiError.solidityError as never
  if (name === 'Panic') return AbiError.solidityPanic as never
  if (Hex_validate(name, { strict: false })) {
    const selector = Hex_slice(name, 0, 4)
    if (selector === AbiError.solidityErrorSelector)
      return AbiError.solidityError as never
    if (selector === AbiError.solidityPanicSelector)
      return AbiError.solidityPanic as never
  }

  const item = AbiItem_fromAbi(abi, name, options as any)
  if (item.type !== 'error')
    throw new AbiItem_NotFoundError({ name, type: 'error' })
  return item as never
}

export declare namespace fromAbi {
  type ReturnType<
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiError.Name<abi> = AbiError.Name<abi>,
    args extends
      | AbiItem_ExtractArgs<abi, name>
      | undefined = AbiItem_ExtractArgs<abi, name>,
  > = IsNarrowable<name, AbiError.Name<abi>> extends true
    ?
        | (name extends 'Error' ? typeof AbiError.solidityError : never)
        | (name extends 'Panic'
            ? typeof AbiError.solidityPanic
            : never) extends infer result
      ? IsNever<result> extends true
        ? AbiItem_fromAbi.ReturnType<abi, name, args, AbiError.AbiError>
        : result
      : never
    :
        | AbiItem_fromAbi.ReturnType<abi, name, args, AbiError.AbiError>
        | typeof AbiError.solidityError
        | typeof AbiError.solidityPanic

  type ErrorType = AbiItem_fromAbi.ErrorType | GlobalErrorType
}

fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as fromAbi.ErrorType
