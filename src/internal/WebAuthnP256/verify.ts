import type * as Errors from '../../Errors.js'
import { Base64_toBytes } from '../Base64/toBytes.js'
import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import { Bytes_fromString } from '../Bytes/fromString.js'
import { sha256 } from '../Hash/sha256.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import { P256_verify } from '../P256/verify.js'
import type { PublicKey } from '../PublicKey/types.js'
import type { Signature } from '../Signature/types.js'
import type { WebAuthnP256_SignMetadata } from './types.js'

/**
 * Verifies a signature using the Credential's public key and the challenge which was signed.
 *
 * @example
 * ```ts twoslash
 * import { WebAuthnP256 } from 'ox'
 *
 * const credential = await WebAuthnP256.createCredential({
 *   name: 'Example',
 * })
 *
 * const { metadata, signature } = await WebAuthnP256.sign({
 *   credentialId: credential.id,
 *   challenge: '0xdeadbeef',
 * })
 *
 * const result = await WebAuthnP256.verify({ // [!code focus]
 *   metadata, // [!code focus]
 *   challenge: '0xdeadbeef', // [!code focus]
 *   publicKey: credential.publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @param options - Options.
 * @returns Whether the signature is valid.
 */
export function WebAuthnP256_verify(
  options: WebAuthnP256_verify.Options,
): boolean {
  const { challenge, hash = true, metadata, publicKey, signature } = options
  const {
    authenticatorData,
    challengeIndex,
    clientDataJSON,
    typeIndex,
    userVerificationRequired,
  } = metadata

  const authenticatorDataBytes = Bytes_fromHex(authenticatorData)

  // Check length of `authenticatorData`.
  if (authenticatorDataBytes.length < 37) return false

  const flag = authenticatorDataBytes[32]!

  // Verify that the UP bit of the flags in authData is set.
  if ((flag & 0x01) !== 0x01) return false

  // If user verification was determined to be required, verify that
  // the UV bit of the flags in authData is set. Otherwise, ignore the
  // value of the UV flag.
  if (userVerificationRequired && (flag & 0x04) !== 0x04) return false

  // If the BE bit of the flags in authData is not set, verify that
  // the BS bit is not set.
  if ((flag & 0x08) !== 0x08 && (flag & 0x10) === 0x10) return false

  // Check that response is for an authentication assertion
  const type = '"type":"webauthn.get"'
  if (type !== clientDataJSON.slice(Number(typeIndex), type.length + 1))
    return false

  // Check that hash is in the clientDataJSON.
  const match = clientDataJSON
    .slice(Number(challengeIndex))
    .match(/^"challenge":"(.*?)"/)
  if (!match) return false

  // Validate the challenge in the clientDataJSON.
  const [_, challenge_extracted] = match
  if (Hex_fromBytes(Base64_toBytes(challenge_extracted!)) !== challenge)
    return false

  const clientDataJSONHash = sha256(Bytes_fromString(clientDataJSON), {
    as: 'Bytes',
  })
  const payload = Bytes_concat(authenticatorDataBytes, clientDataJSONHash)

  return P256_verify({
    hash,
    payload,
    publicKey,
    signature,
  })
}

export declare namespace WebAuthnP256_verify {
  type Options = {
    /** The challenge to verify. */
    challenge: Hex
    /** If set to `true`, the payload will be hashed (sha256) before being verified. */
    hash?: boolean | undefined
    /** The public key to verify the signature with. */
    publicKey: PublicKey
    /** The signature to verify. */
    signature: Signature<false>
    /** The metadata to verify the signature with. */
    metadata: WebAuthnP256_SignMetadata
  }

  type ErrorType =
    | Base64_toBytes.ErrorType
    | Bytes_concat.ErrorType
    | Bytes_fromHex.ErrorType
    | P256_verify.ErrorType
    | Errors.GlobalErrorType
}

WebAuthnP256_verify.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebAuthnP256_verify.ErrorType
