import type {
  ExtractAbiError,
  ExtractAbiErrorNames,
  AbiError as abitype_AbiError,
} from 'abitype'
import type { Hex } from '../../Hex.js'
import type { Abi } from '../Abi/types.js'
import type { IsErrorSignature, IsStructSignature } from '../AbiItem/types.js'
import type { TypeErrorMessage } from '../types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with an `error` type. */
export type AbiError = abitype_AbiError & {
  hash?: Hex | undefined
  overloads?: readonly AbiError[] | undefined
}

/**
 * Extracts an {@link ox#AbiError.AbiError} item from an {@link ox#Abi.Abi}, given a name.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'error Foo(string)',
 *   'error Bar(uint256)',
 * ])
 *
 * type Foo = AbiError.Extract<typeof abi, 'Foo'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type AbiError_Extract<
  abi extends Abi,
  name extends AbiError_ExtractNames<abi>,
> = ExtractAbiError<abi, name>

/**
 * Extracts the names of all {@link ox#AbiError.AbiError} items in an {@link ox#Abi.Abi}.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiError } from 'ox'
 *
 * const abi = Abi.from([
 *   'error Foo(string)',
 *   'error Bar(uint256)',
 * ])
 *
 * type names = AbiError.Name<typeof abi>
 * //   ^?
 * ```
 */
export type AbiError_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiError_ExtractNames<abi> : string

export type AbiError_ExtractNames<abi extends Abi> =
  | ExtractAbiErrorNames<abi>
  | 'Panic'
  | 'Error'

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiError_IsSignature<signature extends string> =
  | (IsErrorSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiError_Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = AbiError_IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type AbiError_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiError_Signature<signatures[key], key>
}
