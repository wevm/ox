import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Cbor from '../core/Cbor.js'
import * as CoseKey from '../core/CoseKey.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'
import * as internal from '../core/internal/webauthn.js'
import * as P256 from '../core/P256.js'
import * as Signature from '../core/Signature.js'
import type * as Credential_ from './Credential.js'
import {
  base64UrlOptions,
  bufferSourceToBytes,
  bytesToArrayBuffer,
  deserializeExtensions,
  serializeExtensions,
} from './internal/utils.js'
import type * as Types from './Types.js'

export const createChallenge = Uint8Array.from([
  105, 171, 180, 181, 160, 222, 75, 198, 42, 42, 32, 31, 141, 37, 186, 233,
])

/**
 * Creates a new WebAuthn P256 Credential, which can be stored and later used for signing.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' }) // [!code focus]
 * // @log: {
 * // @log:   id: 'oZ48...',
 * // @log:   publicKey: { x: 51421...5123n, y: 12345...6789n },
 * // @log:   raw: PublicKeyCredential {},
 * // @log: }
 * ```
 *
 * @param options - Credential creation options.
 * @returns A WebAuthn P256 credential.
 */
export async function create(
  options: create.Options,
): Promise<Credential_.Credential> {
  const {
    createFn = window.navigator.credentials.create.bind(
      window.navigator.credentials,
    ),
    ...rest
  } = options
  const creationOptions = getOptions(rest)
  try {
    const credential = (await createFn(
      creationOptions as never,
    )) as Types.PublicKeyCredential
    if (!credential) throw new CreateFailedError()

    const response =
      credential.response as Types.AuthenticatorAttestationResponse
    const publicKey = await internal.parseCredentialPublicKey(response)

    return {
      attestationObject: response.attestationObject,
      clientDataJSON: response.clientDataJSON,
      id: credential.id,
      publicKey,
      raw: credential,
    }
  } catch (error) {
    throw new CreateFailedError({
      cause: error as Error,
    })
  }
}

export declare namespace create {
  type Options = getOptions.Options & {
    /**
     * Credential creation function. Useful for environments that do not support
     * the WebAuthn API natively (i.e. React Native or testing environments).
     *
     * @default window.navigator.credentials.create
     */
    createFn?:
      | ((
          options?: Types.CredentialCreationOptions | undefined,
        ) => Promise<Types.Credential | null>)
      | undefined
  }

