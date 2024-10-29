import { HDKey } from '@scure/bip32'

import type * as Errors from '../../Errors.js'
import { HdKey_fromScure } from './fromScure.js'
import type { HdKey } from './types.js'

/**
 * Creates a HD Key from an extended private key.
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const hdKey = HdKey.fromExtendedKey('...')
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param extendedKey - The extended private key.
 * @returns The HD Key.
 */
export function HdKey_fromExtendedKey(extendedKey: string): HdKey {
  const key = HDKey.fromExtendedKey(extendedKey)
  return HdKey_fromScure(key)
}

export declare namespace HdKey_fromExtendedKey {
  type ErrorType = HdKey_fromScure.ErrorType | Errors.GlobalErrorType
}

HdKey_fromExtendedKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as HdKey_fromExtendedKey.ErrorType
