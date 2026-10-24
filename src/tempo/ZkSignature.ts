import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as Rlp from '../core/Rlp.js'
import * as Poseidon from './internal/poseidon.js'
import type * as SignatureEnvelope from './SignatureEnvelope.js'

/** `"tempo:zk-signature"`, the domain prefix of the digest an access key signs. */
const domain = '0x74656d706f3a7a6b2d7369676e6174757265'

/** Address namespaces of known schemes. */
const namespaces: Record<number, number> = {
  // Scheme `0x01` (OIDC RS256) uses the OIDC namespace.
  1: 1,
  // Scheme `0x02` (passport, RSA Active Authentication) uses the passport namespace.
  2: 2,
}

/**
 * `MESSAGE_TAG`, the `commit_b` of a message signature's public input. It exceeds any
 * `validUntil`, so a message signature's proof never verifies as a ZK signature's.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131#message-signatures)
 */
export const messageTag = 2n ** 64n

/**
 * A ZK signature without its access key signature.
 *
 * A prover issues a credential after a sign-in. Until `validUntil`, the access
 * key it commits to signs {@link ox#ZkSignature.(getSignPayload:function)} for
 * each payload, and the credential and that signature form a
 * {@link ox#SignatureEnvelope.Zk} signature.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131)
 */
export type Credential<numberType = number> = Omit<
  SignatureEnvelope.Zk<bigint, numberType>,
  'accessKeySignature' | 'type'
>

/**
 * A message signature: a proof that an identity approved one message, with no access key.
 * Verifiers check it offchain.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131#message-signatures)
 */
export type MessageSignature<numberType = number> = Omit<
  Credential<numberType>,
  'validUntil'
>

/** RLP tuple of a credential's fields, in wire order. */
export type Tuple = readonly [
  scheme: Hex.Hex,
  publisherId: Hex.Hex,
  issuer: Hex.Hex,
  keyHash: Hex.Hex,
  addressSeed: Hex.Hex,
  issuedAt: Hex.Hex,
  validUntil: Hex.Hex,
  proof: Hex.Hex,
]

/**
 * Asserts that a credential encodes a valid ZK signature.
 *
 * Checks field sizes, that `issuer`, `keyHash`, and `addressSeed` are BN254
 * scalar field elements, and that the proof is 256 bytes. Proof validity,
 * issuer keys, and times are checked by the node.
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * ZkSignature.assert({
 *   addressSeed: `0x${'01'.repeat(32)}`,
 *   issuedAt: 1760000000,
 *   issuer: `0x${'02'.repeat(32)}`,
 *   keyHash: `0x${'03'.repeat(32)}`,
 *   proof: `0x${'04'.repeat(256)}`,
 *   publisherId: `0x${'05'.repeat(32)}`,
 *   scheme: 1,
 *   validUntil: 1760000540
 * })
 * ```
 *
 * @param credential - The credential to check.
 */
export function assert(credential: Credential): void {
  const {
    addressSeed,
    issuedAt,
    issuer,
    keyHash,
    proof,
    publisherId,
    scheme,
    validUntil,
  } = credential
  if (!Number.isInteger(scheme) || scheme < 0 || scheme > 0xff)
    throw new InvalidCredentialError({ reason: 'scheme is not a byte' })
  for (const [name, value] of [
    ['issuedAt', issuedAt],
    ['validUntil', validUntil],
  ] as const)
    if (!Number.isSafeInteger(value) || value < 0)
      throw new InvalidCredentialError({
        reason: `\`${name}\` is not a timestamp`,
      })
  for (const [name, value] of [
    ['addressSeed', addressSeed],
    ['issuer', issuer],
    ['keyHash', keyHash],
    ['publisherId', publisherId],
  ] as const)
    if (!Hex.validate(value) || Hex.size(value) !== 32)
      throw new InvalidCredentialError({
        reason: `\`${name}\` is not 32 bytes`,
      })
  for (const [name, value] of [
    ['addressSeed', addressSeed],
    ['issuer', issuer],
    ['keyHash', keyHash],
  ] as const)
    if (Hex.toBigInt(value) >= Poseidon.fieldModulus)
      throw new InvalidCredentialError({
        reason: `\`${name}\` is not a BN254 scalar field element`,
      })
  if (!Hex.validate(proof) || Hex.size(proof) !== 256)
    throw new InvalidCredentialError({ reason: 'proof is not 256 bytes' })
}

export declare namespace assert {
  type ErrorType = InvalidCredentialError | Errors.GlobalErrorType
}

/**
 * Converts an RLP tuple to a credential.
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * const credential = ZkSignature.fromTuple([
 *   '0x01',
 *   `0x${'05'.repeat(32)}`,
 *   `0x${'02'.repeat(32)}`,
 *   `0x${'03'.repeat(32)}`,
 *   `0x${'01'.repeat(32)}`,
 *   '0x68e77800',
 *   '0x68e77a1c',
 *   `0x${'04'.repeat(256)}`
 * ])
 * ```
 *
 * @param tuple - The RLP tuple.
 * @returns The credential.
 */
