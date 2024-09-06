import type {
  ExtractAbiEvent,
  ExtractAbiEventNames,
  AbiEvent as abitype_AbiEvent,
} from 'abitype'
import type { Abi } from '../Abi/types.js'
import type { IsEventSignature, IsStructSignature } from '../AbiItem/types.js'
import type { Hex } from '../Hex/types.js'
import type { TypeErrorMessage } from '../types.js'

export type AbiEvent = abitype_AbiEvent & {
  hash?: Hex | undefined
  overloads?: readonly AbiEvent[] | undefined
}

export type AbiEvent_Extract<
  abi extends Abi,
  name extends AbiEvent_ExtractNames<abi>,
> = ExtractAbiEvent<abi, name>

export type AbiEvent_Name<abi extends Abi | readonly unknown[] = Abi> =
  abi extends Abi ? AbiEvent_ExtractNames<abi> : string

export type AbiEvent_ExtractNames<abi extends Abi> = ExtractAbiEventNames<abi>

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiEvent_IsSignature<signature extends string> =
  | (IsEventSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiEvent_Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = AbiEvent_IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type AbiEvent_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiEvent_Signature<signatures[key], key>
}
