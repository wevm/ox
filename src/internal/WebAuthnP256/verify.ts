import { Base64_toBytes } from '../Base64/to.js'
import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_from } from '../Bytes/from.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_sha256 } from '../Hash/sha256.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { P256_verify } from '../P256/verify.js'
import type { PublicKey } from '../PublicKey/types.js'
import type { Signature } from '../Signature/types.js'
import type { SignatureMetadata } from './types.js'

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
  const { challenge, metadata, publicKey, signature } = options
  const {
    authenticatorData,
    challengeIndex,
    clientDataJSON,
    typeIndex,
    userVerificationRequired,
  } = metadata

  const authenticatorDataBytes = Bytes_from(authenticatorData)

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
  if (Hex_from(Base64_toBytes(challenge_extracted!)) !== challenge) return false

  const clientDataJSONHash = Hash_sha256(Bytes_from(clientDataJSON), 'Bytes')
  const payload = Hash_sha256(
    Bytes_concat(authenticatorDataBytes, clientDataJSONHash),
  )

  return P256_verify({
    payload,
    publicKey,
    signature,
  })
}

export declare namespace WebAuthnP256_verify {
  type Options = {
    challenge: Hex
    publicKey: PublicKey
    signature: Signature<false>
    metadata: SignatureMetadata
  }

  type ErrorType =
    | Base64_toBytes.ErrorType
    | Bytes_concat.ErrorType
    | Bytes_from.ErrorType
    | P256_verify.ErrorType
    | GlobalErrorType
}