export function fromTuple(tuple: Tuple): Credential {
  const [
    scheme,
    publisherId,
    issuer,
    keyHash,
    addressSeed,
    issuedAt,
    validUntil,
    proof,
  ] = tuple
  const credential = {
    addressSeed,
    issuedAt: toInteger(issuedAt, 'issuedAt'),
    issuer,
    keyHash,
    proof,
    publisherId,
    scheme: toInteger(scheme, 'scheme'),
    validUntil: toInteger(validUntil, 'validUntil'),
  } satisfies Credential
  assert(credential)
  return credential
}

export declare namespace fromTuple {
  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Computes the address of the identity a credential signs for:
 * `keccak256(0x06 || namespace || publisherId || issuer || addressSeed)[12:]`.
 *
 * The scheme fixes the namespace, so one identity has the same address for
 * every access key and sign-in.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131)
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * const address = ZkSignature.getAddress({
 *   addressSeed: `0x${'01'.repeat(32)}`,
 *   issuer: `0x${'02'.repeat(32)}`,
 *   publisherId: `0x${'05'.repeat(32)}`,
 *   scheme: 1
 * })
 * ```
 *
 * @param credential - The identity's scheme, publisher, issuer, and address seed.
 * @returns The identity's address.
 */
export function getAddress(credential: getAddress.Credential): Address.Address {
  const { addressSeed, issuer, publisherId, scheme } = credential
  const namespace = namespaces[scheme]
  if (namespace === undefined) throw new UnknownSchemeError({ scheme })
  const hash = Hash.keccak256(
    Hex.concat(
      '0x06',
      Hex.fromNumber(namespace, { size: 1 }),
      publisherId,
      issuer,
      addressSeed,
    ),
  )
  return Address.from(Hex.slice(hash, 12))
}

export declare namespace getAddress {
  type Credential = Pick<
    Credential_,
    'addressSeed' | 'issuer' | 'publisherId' | 'scheme'
  >

  type ErrorType =
    | Address.from.ErrorType
    | Hash.keccak256.ErrorType
    | UnknownSchemeError
    | Errors.GlobalErrorType
}

/**
 * Computes the digest an access key signs for a payload:
 * `keccak256("tempo:zk-signature" || payload || keccak256(rlp(credential)))`.
 *
 * The payload is the digest the ZK signature authorizes, such as a transaction's
 * or a key authorization's sign payload. Binding the credential's fields keeps
 * the access key signature from being reused with another proof.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131)
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 * import { KeyAuthorization, ZkSignature } from 'ox/tempo'
 *
 * const accessKey = Secp256k1.randomPrivateKey()
 *
 * // Issued by a prover for the access key.
 * const credential = {
 *   addressSeed: `0x${'01'.repeat(32)}`,
 *   issuedAt: 1760000000,
 *   issuer: `0x${'02'.repeat(32)}`,
 *   keyHash: `0x${'03'.repeat(32)}`,
 *   proof: `0x${'04'.repeat(256)}`,
 *   publisherId: `0x${'05'.repeat(32)}`,
 *   scheme: 1,
 *   validUntil: 1760000540
 * } as const satisfies ZkSignature.Credential
 *
 * const authorization = KeyAuthorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 4217n,
 *   type: 'secp256k1'
 * })
 *
 * const payload = ZkSignature.getSignPayload({
 *   credential,
 *   payload: KeyAuthorization.getSignPayload(authorization)
 * })
 * const accessKeySignature = Secp256k1.sign({
 *   payload,
 *   privateKey: accessKey
 * })
 * ```
 *
 * @param options - The credential and the payload it authorizes.
 * @returns The digest for the access key to sign.
 */
export function getSignPayload(options: getSignPayload.Options): Hex.Hex {
  const { credential, payload } = options
  if (Hex.size(payload) !== 32)
    throw new InvalidCredentialError({ reason: 'payload is not 32 bytes' })
  return Hash.keccak256(
    Hex.concat(
      domain,
      payload,
      Hash.keccak256(Rlp.fromHex(toTuple(credential))),
    ),
  )
}

