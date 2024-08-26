import type { GlobalErrorType } from '../errors/error.js'
import type { Signature } from '../signature/types.js'
import type { Compute } from '../types.js'
import type { Authorization } from './types.js'

/**
 * Converts an object into a typed {@link Authorization#Authorization}.
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const signature
 *
 * const authorization_signed = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 * ```
 */
export function Authorization_from<
  const authorization extends Authorization,
  const signature extends Signature | undefined = undefined,
>(
  authorization: authorization | Authorization,
  options: Authorization_from.Options<signature> = {},
): Authorization_from.ReturnType<authorization, signature> {
  return { ...authorization, ...options.signature } as never
}

export declare namespace Authorization_from {
  type Options<
    signature extends Signature | undefined = Signature | undefined,
  > = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    authorization extends Authorization = Authorization,
    signature extends Signature | undefined = Signature | undefined,
  > = Compute<
    authorization & (signature extends Signature ? Readonly<signature> : {})
  >

  type ErrorType = GlobalErrorType
}

Authorization_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_from.ErrorType
