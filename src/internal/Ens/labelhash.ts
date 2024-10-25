import type * as Errors from '../../Errors.js'
import { keccak256 } from '../Hash/keccak256.js'
import { fromBytes } from '../Hex/fromBytes.js'
import { fromString } from '../Hex/fromString.js'
import { Ens_encodedLabelToLabelhash } from './encodedLabelToLabelhash.js'

/**
 * Hashes ENS label.
 *
 * Since ENS labels prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS labels](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `labelhash`. You can use the built-in {@link ox#Ens.(normalize:function)} function for this.
 *
 * @example
 * ```ts twoslash
 * import { Ens } from 'ox'
 * Ens.labelhash('eth')
 * '0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0'
 * ```
 *
 * @param label - ENS label.
 * @returns ENS labelhash.
 */
export function Ens_labelhash(label: string) {
  const result = new Uint8Array(32).fill(0)
  if (!label) return fromBytes(result)
  return Ens_encodedLabelToLabelhash(label) || keccak256(fromString(label))
}

export declare namespace Ens_labelhash {
  type ErrorType =
    | fromBytes.ErrorType
    | Ens_encodedLabelToLabelhash.ErrorType
    | keccak256.ErrorType
    | fromString.ErrorType
    | Errors.GlobalErrorType
}

Ens_labelhash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Ens_labelhash.ErrorType