  type ErrorType =
    | getOptions.ErrorType
    | internal.parseCredentialPublicKey.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the creation options for a P256 WebAuthn Credential to be used with
 * the Web Authentication API.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 *
 * const credential = await window.navigator.credentials.create(options)
 * ```
 *
 * @param options - Options.
 * @returns The credential creation options.
 */
export function getOptions(
  options: getOptions.Options,
): Types.CredentialCreationOptions {
  const {
    attestation = 'none',
    authenticatorSelection = {
      residentKey: 'preferred',
      requireResidentKey: false,
      userVerification: 'required',
    },
    challenge = createChallenge,
    excludeCredentialIds,
    extensions,
    name: name_,
    rp = {
      id: window.location.hostname,
      name: window.document.title,
    },
    user,
  } = options
  const name = (user?.name ?? name_)!
  return {
    publicKey: {
      attestation,
      authenticatorSelection,
      challenge:
        typeof challenge === 'string' ? Bytes.fromHex(challenge) : challenge,
      ...(excludeCredentialIds
        ? {
            excludeCredentials: excludeCredentialIds?.map((id) => ({
              id: Base64.toBytes(id),
              type: 'public-key',
            })),
          }
        : {}),
      pubKeyCredParams: [
        {
          type: 'public-key',
          alg: -7, // p256
        },
      ],
      rp,
      user: {
        id: user?.id ?? Hash.keccak256(Bytes.fromString(name), { as: 'Bytes' }),
        name,
        displayName: user?.displayName ?? name,
      },
      ...(extensions && { extensions }),
    },
  }
}

export declare namespace getOptions {
  type Options = {
    /**
     * A string specifying the relying party's preference for how the attestation statement
     * (i.e., provision of verifiable evidence of the authenticity of the authenticator and its data)
     * is conveyed during credential creation.
     */
    attestation?:
      | Types.PublicKeyCredentialCreationOptions['attestation']
      | undefined
    /**
     * An object whose properties are criteria used to filter out the potential authenticators
     * for the credential creation operation.
     */
    authenticatorSelection?:
      | Types.PublicKeyCredentialCreationOptions['authenticatorSelection']
      | undefined
    /**
     * An `ArrayBuffer`, `TypedArray`, or `DataView` used as a cryptographic challenge.
     */
    challenge?:
      | Hex.Hex
      | Types.PublicKeyCredentialCreationOptions['challenge']
      | undefined
    /**
     * List of credential IDs to exclude from the creation. This property can be used
     * to prevent creation of a credential if it already exists.
     */
    excludeCredentialIds?: readonly string[] | undefined
    /**
     * List of Web Authentication API credentials to use during creation or authentication.
     */
    extensions?:
      | Types.PublicKeyCredentialCreationOptions['extensions']
      | undefined
    /**
     * An object describing the relying party that requested the credential creation
     */
    rp?:
      | {
          id: string
          name: string
        }
      | undefined
    /**
     * A numerical hint, in milliseconds, which indicates the time the calling web app is willing to wait for the creation operation to complete.
     */
    timeout?: Types.PublicKeyCredentialCreationOptions['timeout'] | undefined
  } & OneOf<
    | {
        /** Name for the credential (user.name). */
        name: string
        user?:
          | {
              displayName?: string
              id?: Types.BufferSource
              name: string
            }
          | undefined
      }
    | {
        name?: string | undefined
        /**
         * An object describing the user account for which the credential is generated.
         */
        user: {
          displayName?: string
          id?: Types.BufferSource
          name: string
        }
      }
  >

  type ErrorType =
    | Base64.toBytes.ErrorType
    | Hash.keccak256.ErrorType
    | Bytes.fromString.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes credential creation options into a JSON-serializable
 * format, converting `BufferSource` fields to base64url strings.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 *
 * const serialized = Registration.serializeOptions(options) // [!code focus]
 *
 * // `serialized` is JSON-serializable — send it to a server, store it, etc.
 * const json = JSON.stringify(serialized)
 * ```
 *
 * @param options - The credential creation options to serialize.
 * @returns The serialized credential creation options.
 */
export function serializeOptions(
  options: Types.CredentialCreationOptions,
): Types.CredentialCreationOptions<true> {
  const publicKey = options.publicKey
  if (!publicKey) return {}

  const { challenge, excludeCredentials, extensions, user, ...rest } = publicKey

  return {
    publicKey: {
      ...rest,
      challenge: Hex.fromBytes(bufferSourceToBytes(challenge)),
      ...(excludeCredentials && {
        excludeCredentials: excludeCredentials.map(({ id, ...rest }) => ({
          ...rest,
          id: Base64.fromBytes(bufferSourceToBytes(id), base64UrlOptions),
        })),
      }),
      ...(extensions && {
        extensions: serializeExtensions(extensions),
      }),
      user: {
        ...user,
        id: Base64.fromBytes(bufferSourceToBytes(user.id), base64UrlOptions),
      },
    },
  }
}

export declare namespace serializeOptions {
  type ErrorType = Base64.fromBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Deserializes credential creation options that can be passed to
 * `navigator.credentials.create()`.
 *
 * @example
 * ```ts twoslash
 * import { Registration } from 'ox/webauthn'
 *
 * const options = Registration.getOptions({ name: 'Example' })
 * const serialized = Registration.serializeOptions(options)
 *
 * // ... send to server and back ...
 *
 * const deserialized = Registration.deserializeOptions(serialized) // [!code focus]
 * const credential = await window.navigator.credentials.create(deserialized)
 * ```
 *
 * @param options - The serialized credential creation options.
 * @returns The deserialized credential creation options.
 */
export function deserializeOptions(
  options: Types.CredentialCreationOptions<true>,
): Types.CredentialCreationOptions {
  const publicKey = options.publicKey
  if (!publicKey) return {}

  const { challenge, excludeCredentials, extensions, user, ...rest } = publicKey

  return {
    publicKey: {
      ...rest,
      challenge: Bytes.fromHex(challenge),
      ...(excludeCredentials && {
        excludeCredentials: excludeCredentials.map(({ id, ...rest }) => ({
          ...rest,
          id: Base64.toBytes(id),
        })),
      }),
      ...(extensions && {
        extensions: deserializeExtensions(extensions),
      }),
      user: {
        ...user,
        id: Base64.toBytes(user.id),
      },
    },
  }
}

export declare namespace deserializeOptions {
  type ErrorType = Base64.toBytes.ErrorType | Errors.GlobalErrorType
}

/**
 * Verifies a WebAuthn registration (credential creation) response. Validates the
 * `clientDataJSON`, `attestationObject`, authenticator flags, challenge, origin, and
 * relying party ID, then extracts the credential ID and public key.
 *
 * @example
 * ```ts twoslash
 * import { Credential, Registration } from 'ox/webauthn'
 *
 * const credential = await Registration.create({ name: 'Example' })
 * const serialized = Credential.serialize(credential)
 *
 * const result = Registration.verify({ // [!code focus]
 *   credential: serialized.raw, // [!code focus]
 *   challenge: '0x69abb4b5a0de4bc62a2a201f8d25bae9', // [!code focus]
 *   origin: 'https://example.com', // [!code focus]
 *   rpId: 'example.com', // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   credential: {
 * // @log:     id: 'oZ48...',
 * // @log:     publicKey: { prefix: 4, x: 51421...5123n, y: 12345...6789n },
 * // @log:   },
 * // @log:   counter: 0,
 * // @log:   userVerified: true,
 * // @log: }
 * ```
 *
 * @param options - Verification options.
 * @returns The verified registration result.
 */
export function verify(options: verify.Options): verify.ReturnType {
  const {
    attestation = 'none',
    credential,
    origin = window.location.origin,
    rpId = window.location.hostname,
    userVerification = 'required',
  } = options

  // 1. Decode and validate clientDataJSON
  const clientDataJSONBytes = new Uint8Array(credential.clientDataJSON)
  const clientDataJSON = Bytes.toString(clientDataJSONBytes)
  const clientData = JSON.parse(clientDataJSON)

  if (clientData.type !== 'webauthn.create')
    throw new VerifyError(
      `Expected clientData.type "webauthn.create", got "${clientData.type}"`,
    )

  // Validate challenge
  const challengeResult = (() => {
    if (typeof options.challenge === 'function')
      return options.challenge(clientData.challenge)
    const challengeBytes =
      typeof options.challenge === 'string'
        ? Bytes.fromHex(options.challenge)
        : options.challenge
    const challenge = Base64.fromBytes(challengeBytes, base64UrlOptions)
    return clientData.challenge === challenge
  })()
  if (!challengeResult) throw new VerifyError('Challenge mismatch')

  // Validate origin
  const origins = Array.isArray(origin) ? origin : [origin]
  if (!origins.includes(clientData.origin))
    throw new VerifyError(
      `Origin mismatch: expected ${JSON.stringify(origin)}, got "${clientData.origin}"`,
    )

  // 2. Decode attestationObject via CBOR
  const attestationObjectBytes = new Uint8Array(credential.attestationObject)
  const attestation_ = Cbor.decode<{
    authData: Uint8Array
    attStmt: Record<string, unknown>
    fmt: string
  }>(attestationObjectBytes)

  // 3. Parse authenticatorData
  const authData = attestation_.authData
  const rpIdHash = authData.slice(0, 32)
  const expectedRpIdHash = Hash.sha256(Hex.fromString(rpId), { as: 'Bytes' })

  if (!Bytes.isEqual(rpIdHash, expectedRpIdHash))
    throw new VerifyError('rpId hash mismatch')

  const flags = authData[32]!
  const up = (flags & 0x01) !== 0
  const uv = (flags & 0x04) !== 0
  const at = (flags & 0x40) !== 0
  const be = (flags & 0x08) !== 0
  const bs = (flags & 0x10) !== 0

  if (!up) throw new VerifyError('User presence flag not set')
  if (!at) throw new VerifyError('Attested credential data flag not set')
  if (userVerification === 'required' && !uv)
    throw new VerifyError('User verification flag not set')

  // Minimum authData length: 37 (rpIdHash + flags + counter) + 16 (AAGUID) + 2 (credIdLen)
  if (authData.length < 55)
    throw new VerifyError('authData too short for attested credential data')

  // Counter (4 bytes, big-endian, starting at offset 33)
  const counter =
    ((authData[33]! << 24) |
      (authData[34]! << 16) |
      (authData[35]! << 8) |
      authData[36]!) >>>
    0

  // Credential ID length (2 bytes at offset 53, big-endian)
  const credIdLen = (authData[53]! << 8) | authData[54]!
  if (55 + credIdLen > authData.length)
    throw new VerifyError('credIdLen exceeds authData bounds')

  // Credential ID (variable length starting at offset 55)
  const credentialId = authData.slice(55, 55 + credIdLen)

  // 4. Parse and validate COSE public key
  const coseKeyBytes = authData.slice(55 + credIdLen)
  const coseKeyHex = Hex.fromBytes(coseKeyBytes)
  const coseKeyData = Cbor.decode<Record<string, unknown>>(coseKeyHex)
  // Validate key type is EC2 (2) and algorithm is ES256 (-7)
  if (coseKeyData['1'] !== 2 || coseKeyData['3'] !== -7)
    throw new VerifyError(
      'COSE key must be EC2 (kty=2) with ES256 algorithm (alg=-7)',
    )
  const publicKey = CoseKey.toPublicKey(coseKeyHex)

  // 5. Verify attestation statement (cryptographic binding of authData + clientDataJSON)
  const clientDataHash = Hash.sha256(Bytes.fromString(clientDataJSON), {
    as: 'Bytes',
  })
  const verificationData = Bytes.concat(authData, clientDataHash)

  const { fmt, attStmt } = attestation_
  if (fmt === 'none') {
    // "none" format has no attestation signature; only accept if caller opts in
    if (attestation === 'required')
      throw new VerifyError(
        'Attestation format is "none" but attestation verification is required. ' +
          'Set `attestation: "none"` to accept unattested credentials.',
      )
  } else if (fmt === 'packed') {
    // Packed attestation: verify signature over authData || clientDataHash
    const sig = attStmt.sig
    const alg = attStmt.alg
    if (!(sig instanceof Uint8Array) || typeof alg !== 'number')
      throw new VerifyError(
        'Invalid packed attestation statement: missing sig or alg',
      )
    if (alg !== -7)
      throw new VerifyError(
        `Unsupported attestation algorithm: ${alg} (expected -7 / ES256)`,
      )
    if (attStmt.x5c) {
      // Full attestation with certificate chain is not supported
      throw new VerifyError(
        'Packed attestation with x5c certificate chain is not supported. ' +
          'Use self attestation (no x5c) or set `attestation: "none"`.',
      )
    }
    // Self attestation: verify using the credential public key
    const attSignature = Signature.fromDerBytes(sig)
    const verified = P256.verify({
      hash: true,
      payload: verificationData,
      publicKey,
      signature: attSignature,
    })
    if (!verified)
      throw new VerifyError('Attestation signature verification failed')
  } else {
    throw new VerifyError(`Unsupported attestation format: "${fmt}"`)
  }

  // 6. Build credential ID string
  const id = credential.id ?? Base64.fromBytes(credentialId, base64UrlOptions)

  // 7. Build raw credential
  const raw = credential.raw ?? {
    authenticatorAttachment: null,
    getClientExtensionResults: () => ({}),
    id,
    rawId: bytesToArrayBuffer(credentialId),
    response: {
      attestationObject: credential.attestationObject,
      clientDataJSON: credential.clientDataJSON,
    } as never,
    type: 'public-key',
  }

  return {
    credential: {
      attestationObject: credential.attestationObject,
      clientDataJSON: credential.clientDataJSON,
      id,
      publicKey,
      raw,
    },
    counter,
    ...(uv ? { userVerified: true as const } : {}),
    ...(be ? { backedUp: bs } : {}),
    ...(be
      ? {
          deviceType: bs ? ('multiDevice' as const) : ('singleDevice' as const),
        }
      : {}),
  }
}

export declare namespace verify {
  type Options = {
    /**
     * Attestation verification mode.
     * - `'required'` (default): attestation signature must be present and valid (`packed` self-attestation).
     * - `'none'`: accept `fmt: "none"` attestation (no cryptographic binding of authData to clientDataJSON).
     *
     * @default 'required'
     */
    attestation?: 'required' | 'none' | undefined
    /** The credential response from `Registration.create()`. */
    credential: {
      attestationObject: Credential_.Credential['attestationObject']
      clientDataJSON: Credential_.Credential['clientDataJSON']
      id?: Credential_.Credential['id'] | undefined
      publicKey: Credential_.Credential['publicKey'] | undefined
      raw?: Credential_.Credential['raw'] | undefined
    }
    /**
     * Challenge to verify. Either the raw hex/bytes originally generated, or a
     * function that receives the base64url challenge string and returns whether
     * it is valid (for async/DB lookups).
     */
    challenge: Hex.Hex | Uint8Array | ((challenge: string) => boolean)
    /** Expected origin(s) (e.g. `"https://example.com"`). */
    origin?: string | string[] | undefined
    /** Relying party ID (e.g. `"example.com"`). */
    rpId?: string | undefined
    /** The user verification requirement. @default 'required' */
    userVerification?: Types.UserVerificationRequirement | undefined
  }

  type ReturnType = {
    credential: Credential_.Credential
    counter: number
    userVerified?: true | undefined
    backedUp?: boolean | undefined
    deviceType?: 'multiDevice' | 'singleDevice' | undefined
  }

  type ErrorType =
    | Base64.toBytes.ErrorType
    | Base64.fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Bytes.isEqual.ErrorType
    | Cbor.decode.ErrorType
    | CoseKey.toPublicKey.ErrorType
    | Hash.sha256.ErrorType
    | P256.verify.ErrorType
    | Signature.fromDerBytes.ErrorType
    | VerifyError
    | Errors.GlobalErrorType
}

/** Thrown when WebAuthn registration verification fails. */
export class VerifyError extends Errors.BaseError {
  override readonly name = 'Registration.VerifyError'
}

/** Thrown when a WebAuthn P256 credential creation fails. */
export class CreateFailedError extends Errors.BaseError<Error> {
  override readonly name = 'Registration.CreateFailedError'

  constructor({ cause }: { cause?: Error | undefined } = {}) {
    super('Failed to create credential.', {
      cause,
    })
  }
}
