import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type { Compute, PartialBy } from '../core/internal/types.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TempoAddress from './TempoAddress.js'

/**
 * Header name used to transport Zone RPC authentication tokens.
 */
export const headerName = 'X-Authorization-Token' as const

/**
 * 32-byte domain separator used when hashing Zone RPC authentication tokens.
 */
export const magicBytes =
  '0x54656d706f5a6f6e655250430000000000000000000000000000000000000000' as const

/**
 * Size, in bytes, of the fixed Zone RPC authentication fields.
 */
export const fieldsSize = 29 as const

/** Current Zone RPC authentication version. */
export const version = 0 as const

/** Current Zone RPC authentication version. */
export type Version = typeof version

/**
 * Root type for a Tempo Zone RPC authentication token.
 *
 * Zone RPC authentication tokens are short-lived, read-only credentials used to
 * authenticate requests to Tempo private zone RPC endpoints.
 *
 * [Zone RPC Specification](https://docs.tempo.xyz/protocol/privacy/rpc#authorization-tokens)
 */
export type ZoneRpcAuthentication<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** Zone chain ID for replay protection. */
    chainId: numberType
    /** Unix timestamp when the token expires. */
    expiresAt: numberType
    /** Unix timestamp when the token was issued. */
    issuedAt: numberType
    /** Zone RPC authentication version. Always `0` for the current spec. */
    version: Version
    /** Numeric zone identifier. */
    zoneId: numberType
  } & (signed extends true
    ? { signature: SignatureEnvelope.SignatureEnvelope<bigintType, numberType> }
    : {
        signature?:
          | SignatureEnvelope.SignatureEnvelope<bigintType, numberType>
          | undefined
      })
>

/** Input type for a Zone RPC authentication token. */
export type Input = PartialBy<ZoneRpcAuthentication<false>, 'version'>

/** 29-byte fixed Zone RPC authentication field suffix. */
export type Fields = Hex.Hex

/** Hex-encoded serialized Zone RPC authentication token. */
export type Serialized = Hex.Hex

/** Signed Zone RPC authentication token. */
export type Signed<
  bigintType = bigint,
  numberType = number,
> = ZoneRpcAuthentication<true, bigintType, numberType>

/**
 * Instantiates a typed Zone RPC authentication token.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: ZoneRpcAuthentication.getSignPayload(authentication),
 *   privateKey: '0x...',
 * })
 *
 * const authentication_signed = ZoneRpcAuthentication.from(authentication, {
 *   signature,
 * })
 * ```
 *
 * @param authentication - Zone RPC authentication token fields.
 * @param options - Zone RPC authentication options.
 * @returns The instantiated Zone RPC authentication token.
 */
export function from<
  const authentication extends Input | ZoneRpcAuthentication,
  const signature extends SignatureEnvelope.from.Value | undefined = undefined,
>(
  authentication: authentication | ZoneRpcAuthentication,
  options: from.Options<signature> = {},
): from.ReturnType<authentication, signature> {
  const auth = authentication as ZoneRpcAuthentication
  const resolved = {
    ...auth,
    version,
  }
  if (options.signature)
    return {
      ...resolved,
      signature: SignatureEnvelope.from(options.signature),
    } as never
  return resolved as never
}

export declare namespace from {
  type Options<
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = {
    /** The signature to attach to the authentication token. */
    signature?: signature | SignatureEnvelope.SignatureEnvelope | undefined
  }

