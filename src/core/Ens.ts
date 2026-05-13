import * as Bytes from './Bytes.js'
import * as EnsNormalize from './EnsNormalize.js'
import type * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import * as internal from './internal/ens.js'

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
export function labelhash(label: string) {
  if (!label) return Hex.fromBytes(new Uint8Array(32))
  return (
    internal.unwrapLabelhash(label) ||
    Hash.keccak256(Bytes.fromString(label), { as: 'Hex' })
  )
}

export declare namespace labelhash {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | internal.unwrapLabelhash.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.fromString.ErrorType
    | Errors.GlobalErrorType
}

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
export function namehash(name: string) {
  if (!name) return Hex.fromBytes(new Uint8Array(32))

  // Reuse a single 64-byte scratch buffer across iterations: the previous
  // hash always lives in [0, 32) and the current label hash is written
  // into [32, 64). This avoids one `Bytes.concat` allocation per label.
  const scratch = new Uint8Array(64)
  const labels = name.split('.')
  // Iterate in reverse order building up hash
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    const label = labels[i]!
    const encoded = internal.unwrapLabelhash(label)
    if (encoded) scratch.set(Bytes.fromHex(encoded), 32)
    else
      scratch.set(Hash.keccak256(Bytes.fromString(label), { as: 'Bytes' }), 32)
    scratch.set(Hash.keccak256(scratch, { as: 'Bytes' }), 0)
  }

  return Hex.fromBytes(scratch.subarray(0, 32))
}

export declare namespace namehash {
  type ErrorType =
    | Hex.fromBytes.ErrorType
    | internal.unwrapLabelhash.ErrorType
    | Bytes.fromHex.ErrorType
    | Hash.keccak256.ErrorType
    | Bytes.fromString.ErrorType
    | Bytes.concat.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Normalizes ENS name according to [ENSIP-15](https://github.com/ensdomains/docs/blob/9edf9443de4333a0ea7ec658a870672d5d180d53/ens-improvement-proposals/ensip-15-normalization-standard.md).
 *
 * For more info see [ENS documentation](https://docs.ens.domains/contract-api-reference/name-processing#normalising-names) on name processing.
 *
 * For consumers that only need normalization (and want to avoid the
 * remainder of the `Ens` module surface) the same function is also
 * available as a deep import: `import * as EnsNormalize from 'ox/EnsNormalize'`.
 *
 * @example
 * ```ts twoslash
 * import { Ens } from 'ox'
 * Ens.normalize('wevm.eth')
 * // @log: 'wevm.eth'
 * ```
 *
 * @param name - ENS name.
 * @returns Normalized ENS name.
 */
export function normalize(name: string): string {
  return EnsNormalize.normalize(name)
}

export declare namespace normalize {
  type ErrorType = Errors.GlobalErrorType
}
