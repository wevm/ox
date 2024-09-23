import type { GlobalErrorType } from '../Errors/error.js'
import { Mnemonic_toSeed } from './toSeed.js'
import { HdKey_fromSeed } from '../HdKey/fromSeed.js'
import type { HdKey } from '../HdKey/types.js'

/**
 * Converts a mnemonic to a HD Key.
 *
 * @example
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * const hdKey = Mnemonic.toHdKey(mnemonic)
 * ```
 *
 * @example
 * ### Path Derivation
 *
 * You can derive a HD Key at a specific path using `derive`:
 *
 * ```ts twoslash
 * import { Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.random(Mnemonic.english)
 * const hdKey = Mnemonic.toHdKey(mnemonic).derive(Mnemonic.path({ index: 1 }))
 * ```
 *
 * @param mnemonic - The mnemonic to convert.
 * @param options - Conversion options.
 * @returns The HD Key.
 */
export function Mnemonic_toHdKey(
  mnemonic: string,
  options: Mnemonic_toHdKey.Options = {},
): HdKey {
  const { passphrase } = options
  const seed = Mnemonic_toSeed(mnemonic, { passphrase })
  return HdKey_fromSeed(seed)
}

export declare namespace Mnemonic_toHdKey {
  type Options = {
    /** An optional passphrase for additional protection to the seed. */
    passphrase?: string | undefined
  }

  type ErrorType = GlobalErrorType
}

Mnemonic_toHdKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Mnemonic_toHdKey.ErrorType
