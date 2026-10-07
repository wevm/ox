import * as Address from '../core/Address.js'
import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as Poseidon from './internal/poseidon.js'

/**
 * Scheme identifier of OIDC ID tokens signed with RS256.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133)
 */
export const scheme = 1

/** An RSA signing key that scheme `0x01` accepts. */
export type Key = {
  /** TIP-1133 `key_hash` of the modulus. */
  keyHash: Hex.Hex
  /** The key's `kid`, if any. */
  kid?: string | undefined
  /** The 2048-bit modulus, as 256 big-endian bytes. */
  modulus: Hex.Hex
}

/**
 * Reads an issuer's JSON Web Key into a {@link ox#Oidc.Key}, rejecting keys that
 * scheme `0x01` cannot prove for.
 *
 * Accepts RSA keys with exponent `AQAB` (65537) and a 2048-bit modulus, whose
 * `use` is absent or `sig` and whose `alg` is absent or `RS256`. Publishers list
 * only these keys ([TIP-1132](https://docs.tempo.xyz/protocol/tips/tip-1132)).
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const response = await fetch(
 *   'https://www.googleapis.com/oauth2/v3/certs'
 * )
 * const { keys } = await response.json()
 *
 * const key = Oidc.fromJwk(keys[0])
 * ```
 *
 * @param jwk - The JSON Web Key, as published at the issuer's `jwks_uri`.
 * @returns The key's modulus and key hash.
 */
export function fromJwk(jwk: fromJwk.Jwk): Key {
  const { alg, e, kid, kty, n, use } = jwk
  if (kty !== 'RSA') throw new UnsupportedKeyError({ reason: 'not an RSA key' })
  if (e !== 'AQAB')
    throw new UnsupportedKeyError({ reason: 'exponent is not 65537' })
  if (use !== undefined && use !== 'sig')
    throw new UnsupportedKeyError({ reason: 'not a signing key' })
  if (alg !== undefined && alg !== 'RS256')
    throw new UnsupportedKeyError({ reason: 'algorithm is not RS256' })
  if (!n) throw new UnsupportedKeyError({ reason: 'modulus is missing' })

  // A JWK may carry a leading zero byte before a modulus with its top bit set.
  const bytes = Base64.toBytes(n)
  const modulus = bytes[0] === 0 ? bytes.slice(1) : bytes
  if (modulus.length !== 256 || (modulus[0]! & 0x80) === 0)
    throw new UnsupportedKeyError({ reason: 'modulus is not 2048 bits' })

  return {
    keyHash: hashKey(modulus),
    ...(kid !== undefined ? { kid } : {}),
    modulus: Hex.fromBytes(modulus),
  }
}

export declare namespace fromJwk {
  /** A JSON Web Key, as published at an issuer's `jwks_uri`. */
  type Jwk = {
    alg?: string | undefined
    e?: string | undefined
    kid?: string | undefined
    kty?: string | undefined
    n?: string | undefined
    use?: string | undefined
  }

  type ErrorType =
    | Base64.toBytes.ErrorType
    | UnsupportedKeyError
    | Errors.GlobalErrorType
}

/**
 * Computes the address seed of an identity:
 * `Poseidon(1, hash_bytes(sub, 64), hash_bytes(aud, 128), salt)`.
 *
 * With the issuer and publisher, the address seed fixes the identity's
 * address. The salt keeps the address from revealing the `sub` and `aud`.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const addressSeed = Oidc.getAddressSeed({
 *   aud: '1234567890-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com',
 *   salt: '0x01d2f3a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60',
 *   sub: '110169484474386276334'
 * })
 * // @log: '0x1a3548ca6ee9c37b81638ef979c0c405c03ca782bd3eceeba282073283bd7682'
 * ```
 *
 * @param options - The token's `aud` and `sub`, and the identity's salt.
 * @returns The address seed, as a 32-byte field element.
 */
