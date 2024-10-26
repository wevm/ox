import type { AbiConstructor as abitype_AbiConstructor } from 'abitype'

import type {
  IsConstructorSignature,
  IsStructSignature,
} from '../AbiItem/types.js'
import type { TypeErrorMessage } from '../types.js'

/** Root type for an {@link ox#AbiItem.AbiItem} with a `constructor` type. */
export type AbiConstructor = abitype_AbiConstructor

/////////////////////////////////////////////////////////////////////////////////
// Internal
/////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type IsSignature<signature extends string> =
  | (IsConstructorSignature<signature> extends true ? true : never)
  | (IsStructSignature<signature> extends true
      ? true
      : never) extends infer condition
  ? [condition] extends [never]
    ? false
    : true
  : false

/** @internal */
export type Signature<
  signature extends string,
  key extends string | unknown = unknown,
> = IsSignature<signature> extends true
  ? signature
  : string extends signature // if exactly `string` (not narrowed), then pass through as valid
    ? signature
    : TypeErrorMessage<`Signature "${signature}" is invalid${key extends string
        ? ` at position ${key}`
        : ''}.`>

/** @internal */
export type Signatures<signatures extends readonly string[]> = {
  [key in keyof signatures]: Signature<signatures[key], key>
}