  type ReturnType<
    authentication extends
      | ZoneRpcAuthentication
      | Input = ZoneRpcAuthentication,
    signature extends SignatureEnvelope.from.Value | undefined =
      | SignatureEnvelope.from.Value
      | undefined,
  > = Compute<
    authentication & {
      readonly version: Version
    } & (signature extends SignatureEnvelope.from.Value
        ? { signature: SignatureEnvelope.from.ReturnValue<signature> }
        : {})
  >

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Parses a serialized Zone RPC authentication token.
 *
 * The serialized format is `<signature><29-byte fields>`. The signature is parsed
 * from the prefix and the fixed-length fields are parsed from the suffix.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.deserialize('0x...')
 * ```
 *
 * @param serialized - The serialized Zone RPC authentication token.
 * @returns The parsed Zone RPC authentication token.
 */
export function deserialize(serialized: Serialized): Signed {
  const size = Hex.size(serialized)
  if (size <= fieldsSize)
    throw new InvalidSerializedError({
      reason: `Serialized authentication must be longer than ${fieldsSize} bytes.`,
      serialized,
    })

  const fieldsOffset = size - fieldsSize
  const signature = Hex.slice(serialized, 0, fieldsOffset)
  const fields = Hex.slice(serialized, fieldsOffset)

  const parsedVersion = Hex.toNumber(Hex.slice(fields, 0, 1), { size: 1 })
  if (parsedVersion !== version)
    throw new InvalidSerializedError({
      reason: `Unsupported authentication version "${parsedVersion}". Expected "${version}".`,
      serialized,
    })

  return {
    chainId: Hex.toNumber(Hex.slice(fields, 5, 13), { size: 8 }),
    expiresAt: Hex.toNumber(Hex.slice(fields, 21, 29), { size: 8 }),
    issuedAt: Hex.toNumber(Hex.slice(fields, 13, 21), { size: 8 }),
    signature: SignatureEnvelope.deserialize(signature),
    version,
    zoneId: Hex.toNumber(Hex.slice(fields, 1, 5), { size: 4 }),
  }
}

export declare namespace deserialize {
  type ErrorType =
    | InvalidSerializedError
    | SignatureEnvelope.CoercionError
    | SignatureEnvelope.InvalidSerializedError
    | Hex.size.ErrorType
    | Hex.slice.ErrorType
    | Hex.toNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the 29-byte fixed field suffix for a Zone RPC authentication token.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const fields = ZoneRpcAuthentication.getFields({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @returns The fixed 29-byte field suffix.
 */
export function getFields(
  authentication: PartialBy<ZoneRpcAuthentication, 'version'>,
): Fields {
  return Hex.concat(
    Hex.fromNumber(version, { size: 1 }),
    Hex.fromNumber(authentication.zoneId, { size: 4 }),
    Hex.fromNumber(authentication.chainId, { size: 8 }),
    Hex.fromNumber(authentication.issuedAt, { size: 8 }),
    Hex.fromNumber(authentication.expiresAt, { size: 8 }),
  )
}

export declare namespace getFields {
  type ErrorType =
    | Hex.concat.ErrorType
    | Hex.fromNumber.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Computes the sign payload for a Zone RPC authentication token.
 *
 * When `userAddress` is provided, the payload is wrapped as
 * `keccak256(0x04 || authHash || userAddress)` to match V2 keychain signing.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const payload = ZoneRpcAuthentication.getSignPayload(authentication)
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @param options - Options.
 * @returns The sign payload.
 */
export function getSignPayload(
  authentication: PartialBy<ZoneRpcAuthentication, 'version'>,
  options: getSignPayload.Options = {},
): Hex.Hex {
  const authHash = hash(authentication)
  if (options.userAddress)
    return Hash.keccak256(
      Hex.concat('0x04', authHash, TempoAddress.resolve(options.userAddress)),
    )
  return authHash
}

export declare namespace getSignPayload {
  type Options = {
    /**
     * Root account address for keychain access-key signing.
     *
     * When provided, computes `keccak256(0x04 || authHash || userAddress)`
     * instead of the raw `authHash`.
     */
    userAddress?: TempoAddress.Address | undefined
  }

  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the raw authorization hash for a Zone RPC authentication token.
 *
 * The hash is `keccak256(magicBytes || fields)`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const hash = ZoneRpcAuthentication.hash(authentication)
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @returns The authorization hash.
 */
export function hash(
  authentication: PartialBy<ZoneRpcAuthentication, 'version'>,
): Hex.Hex {
  return Hash.keccak256(Hex.concat(magicBytes, getFields(authentication)))
}

export declare namespace hash {
  type ErrorType =
    | getFields.ErrorType
    | Hash.keccak256.ErrorType
    | Hex.concat.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a Zone RPC authentication token to hex.
 *
 * The serialized format is `<signature><29-byte fields>`.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { ZoneRpcAuthentication } from 'ox/tempo'
 *
 * const authentication = ZoneRpcAuthentication.from({
 *   chainId: 4217000026,
 *   expiresAt: 1711235160,
 *   issuedAt: 1711234560,
 *   zoneId: 26,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: ZoneRpcAuthentication.getSignPayload(authentication),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = ZoneRpcAuthentication.serialize(authentication, {
 *   signature,
 * })
 * ```
 *
 * @param authentication - The Zone RPC authentication token.
 * @param options - Serialization options.
 * @returns The serialized authentication token.
 */
export function serialize(
  authentication: PartialBy<ZoneRpcAuthentication, 'version'>,
  options: serialize.Options = {},
): Serialized {
  const signature = options.signature || authentication.signature
  if (!signature) throw new MissingSignatureError()

  return Hex.concat(
    SignatureEnvelope.serialize(SignatureEnvelope.from(signature)),
    getFields(authentication),
  )
}

export declare namespace serialize {
  type Options = {
    /** Signature to attach to the serialized authentication token. */
    signature?: SignatureEnvelope.from.Value | undefined
  }

  type ErrorType =
    | getFields.ErrorType
    | MissingSignatureError
    | SignatureEnvelope.CoercionError
    | Errors.GlobalErrorType
}

/** Error thrown when a serialized authentication token cannot be deserialized. */
export class InvalidSerializedError extends Errors.BaseError {
  override readonly name = 'ZoneRpcAuthentication.InvalidSerializedError'

  constructor({ reason, serialized }: { reason: string; serialized: Hex.Hex }) {
    super(`Unable to deserialize Zone RPC authentication: ${reason}`, {
      metaMessages: [`Serialized: ${serialized}`],
    })
  }
}

/** Error thrown when serializing an authentication token without a signature. */
export class MissingSignatureError extends Errors.BaseError {
  override readonly name = 'ZoneRpcAuthentication.MissingSignatureError'

  constructor() {
    super('Zone RPC authentication is missing a signature.')
  }
}