export function getAddressSeed(options: getAddressSeed.Options): Hex.Hex {
  const { aud, salt, sub } = options
  return fromField(
    Poseidon.hash([
      1n,
      hashClaim('sub', sub, 64),
      hashClaim('aud', aud, 128),
      toField(salt, 'salt'),
    ]),
  )
}

export declare namespace getAddressSeed {
  type Options = {
    /** The token's `aud`. */
    aud: string
    /** The identity's salt, as a field element. See {@link ox#Oidc.(getSalt:function)}. */
    salt: Hex.Hex
    /** The token's `sub`. */
    sub: string
  }

  type ErrorType =
    | ClaimTooLongError
    | InvalidFieldElementError
    | Errors.GlobalErrorType
}

/**
 * Computes the `nonce` a wallet requests the ID token with:
 * `base64url(be32(Poseidon(access_key_id, valid_until, blinding)))`.
 *
 * The nonce commits to the access key the proof will authorize and to when the
 * signature expires. A new blinding value for each sign-in keeps it from
 * revealing the access key.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const nonce = Oidc.getNonce({
 *   accessKeyAddress:
 *     '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   blinding: Oidc.randomBlinding(),
 *   validUntil: Math.floor(Date.now() / 1000) + 540
 * })
 * ```
 *
 * @param options - The access key, the expiry, and the blinding value.
 * @returns The nonce, 43 base64url characters.
 */
export function getNonce(options: getNonce.Options): string {
  const { accessKeyAddress, blinding, validUntil } = options
  Address.assert(accessKeyAddress, { strict: false })
  const hash = Poseidon.hash([
    Hex.toBigInt(accessKeyAddress),
    toTimestamp(validUntil, 'validUntil'),
    toField(blinding, 'blinding'),
  ])
  return Base64.fromBytes(Bytes.fromNumber(hash, { size: 32 }), {
    pad: false,
    url: true,
  })
}

export declare namespace getNonce {
  type Options = {
    /** Address of the access key the proof will authorize. */
    accessKeyAddress: Address.Address
    /** A new random field element for each sign-in. See {@link ox#Oidc.(randomBlinding:function)}. */
    blinding: Hex.Hex
    /** When the signature expires, in seconds. */
    validUntil: number
  }

  type ErrorType =
    | Address.assert.ErrorType
    | InvalidFieldElementError
    | InvalidTimestampError
    | Errors.GlobalErrorType
}

/**
 * Computes a proof's public input:
 * `Poseidon(1, issuer, key_hash, address_seed, access_key_id, valid_until, issued_at)`.
 *
 * A prover returns this value with its proof. Checking it against the token
 * confirms the proof is for the expected statement.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const publicInput = Oidc.getPublicInput({
 *   accessKeyAddress:
 *     '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   addressSeed:
 *     '0x1a3548ca6ee9c37b81638ef979c0c405c03ca782bd3eceeba282073283bd7682',
 *   issuedAt: 1760000000,
 *   issuer:
 *     '0x2ff3ac6e640a4a5d80c0a97cdf74754c3126bde1d8772872a7b3d8afe0714da4',
 *   keyHash:
 *     '0x0f311199cd1872a1d25d1bd871767f0151e5e93281215c583d5e603d65be23bf',
 *   validUntil: 1760000540
 * })
 * // @log: '0x0482585d75870919317aa31b2b525769ffa0556714412068b4dcfe7ab044d538'
 * ```
 *
 * @param options - The statement the proof attests to.
 * @returns The public input, as a 32-byte field element.
 */
export function getPublicInput(options: getPublicInput.Options): Hex.Hex {
  const {
    accessKeyAddress,
    addressSeed,
    issuedAt,
    issuer,
    keyHash,
    validUntil,
  } = options
  Address.assert(accessKeyAddress, { strict: false })
  return fromField(
    Poseidon.hash([
      BigInt(scheme),
      toField(issuer, 'issuer'),
      toField(keyHash, 'keyHash'),
      toField(addressSeed, 'addressSeed'),
      Hex.toBigInt(accessKeyAddress),
      toTimestamp(validUntil, 'validUntil'),
      toTimestamp(issuedAt, 'issuedAt'),
    ]),
  )
}

