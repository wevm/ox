import { HDKey, type Versions } from '@scure/bip32'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { HdKey_fromScure } from './fromScure.js'
import type { HdKey } from './types.js'

/**
 * Creates a HD Key from a master seed.
 *
 * @example
 * ```ts twoslash
 * import { HdKey, Mnemonic } from 'ox'
 *
 * const seed = Mnemonic.toSeed('test test test test test test test test test test test junk')
 * const hdKey = HdKey.fromSeed(seed)
 * ```
 *
 * @example
 * ### Path Derivation
 *
 * You can derive a HD Key at a specific path using `derive`.
 *
 * ```ts twoslash
 * import { HdKey, Mnemonic } from 'ox'
 *
 * const mnemonic = Mnemonic.toSeed('test test test test test test test test test test test junk')
 * const hdKey = HdKey.fromSeed(mnemonic).derive(HdKey.path())
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param seed - The master seed to create the HD Key from.
 * @param options - Creation options.
 * @returns The HD Key.
 */
export function HdKey_fromSeed(
  seed: Hex | Bytes.Bytes,
  options: HdKey_fromSeed.Options = {},
): HdKey {
  const { versions } = options
  const key = HDKey.fromMasterSeed(Bytes.from(seed), versions)
  return HdKey_fromScure(key)
}

export declare namespace HdKey_fromSeed {
  type Options = {
    /** The versions to use for the HD Key. */
    versions?: Versions | undefined
  }

  type ErrorType =
    | Bytes.from.ErrorType
    | HdKey_fromScure.ErrorType
    | Errors.GlobalErrorType
}

HdKey_fromSeed.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as HdKey_fromSeed.ErrorType