export declare namespace getSignPayload {
  type Options = {
    /** The credential the access key signs with. */
    credential: Credential_
    /** The 32-byte digest the ZK signature authorizes. */
    payload: Hex.Hex
  }

  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | InvalidCredentialError
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts a credential to its RLP tuple.
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * const tuple = ZkSignature.toTuple({
 *   addressSeed: `0x${'01'.repeat(32)}`,
 *   issuedAt: 1760000000,
 *   issuer: `0x${'02'.repeat(32)}`,
 *   keyHash: `0x${'03'.repeat(32)}`,
 *   proof: `0x${'04'.repeat(256)}`,
 *   publisherId: `0x${'05'.repeat(32)}`,
 *   scheme: 1,
 *   validUntil: 1760000540
 * })
 * ```
 *
 * @param credential - The credential.
 * @returns The RLP tuple, in wire order.
 */
export function toTuple(credential: Credential): Tuple {
  assert(credential)
  const {
    addressSeed,
    issuedAt,
    issuer,
    keyHash,
    proof,
    publisherId,
    scheme,
    validUntil,
  } = credential
  return [
    fromInteger(scheme),
    publisherId,
    issuer,
    keyHash,
    addressSeed,
    fromInteger(issuedAt),
    fromInteger(validUntil),
    proof,
  ]
}

export declare namespace toTuple {
  type ErrorType = assert.ErrorType | Errors.GlobalErrorType
}

/**
 * Deserializes a message signature: `rlp([scheme, publisherId, issuer, keyHash, addressSeed, issuedAt, proof])`.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131#message-signatures)
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * const signature = ZkSignature.deserializeMessage('0x...')
 * ```
 *
 * @param serialized - The serialized message signature.
 * @returns The message signature.
 */
export function deserializeMessage(serialized: Hex.Hex): MessageSignature {
  const decoded = Rlp.toHex(serialized)
  // Verifiers reject non-canonical RLP, so the fields must re-encode to the same bytes.
  if (
    !Array.isArray(decoded) ||
    decoded.length !== 7 ||
    decoded.some((field) => typeof field !== 'string') ||
    Rlp.fromHex(decoded) !== serialized.toLowerCase()
  )
    throw new InvalidCredentialError({
      reason: 'expected seven canonical message signature fields',
    })
  const [scheme, publisherId, issuer, keyHash, addressSeed, issuedAt, proof] =
    decoded as readonly Hex.Hex[]
  const signature = {
    addressSeed: addressSeed!,
    issuedAt: toInteger(issuedAt!, 'issuedAt'),
    issuer: issuer!,
    keyHash: keyHash!,
    proof: proof!,
    publisherId: publisherId!,
    scheme: toInteger(scheme!, 'scheme'),
  } satisfies MessageSignature
  assert({ ...signature, validUntil: 0 })
  return signature
}

export declare namespace deserializeMessage {
  type ErrorType =
    | assert.ErrorType
    | InvalidCredentialError
    | Rlp.toHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a message signature: `rlp([scheme, publisherId, issuer, keyHash, addressSeed, issuedAt, proof])`.
 *
 * [TIP-1131](https://docs.tempo.xyz/protocol/tips/tip-1131#message-signatures)
 *
 * @example
 * ```ts twoslash
 * import { ZkSignature } from 'ox/tempo'
 *
 * const serialized = ZkSignature.serializeMessage({
 *   addressSeed: `0x${'01'.repeat(32)}`,
 *   issuedAt: 1760000000,
 *   issuer: `0x${'02'.repeat(32)}`,
 *   keyHash: `0x${'03'.repeat(32)}`,
 *   proof: `0x${'04'.repeat(256)}`,
 *   publisherId: `0x${'05'.repeat(32)}`,
 *   scheme: 2
 * })
 * ```
 *
 * @param signature - The message signature.
 * @returns The serialized message signature.
 */
export function serializeMessage(signature: MessageSignature): Hex.Hex {
  const [scheme, publisherId, issuer, keyHash, addressSeed, issuedAt, , proof] =
    toTuple({ ...signature, validUntil: 0 })
  return Rlp.fromHex([
    scheme,
    publisherId,
    issuer,
    keyHash,
    addressSeed,
    issuedAt,
    proof,
  ])
}

export declare namespace serializeMessage {
  type ErrorType =
    | toTuple.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

type Credential_ = Credential

// RLP integers are minimal big-endian strings, with zero as the empty string.
function fromInteger(value: number): Hex.Hex {
  return value === 0 ? '0x' : Hex.fromNumber(value)
}

function toInteger(value: Hex.Hex, name: string): number {
  if (value === '0x') return 0
  if (value.startsWith('0x00'))
    throw new InvalidCredentialError({
      reason: `\`${name}\` is not a canonical integer`,
    })
  const integer = Hex.toBigInt(value)
  if (integer > BigInt(Number.MAX_SAFE_INTEGER))
    throw new InvalidCredentialError({ reason: `\`${name}\` is too large` })
  return Number(integer)
}

/** Thrown when a credential cannot encode a valid ZK signature. */
export class InvalidCredentialError extends Errors.BaseError {
  override readonly name = 'ZkSignature.InvalidCredentialError'
  constructor({ reason }: { reason: string }) {
    super(`Invalid ZK signature credential: ${reason}.`)
  }
}

/** Thrown when a scheme has no known address namespace. */
export class UnknownSchemeError extends Errors.BaseError {
  override readonly name = 'ZkSignature.UnknownSchemeError'
  constructor({ scheme }: { scheme: number }) {
    super(`ZK signature scheme \`${scheme}\` is unknown.`)
  }
}
