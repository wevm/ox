import type {
  ExtractAbiError,
  ExtractAbiErrorNames,
  AbiError as abitype_AbiError,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type { IsErrorSignature, IsStructSignature } from '../AbiItem/types.js'
import type { Hex } from '../Hex/types.js'
import type { TypeErrorMessage } from '../types.js'

export type AbiError = abitype_AbiError & {
  hash?: Hex | undefined
  overloads?: readonly AbiError[] | undefined
}

export type AbiError_Extract<
  abi extends Abi,
  name extends AbiError_ExtractNames<abi>,
> = ExtractAbiError<abi, name>

export type AbiError_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiError_ExtractNames<abi> : string

export type AbiError_ExtractNames<abi extends Abi> = ExtractAbiErrorNames<abi>

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
