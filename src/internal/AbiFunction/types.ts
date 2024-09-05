import type {
  AbiStateMutability,
  ExtractAbiFunction,
  ExtractAbiFunctionNames,
  AbiFunction as abitype_AbiFunction,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type {
  IsFunctionSignature,
  IsStructSignature,
} from '../AbiItem/types.js'
import type { Hex } from '../Hex/types.js'
import type { TypeErrorMessage } from '../types.js'

export type AbiFunction = abitype_AbiFunction & {
  hash?: Hex | undefined
  overloads?: readonly AbiFunction[] | undefined
}

export type AbiFunction_Extract<
  abi extends Abi,
  name extends AbiFunction_ExtractNames<abi>,
> = ExtractAbiFunction<abi, name>

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
