import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Ens_encodedLabelToLabelhash } from './encodedLabelToLabelhash.js'

/**
 * Hashes ENS name.
 *
 * Since ENS names prohibit certain forbidden characters (e.g. underscore) and have other validation rules, you likely want to [normalize ENS names](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) with [UTS-46 normalization](https://unicode.org/reports/tr46) before passing them to `namehash`. You can use the built-in {@link ox#Ens.(normalize:function)} function for this.
 *
 * @example
 * ```ts twoslash
 * import { Ens } from 'ox'
 * Ens.namehash('wevm.eth')
 * // @log: '0xf246651c1b9a6b141d19c2604e9a58f567973833990f830d882534a747801359'
 * ```
 *
 * @param name - ENS name.
 * @returns ENS namehash.
 */
export function Ens_namehash(name: string) {
  let result = new Uint8Array(32).fill(0)
  if (!name) return Hex.fromBytes(result)

  const labels = name.split('.')
  // Iterate in reverse order building up hash
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    const hashFromEncodedLabel = Ens_encodedLabelToLabelhash(labels[i]!)
    const hashed = hashFromEncodedLabel
      ? Bytes.fromHex(hashFromEncodedLabel)
      : Hash_keccak256(Bytes.fromString(labels[i]!), { as: 'Bytes' })
    result = Hash_keccak256(Bytes.concat(result, hashed), { as: 'Bytes' })
  }

  return Hex.fromBytes(result)
}

export declare namespace Ens_namehash {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Ens_encodedLabelToLabelhash.ErrorType
    | Bytes.fromHex.ErrorType
    | Hash_keccak256.ErrorType
    | Bytes.fromString.ErrorType
    | Bytes.concat.ErrorType
    | Errors.GlobalErrorType
}

Ens_namehash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Ens_namehash.ErrorType
