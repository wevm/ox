import { HDKey } from '@scure/bip32'

import type * as Errors from '../../Errors.js'
import { HdKey_fromScure } from './fromScure.js'
import type { HdKey } from './types.js'

/**
 * Creates a HD Key from a JSON object containing an extended private key (`xpriv`).
 *
 * @example
 * ```ts twoslash
 * import { HdKey } from 'ox'
 *
 * const hdKey = HdKey.fromJson({ xpriv: '...' })
 *
 * console.log(hdKey.privateKey)
 * // @log: '0x...'
 * ```
 *
 * @param json - The JSON object containing an extended private key (`xpriv`).
 * @param options - Creation options.
 * @returns The HD Key.
 */
export function HdKey_fromJson(json: { xpriv: string }): HdKey {
  return HdKey_fromScure(HDKey.fromJSON(json))
}

export declare namespace HdKey_fromJson {
  type ErrorType = HdKey_fromScure.ErrorType | Errors.GlobalErrorType
}

HdKey_fromJson.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as HdKey_fromJson.ErrorType
