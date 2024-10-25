import type * as Errors from '../../Errors.js'
import { Base64_fromHex } from '../Base64/fromHex.js'
import type { Hex } from '../Hex/types.js'

/**
 * Constructs the Client Data in stringified JSON format which represents client data that
 * was passed to `credentials.get()` in {@link ox#WebAuthnP256.(sign:function)}.
 *
 * :::warning
 *
 * This function is mainly for testing purposes or for manually constructing
 * client data. In most cases you will not need this function.
 * `clientDataJSON` is typically returned as part of the
 * {@link ox#WebAuthnP256.(sign:function)} response (ie. an authenticator response).
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const clientDataJSON = WebAuthnP256.getClientDataJSON({
 *   challenge: '0xdeadbeef',
 *   origin: 'https://example.com',
 * })
 * // @log: "{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"
 * ```
 *
 * @param options - Options to construct the client data.
 * @returns The client data.
 */
export function WebAuthnP256_getClientDataJSON(
  options: WebAuthnP256_getClientDataJSON.Options,
): string {
  const {
    challenge,
    crossOrigin = false,
    extraClientData,
    origin = window.location.origin,
  } = options

  return JSON.stringify({
    type: 'webauthn.get',
    challenge: Base64_fromHex(challenge, { url: true, pad: false }),
    origin,
    crossOrigin,
    ...extraClientData,
  })
}

export declare namespace WebAuthnP256_getClientDataJSON {
  type Options = {
    /** The challenge to sign. */
    challenge: Hex
    /** If set to `true`, it means that the calling context is an `<iframe>` that is not same origin with its ancestor frames. */
    crossOrigin?: boolean | undefined
    /** Additional client data to include in the client data JSON. */
    extraClientData?: Record<string, unknown> | undefined
    /** The fully qualified origin of the relying party which has been given by the client/browser to the authenticator. */
    origin?: string | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

WebAuthnP256_getClientDataJSON.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_getClientDataJSON.ErrorType
