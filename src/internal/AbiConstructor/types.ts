import type { AbiConstructor as abitype_AbiConstructor } from 'abitype'
import type * as AbiItem_internal from '../abiItem.js'
import type { TypeErrorMessage } from '../types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with a `constructor` type. */
export type AbiConstructor = abitype_AbiConstructor

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type AbiConstructor_IsSignature<signature extends string> =
  | (AbiItem_internal.IsConstructorSignature<signature> extends true
      ? true
      : never)
  | (AbiItem_internal.IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type AbiConstructor_Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = AbiConstructor_IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type AbiConstructor_Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: AbiConstructor_Signature<signatures[key], key>
}
