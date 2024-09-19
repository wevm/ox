import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_sha256 } from '../Hash/sha256.js'
import { Hex_concat } from '../Hex/concat.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import { Hex_fromString } from '../Hex/fromString.js'
import type { Hex } from '../Hex/types.js'

/**
 * Gets the authenticator data which contains information about the
 * processing of an authenticator request (ie. from `WebAuthnP256.sign`).
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * autenticator data. In most cases you will not need this function.
 * `authenticatorData` is typically returned as part of the
 * {@link ox#WebAuthnP256.(sign:function)} response (ie. an authenticator response).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const authenticatorData = WebAuthnP256.getAuthenticatorData({
 *   rpId: 'example.com',
 *   signCount: 420,
 * })
 * // @log: "0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"
 * ```
 *
 * @param options - Options to construct the authenticator data.
 * @returns The authenticator data.
 */
export function WebAuthnP256_getAuthenticatorData(
  options: WebAuthnP256_getAuthenticatorData.Options = {},
): Hex {
  const { flag = 5, rpId = window.location.hostname, signCount = 0 } = options
  const rpIdHash = Hash_sha256(Hex_fromString(rpId))
  const flag_bytes = Hex_fromNumber(flag, { size: 1 })
  const signCount_bytes = Hex_fromNumber(signCount, { size: 4 })
  return Hex_concat(rpIdHash, flag_bytes, signCount_bytes)
}

export declare namespace WebAuthnP256_getAuthenticatorData {
  type Options = {
    /** A bitfield that indicates various attributes that were asserted by the authenticator. [Read more](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API/Authenticator_data#flags) */
    flag?: number | undefined
    /** The [Relying Party ID](https://w3c.github.io/webauthn/#relying-party-identifier) that the credential is scoped to. */
    rpId?: PublicKeyCredentialRequestOptions['rpId'] | undefined
    /** A signature counter, if supported by the authenticator (set to 0 otherwise). */
    signCount?: number | undefined
  }

  type ErrorType = GlobalErrorType
}

WebAuthnP256_getAuthenticatorData.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_getAuthenticatorData.ErrorType
