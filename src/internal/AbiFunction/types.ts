import type {
  AbiStateMutability,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  AbiFunction as abitype_AbiFunction,
} from 'abitype'
import type { Hex } from '../../Hex.js'
import type { Abi } from '../Abi/types.js'
import type {
  IsFunctionSignature,
  IsStructSignature,
} from '../AbiItem/types.js'
import type { TypeErrorMessage } from '../types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with a `function` type. */
export type AbiFunction = abitype_AbiFunction & {
  hash?: Hex | undefined
  overloads?: readonly AbiFunction[] | undefined
}

/**
 * Extracts an {@link ox#AbiFunction.AbiFunction} item from an {@link ox#Abi.Abi}, given a name.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo(string)',
 *   'function bar(uint256)',
 * ])
 *
 * type Foo = AbiFunction.Extract<typeof abi, 'foo'>
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
export type AbiFunction_Extract<
  abi extends Abi,
  name extends AbiFunction_ExtractNames<abi>,
> = ExtractAbiFunction<abi, name>

/**
 * Extracts the names of all {@link ox#AbiFunction.AbiFunction} items in an {@link ox#Abi.Abi}.
 *
 * @example
 * ```ts twoslash
 * import { Abi, AbiFunction } from 'ox'
 *
 * const abi = Abi.from([
 *   'function foo(string)',
 *   'function bar(uint256)',
 * ])
 *
 * type names = AbiFunction.Name<typeof abi>
 * //   ^?
 *
 *
 * ```
 */
export type AbiFunction_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiFunction_ExtractNames<abi> : string

export type AbiFunction_ExtractNames<
  abi extends Abi,
  abiStateMutability extends AbiStateMutability = AbiStateMutability,
> = ExtractAbiFunctionNames<abi, abiStateMutability>

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiFunction_IsSignature<signature extends string> =
  | (IsFunctionSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiFunction_Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = AbiFunction_IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type AbiFunction_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiFunction_Signature<signatures[key], key>
}
