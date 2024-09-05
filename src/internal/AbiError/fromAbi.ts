import type { Abi } from '../Abi/types.js'
import { AbiItemNotFoundError } from '../AbiItem/errors.js'
import { AbiItem_fromAbi } from '../AbiItem/fromAbi.js'
import type { AbiItem_ExtractArgs } from '../AbiItem/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_isHex } from '../Hex/isHex.js'
import { Hex_slice } from '../Hex/slice.js'
import type { IsNarrowable, IsNever } from '../types.js'
import {
  AbiError_solidityError,
  AbiError_solidityErrorSelector,
  AbiError_solidityPanic,
  AbiError_solidityPanicSelector,
} from './constants.js'
import type { AbiError, AbiError_Name } from './types.js'

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
 * const item = AbiError.fromAbi(abi, { name: 'BadSignatureV' }) // [!code focus]
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
 * ABI Errors can be extract by their selector when {@link Hex.Hex} is provided to `name`.
 *
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo()',
 *   'error BadSignatureV(uint8 v)',
 *   'function bar(string a) returns (uint256 x)',
 * ])
 * const item = AbiError.fromAbi(abi, { name: '0x095ea7b3' }) // [!code focus]
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
 * @param options - Extraction options.
 * @returns The ABI item.
 */
export function AbiError_fromAbi<
  const abi extends Abi | readonly unknown[],
  name extends AbiError_Name<abi>,
  const args extends AbiItem_ExtractArgs<abi, name> | undefined = undefined,
>(
  abi: abi | Abi | readonly unknown[],
  options: AbiItem_fromAbi.Options<
    abi,
    name,
    args,
    AbiItem_ExtractArgs<abi, name>,
    AbiError_Name<abi>
  >,
): AbiError_fromAbi.ReturnType<abi, name, args> {
  const { name } = options

  if (name === 'Error') return AbiError_solidityError as never
  if (name === 'Panic') return AbiError_solidityPanic as never
  if (Hex_isHex(name, { strict: false })) {
    const selector = Hex_slice(name, 0, 4)
    if (selector === AbiError_solidityErrorSelector)
      return AbiError_solidityError as never
    if (selector === AbiError_solidityPanicSelector)
      return AbiError_solidityPanic as never
  }

  const item = AbiItem_fromAbi(abi, options as any)
  if (item.type !== 'error')
    throw new AbiItemNotFoundError({ ...options, type: 'error' })
  return item as never
}

export declare namespace AbiError_fromAbi {
  type ReturnType<
    abi extends Abi | readonly unknown[] = Abi,
    name extends AbiError_Name<abi> = AbiError_Name<abi>,
    args extends
      | AbiItem_ExtractArgs<abi, name>
      | undefined = AbiItem_ExtractArgs<abi, name>,
  > = IsNarrowable<name, AbiError_Name<abi>> extends true
    ?
        | (name extends 'Error' ? typeof AbiError_solidityError : never)
        | (name extends 'Panic'
            ? typeof AbiError_solidityPanic
            : never) extends infer result
      ? IsNever<result> extends true
        ? AbiItem_fromAbi.ReturnType<abi, name, args, AbiError>
        : result
      : never
    :
        | AbiItem_fromAbi.ReturnType<abi, name, args, AbiError>
        | typeof AbiError_solidityError
        | typeof AbiError_solidityPanic

  type ErrorType = AbiItem_fromAbi.ErrorType | GlobalErrorType
}

AbiError_fromAbi.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AbiError_fromAbi.ErrorType
