import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'

/**
 * Creates a credential-bound PRF configuration from a UTF-8 tag.
 *
 * Tags are public, stable identifiers. Use the same tag with the same
 * credential to reproduce a PRF output.
 *
 * @example
 * ```ts twoslash
 * import { Prf, WebAuthn } from 'ox'
 *
 * const credential = await WebAuthn.getCredential({
 *   credentialId: 'oZ48...',
 *   prf: Prf.tag('account.1')
 * })
 * ```
 *
 * @param value - Tag to encode.
 * @returns A credential-bound PRF configuration.
 */
export function tag(value: string): tag.ReturnType {
  return { input: Bytes.fromString(value) }
}

export declare namespace tag {
  /** Credential-bound PRF configuration. */
  type ReturnType = {
    /** UTF-8 encoded PRF input. */
    input: Bytes.Bytes
  }

  type ErrorType = Bytes.fromString.ErrorType | Errors.GlobalErrorType
}
