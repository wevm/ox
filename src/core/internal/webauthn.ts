import { p256 } from '@noble/curves/nist.js'
import * as Registration from '../../webauthn/Registration.js'
import type * as Errors from '../Errors.js'
import * as PublicKey from '../PublicKey.js'

/**
 * Parses an ASN.1 signature into a r and s value.
 *
 * @internal
 */
export function parseAsn1Signature(bytes: Uint8Array) {
  const sig = p256.Signature.fromBytes(bytes, 'der')
  const n = p256.Point.CURVE().n
  const s = sig.hasHighS() ? n - sig.s : sig.s
  return { r: sig.r, s }
}

/**
 * SPKI prefix for an uncompressed P-256 public key (91-byte total SPKI):
 * `SEQUENCE { SEQUENCE { OID ecPublicKey, OID secp256r1 }, BIT STRING }`.
 * The 26-byte prefix is followed by `0x04 || X(32) || Y(32)`.
 *
 * @internal
 */
const spkiP256Prefix = /*#__PURE__*/ new Uint8Array([
  0x30, 0x59, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
  0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x03, 0x42, 0x00,
])

/**
 * Parses a P-256 uncompressed public key from a SubjectPublicKeyInfo (SPKI)
 * DER blob. WebAuthn `getPublicKey()` returns SPKI bytes per the spec, and for
 * P-256 with `alg=-7` the structure is fixed 91 bytes. The trailing 65 bytes
 * are exactly the SEC1 uncompressed point `0x04 || X(32) || Y(32)`.
 *
 * @internal
 */
function spkiToRawP256(spki: Uint8Array): Uint8Array {
  if (spki.length !== 91) throw new Registration.CreateFailedError()
  for (let i = 0; i < spkiP256Prefix.length; i++)
    if (spki[i] !== spkiP256Prefix[i]!)
      throw new Registration.CreateFailedError()
  if (spki[spkiP256Prefix.length] !== 0x04)
    throw new Registration.CreateFailedError()
  return spki.subarray(spkiP256Prefix.length)
}

/**
 * Parses a public key into x and y coordinates from the public key
 * defined on the credential.
 *
 * @internal
 */
export async function parseCredentialPublicKey(
  response: AuthenticatorAttestationResponse,
  /** Pre-cloned attestationObject to use in the fallback path, avoiding
   *  cross-origin access on the proxy response object. */
  attestationObject?: ArrayBuffer | ArrayBufferLike,
): Promise<PublicKey.PublicKey> {
  try {
    const publicKeyBuffer = response.getPublicKey()
    if (!publicKeyBuffer) throw new Registration.CreateFailedError()

    // Converting `publicKeyBuffer` throws when credential is created by 1Password Firefox Add-on
    const publicKeyBytes = new Uint8Array(publicKeyBuffer)
    return PublicKey.from(spkiToRawP256(publicKeyBytes))
  } catch (error) {
    // Fallback for 1Password Firefox Add-on restricts access to certain credential properties
    // so we need to use `attestationObject` to extract the public key.
    // https://github.com/passwordless-id/webauthn/issues/50#issuecomment-2072902094
    if ((error as Error).message !== 'Permission denied to access object')
      throw error

    const data = new Uint8Array(attestationObject ?? response.attestationObject)
    const coordinateLength = 0x20
    const cborPrefix = 0x58

    const findStart = (key: number) => {
      const coordinate = new Uint8Array([key, cborPrefix, coordinateLength])
      for (let i = 0; i < data.length - coordinate.length; i++)
        if (coordinate.every((byte, j) => data[i + j] === byte))
          return i + coordinate.length
      throw new Registration.CreateFailedError()
    }

    const xStart = findStart(0x21)
    const yStart = findStart(0x22)

    return PublicKey.from(
      new Uint8Array([
        0x04,
        ...data.slice(xStart, xStart + coordinateLength),
        ...data.slice(yStart, yStart + coordinateLength),
      ]),
    )
  }
}

export declare namespace parseCredentialPublicKey {
  type ErrorType = Registration.CreateFailedError | Errors.GlobalErrorType
}