export declare namespace getPublicInput {
  type Options = {
    /** Address of the access key the proof authorizes. */
    accessKeyAddress: Address.Address
    /** The identity's address seed. See {@link ox#Oidc.(getAddressSeed:function)}. */
    addressSeed: Hex.Hex
    /** The token's `iat`, in seconds. */
    issuedAt: number
    /** The issuer hash. See {@link ox#Oidc.(hashIssuer:function)}. */
    issuer: Hex.Hex
    /** The signing key's hash. See {@link ox#Oidc.(hashKey:function)}. */
    keyHash: Hex.Hex
    /** When the signature expires, in seconds. */
    validUntil: number
  }

  type ErrorType =
    | Address.assert.ErrorType
    | InvalidFieldElementError
    | InvalidTimestampError
    | Errors.GlobalErrorType
}

/**
 * Derives the salt of an identity:
 * `HMAC-SHA256(key, normalize_iss(iss) || 0x00 || aud || 0x00 || sub) mod BN254_SCALAR_FIELD`.
 *
 * A salt service derives the salt after verifying the token. The key fixes every
 * address it derives, so it must be a durable secret: losing it locks users out.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#offchain-components-non-normative)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const salt = Oidc.getSalt({
 *   aud: '1234567890-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com',
 *   iss: 'https://accounts.google.com',
 *   key: '0x...',
 *   sub: '110169484474386276334'
 * })
 * ```
 *
 * @param options - The verified token's claims and the salt key.
 * @returns The salt, as a 32-byte field element.
 */
export function getSalt(options: getSalt.Options): Hex.Hex {
  const { aud, iss, key, sub } = options
  const message = Bytes.concat(
    Bytes.fromString(normalizeIssuer(iss)),
    Bytes.from([0]),
    Bytes.fromString(aud),
    Bytes.from([0]),
    Bytes.fromString(sub),
  )
  const mac = Hash.hmac256(key, message)
  return fromField(Bytes.toBigInt(mac) % Poseidon.fieldModulus)
}

export declare namespace getSalt {
  type Options = {
    /** The token's `aud`. */
    aud: string
    /** The token's `iss`. */
    iss: string
    /** The durable salt key. */
    key: Hex.Hex | Bytes.Bytes
    /** The token's `sub`. */
    sub: string
  }

