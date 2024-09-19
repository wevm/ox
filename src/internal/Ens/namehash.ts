import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import { Bytes_fromString } from '../Bytes/fromString.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
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
  if (!name) return Hex_fromBytes(result)

  const labels = name.split('.')
  // Iterate in reverse order building up hash
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    const hashFromEncodedLabel = Ens_encodedLabelToLabelhash(labels[i]!)
    const hashed = hashFromEncodedLabel
      ? Bytes_fromHex(hashFromEncodedLabel)
      : Hash_keccak256(Bytes_fromString(labels[i]!), 'Bytes')
    result = Hash_keccak256(Bytes_concat(result, hashed), 'Bytes')
  }

  return Hex_fromBytes(result)
}

export declare namespace Ens_namehash {
  type ErrorType =
    | Hex_fromBytes.ErrorType
    | Ens_encodedLabelToLabelhash.ErrorType
    | Bytes_fromHex.ErrorType
    | Hash_keccak256.ErrorType
    | Bytes_fromString.ErrorType
    | Bytes_concat.ErrorType
    | GlobalErrorType
}

Ens_namehash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Ens_namehash.ErrorType
