import type { GlobalErrorType } from '../errors/error.js'
import type { Authorization } from '../types/authorization.js'
import type { Signature } from '../types/signature.js'
import type { Compute } from '../types/utils.js'

/**
 * Converts an object into a typed {@link Types#Authorization}.
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
 *
 * @alias ox!Authorization.toAuthorization:function(1)
 */
export function toAuthorization<
  const authorization extends Authorization,
  const signature extends Signature | undefined = undefined,
>(
  authorization: authorization | Authorization,
  options: toAuthorization.Options<signature> = {},
): toAuthorization.ReturnType<authorization, signature> {
  return { ...authorization, ...options.signature } as never
}

export declare namespace toAuthorization {
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

toAuthorization.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as toAuthorization.ErrorType