  type ErrorType = Hash.hmac256.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the issuer hash: `hash_bytes(normalize_iss(iss), 128)`.
 *
 * One leading `https://` is dropped first, so `accounts.google.com` and
 * `https://accounts.google.com` hash the same.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const issuer = Oidc.hashIssuer(
 *   'https://accounts.google.com'
 * )
 * // @log: '0x2ff3ac6e640a4a5d80c0a97cdf74754c3126bde1d8772872a7b3d8afe0714da4'
 * ```
 *
 * @param iss - The token's `iss`.
 * @returns The issuer hash, as a 32-byte field element.
 */
export function hashIssuer(iss: string): Hex.Hex {
  return fromField(hashClaim('iss', normalizeIssuer(iss), 128))
}

export declare namespace hashIssuer {
  type ErrorType = ClaimTooLongError | Errors.GlobalErrorType
}

/**
 * Computes a signing key's hash: `hash_bytes(n as 256 big-endian bytes, 256)`.
 *
 * Publishers list key hashes, and a proof shows its token was signed by the key
 * with this hash.
 *
 * [TIP-1133](https://docs.tempo.xyz/protocol/tips/tip-1133#hashing)
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const keyHash = Oidc.hashKey('0x...')
 * ```
 *
 * @param modulus - The RSA modulus, as 256 big-endian bytes.
 * @returns The key hash, as a 32-byte field element.
 */
export function hashKey(modulus: Hex.Hex | Bytes.Bytes): Hex.Hex {
  const bytes = Bytes.from(modulus)
  if (bytes.length !== 256)
    throw new UnsupportedKeyError({ reason: 'modulus is not 256 bytes' })
  return fromField(hashBytes(bytes, 256))
}

export declare namespace hashKey {
  type ErrorType =
    | Bytes.from.ErrorType
    | UnsupportedKeyError
    | Errors.GlobalErrorType
}

/**
 * Generates a random blinding value for {@link ox#Oidc.(getNonce:function)}.
 *
 * 31 random bytes always lie below the BN254 scalar field modulus.
 *
 * @example
 * ```ts twoslash
 * import { Oidc } from 'ox/tempo'
 *
 * const blinding = Oidc.randomBlinding()
 * ```
 *
 * @returns A random field element, as 32 bytes.
 */
export function randomBlinding(): Hex.Hex {
  return Hex.padLeft(Hex.fromBytes(Bytes.random(31)), 32)
}

// `hash_bytes(b, max_len)`: the length, then 31-byte big-endian chunks of `b`, zero-padded.
function hashBytes(bytes: Bytes.Bytes, maxLength: number): bigint {
  const chunks: bigint[] = []
  for (let offset = 0; offset < maxLength; offset += 31) {
    const chunk = Bytes.padRight(bytes.slice(offset, offset + 31), 31)
    chunks.push(Bytes.toBigInt(chunk))
  }
  return Poseidon.hash([BigInt(bytes.length), ...chunks])
}

function hashClaim(claim: string, value: string, maxLength: number): bigint {
  const bytes = Bytes.fromString(value)
  if (bytes.length > maxLength)
    throw new ClaimTooLongError({ claim, maxLength, size: bytes.length })
  return hashBytes(bytes, maxLength)
}

// `normalize_iss`: drops one leading `https://`.
function normalizeIssuer(iss: string): string {
  return iss.startsWith('https://') ? iss.slice('https://'.length) : iss
}

function fromField(value: bigint): Hex.Hex {
  return Hex.fromNumber(value, { size: 32 })
}

function toField(value: Hex.Hex, name: string): bigint {
  const field = Hex.toBigInt(value)
  if (field >= Poseidon.fieldModulus)
    throw new InvalidFieldElementError({ name, value })
  return field
}

function toTimestamp(value: number, name: string): bigint {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new InvalidTimestampError({ name, value })
  return BigInt(value)
}

/** Thrown when a token claim exceeds the length scheme `0x01` can hash. */
export class ClaimTooLongError extends Errors.BaseError {
  override readonly name = 'Oidc.ClaimTooLongError'
  constructor({
    claim,
    maxLength,
    size,
  }: {
    claim: string
    maxLength: number
    size: number
  }) {
    super(
      `The \`${claim}\` claim is ${size} bytes; scheme \`0x01\` hashes at most ${maxLength} bytes.`,
    )
  }
}

/** Thrown when a value is not a BN254 scalar field element. */
export class InvalidFieldElementError extends Errors.BaseError {
  override readonly name = 'Oidc.InvalidFieldElementError'
  constructor({ name, value }: { name: string; value: string }) {
    super(
      `\`${name}\` (\`${value}\`) is not an element of the BN254 scalar field.`,
    )
  }
}

/** Thrown when a timestamp is not a whole, non-negative number of seconds. */
export class InvalidTimestampError extends Errors.BaseError {
  override readonly name = 'Oidc.InvalidTimestampError'
  constructor({ name, value }: { name: string; value: number }) {
    super(`\`${name}\` (\`${value}\`) is not a timestamp in seconds.`)
  }
}

/** Thrown when a signing key is outside what scheme `0x01` can prove for. */
export class UnsupportedKeyError extends Errors.BaseError {
  override readonly name = 'Oidc.UnsupportedKeyError'
  constructor({ reason }: { reason: string }) {
    super(`The key is unsupported: ${reason}.`)
  }
}
