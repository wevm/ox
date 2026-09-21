import { p256 } from '@noble/curves/nist.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import * as Address from './Address.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute, UnionPartialBy } from './internal/types.js'
import * as PublicKey from './PublicKey.js'
import * as Signature from './Signature.js'

/** Signature schemes supported by EIP-8141. */
export const schemes = { arbitrary: 0, p256: 2, secp256k1: 1 } as const

/** A supported numeric or named frame signature scheme. */
export type Scheme =
  | keyof typeof schemes
  | (typeof schemes)[keyof typeof schemes]

/** Contract-defined signature bytes. */
export type Arbitrary = {
  /** Explicit nonzero digest, or empty bytes for the transaction signing hash. */
  payload: Hex.Hex
  /** Contract-defined verification scheme. */
  scheme: 0 | 'arbitrary'
  /** Opaque witness bytes. */
  signature: Hex.Hex
  /** Arbitrary signatures have no signer metadata. */
  signer?: undefined
}

/** A structured secp256k1 signature entry. */
export type Secp256k1 = {
  /** Explicit nonzero digest, or empty bytes for the transaction signing hash. */
  payload: Hex.Hex
  /** secp256k1 verification scheme. */
  scheme: 1 | 'secp256k1'
  /** Low-s recovered signature. Omit for an unsigned entry. */
  signature?: Signature.Signature | undefined
  /** Signer address. Omit to use the transaction sender. */
  signer?: Address.Address | undefined
}

/** A structured P-256 signature entry. */
export type P256 = {
  /** Explicit nonzero digest, or empty bytes for the transaction signing hash. */
  payload: Hex.Hex
  /** P-256 verification scheme. */
  scheme: 2 | 'p256'
  /** Signer address. Omit to use the transaction sender. */
  signer?: Address.Address | undefined
} & (
  | {
      /** Uncompressed P-256 public key. */
      publicKey: PublicKey.PublicKey
      /** P-256 signature. High-s is normalized when encoding. */
      signature: Signature.Signature<false>
    }
  | {
      /** Public key, if already known. Empty wire signatures do not retain it. */
      publicKey?: PublicKey.PublicKey | undefined
      /** Omit for an unsigned entry. */
      signature?: undefined
    }
)

/** An EIP-8141 signature entry. Empty payload selects the transaction signing hash. */
export type FrameSignature = Arbitrary | Secp256k1 | P256

/** RLP-ready signature entry. The payload occupies the specification's `msg` field. */
export type Tuple = readonly [
  scheme: Hex.Hex,
  signer: Hex.Hex,
  payload: Hex.Hex,
  signature: Hex.Hex,
]

/**
 * Asserts structural constraints without cryptographic verification.
 * P-256 high-s signatures are accepted and normalized by `toTuple`.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * FrameSignature.assert({
 *   payload: '0x',
 *   scheme: 'secp256k1'
 * })
 * ```
 * @param entry - Signature entry to check.
 * @param options - Validation options.
 */
export function assert(
  entry: FrameSignature,
  options: assert.Options = {},
): void {
  const scheme =
    typeof entry.scheme === 'string' ? schemes[entry.scheme] : entry.scheme
  if (!Number.isInteger(scheme) || scheme < 0 || scheme > 2)
    throw new InvalidError('Unsupported signature scheme.')
  if (scheme === 0 && entry.signer !== undefined)
    throw new InvalidError('Arbitrary signatures cannot specify a signer.')
  if (entry.signer !== undefined)
    Address.assert(entry.signer, { strict: false })
  Hex.assert(entry.payload, { strict: true })
  if (
    entry.payload !== '0x' &&
    (entry.payload.length !== 66 || Hex.toBigInt(entry.payload) === 0n)
  )
    throw new InvalidError('payload must be empty or a nonzero 32-byte digest.')
  switch (entry.scheme) {
    case 0:
    case 'arbitrary':
      Hex.assert(entry.signature, { strict: true })
      if (entry.signature.length % 2 !== 0)
        throw new InvalidError('signature must contain whole bytes.')
      return
  }
  if (entry.scheme === 2 || entry.scheme === 'p256') {
    if (entry.publicKey !== undefined)
      PublicKey.assert(entry.publicKey, { compressed: false })
    if (entry.signature !== undefined && entry.publicKey === undefined)
      throw new InvalidError('P-256 signatures require a public key.')
  }
  if (entry.signature === undefined) {
    if (options.signed) throw new InvalidError('Signature is required.')
    return
  }
  Signature.assert(entry.signature, { recovered: scheme === 1 })
  const r = Hex.toBigInt(entry.signature.r)
  const s = Hex.toBigInt(entry.signature.s)
  const order = scheme === 1 ? secp256k1.Point.Fn.ORDER : p256.Point.Fn.ORDER
  if (
    r === 0n ||
    r >= order ||
    s === 0n ||
    s >= order ||
    (scheme === 1 && s > order / 2n)
  )
    throw new InvalidError(
      'Signature scalars must be in range; secp256k1 requires low-s.',
    )
}

export declare namespace assert {
  type Options = {
    /** Require a protocol signature. Does not perform cryptographic verification. @default false */
    signed?: boolean | undefined
  }
  type ErrorType =
    | InvalidError
    | Address.assert.ErrorType
    | Hex.assert.ErrorType
    | Hex.toBigInt.ErrorType
    | PublicKey.assert.ErrorType
    | Signature.assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Constructs a structured entry, defaulting to arbitrary verification and the transaction signing hash.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * const entry = FrameSignature.from('0xaabb')
 * ```
 * @example
 * ```ts twoslash
 * import { FrameSignature, Secp256k1 } from 'ox'
 * const signature = Secp256k1.sign({
 *   payload:
 *     '0x0000000000000000000000000000000000000000000000000000000000000001',
 *   privateKey:
 *     '0x0000000000000000000000000000000000000000000000000000000000000001'
 * })
 * const entry = FrameSignature.from({
 *   scheme: 'secp256k1',
 *   signature
 * })
 * ```
 * @param entry - Arbitrary signature bytes, or a signature entry with optional defaults.
 * @returns A validated copy, retaining the supplied scheme representation and signature.
 */
export function from<const entry extends from.Input>(
  entry: entry | from.Input,
): from.ReturnType<entry> {
  const result = (
    typeof entry === 'string'
      ? { payload: '0x', scheme: 'arbitrary', signature: entry }
      : {
          ...entry,
          payload: entry.payload ?? '0x',
          scheme: entry.scheme ?? 'arbitrary',
        }
  ) as FrameSignature
  assert(result)
  return result as from.ReturnType<entry>
}

export declare namespace from {
  type Input =
    | Hex.Hex
    | UnionPartialBy<Arbitrary, 'scheme' | 'payload'>
    | UnionPartialBy<Secp256k1 | P256, 'payload'>
  type ReturnType<entry extends Input = Input> = entry extends Hex.Hex
    ? { payload: '0x'; scheme: 'arbitrary'; signature: entry }
    : entry extends Input
      ? Compute<
          Omit<entry, 'scheme' | 'payload'> & {
            payload: entry extends { payload: infer payload extends Hex.Hex }
              ? payload
              : 'payload' extends keyof entry
                ? Exclude<entry['payload'], undefined> | '0x'
                : '0x'
            scheme: entry extends { scheme: infer scheme extends Scheme }
              ? scheme
              : 'scheme' extends keyof entry
                ? Exclude<entry['scheme'], undefined> | 'arbitrary'
                : 'arbitrary'
          }
        >
      : never
  type ErrorType = assert.ErrorType
}

/**
 * Constructs a structured P-256 entry. High-s is normalized when encoding with `toTuple`.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature, Hex, P256 } from 'ox'
 * const privateKey = Hex.fromNumber(1, { size: 32 })
 * const signature = P256.sign({
 *   payload: Hex.fromNumber(1, { size: 32 }),
 *   privateKey
 * })
 * const entry = FrameSignature.fromP256(signature, {
 *   publicKey: P256.getPublicKey({ privateKey })
 * })
 * ```
 * @param signature - P-256 signature.
 * @param options - Public key and optional signature metadata.
 * @returns A structurally validated P-256 entry.
 */
export function fromP256<const signature extends Signature.Signature<false>>(
  signature: signature,
  options: fromP256.Options,
) {
  const entry = from({
    ...options,
    scheme: 'p256',
    signature,
  })
  assert(entry, { signed: true })
  return entry
}

export declare namespace fromP256 {
  type Options = fromSecp256k1.Options & {
    /** Uncompressed P-256 public key. */
    publicKey: PublicKey.PublicKey
  }
  type ErrorType = assert.ErrorType
}

/**
 * Constructs a structured secp256k1 entry, defaulting to the transaction signing hash.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature, Hex, Secp256k1 } from 'ox'
 * const signature = Secp256k1.sign({
 *   payload: Hex.fromNumber(1, { size: 32 }),
 *   privateKey: Hex.fromNumber(1, { size: 32 })
 * })
 * const entry = FrameSignature.fromSecp256k1(signature)
 * ```
 * @param signature - Low-s recovered signature.
 * @param options - Optional signature metadata.
 * @returns A structurally validated secp256k1 entry.
 */
export function fromSecp256k1<const signature extends Signature.Signature>(
  signature: signature,
  options: fromSecp256k1.Options = {},
) {
  const entry = {
    ...options,
    payload: options.payload ?? '0x',
    scheme: 'secp256k1' as const,
    signature,
  }
  assert(entry, { signed: true })
  return entry
}

export declare namespace fromSecp256k1 {
  type Options = {
    /** Explicit digest. Omit to use the transaction signing hash. */
    payload?: Hex.Hex | undefined
    /** Signer address. Omit to use the transaction sender. */
    signer?: Address.Address | undefined
  }
  type ErrorType = assert.ErrorType
}

/**
 * Decodes a signature tuple into a structured entry with a named scheme.
 * Rejects noncanonical signature encodings, including high-s P-256 signatures.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * const entry = FrameSignature.fromTuple([
 *   '0x',
 *   '0x',
 *   '0x',
 *   '0xaabb'
 * ])
 * ```
 * @param tuple - RLP-decoded signature tuple.
 * @returns A structured entry. Empty protocol signatures become unsigned entries.
 */
export function fromTuple(tuple: Tuple): FrameSignature {
  if (!Array.isArray(tuple) || tuple.length !== 4)
    throw new InvalidError('Expected [scheme, signer, payload, signature].')
  const [scheme, signer, payload, signature] = tuple
  Hex.assert(signer, { strict: true })
  Hex.assert(signature, { strict: true })
  if (signature.length % 2 !== 0)
    throw new InvalidError('signature must contain whole bytes.')
  if (scheme !== '0x' && scheme !== '0x01' && scheme !== '0x02')
    throw new InvalidError(
      'Expected a canonical scheme encoding: empty bytes, 0x01, or 0x02.',
    )
  const metadata = { ...(signer === '0x' ? {} : { signer }), payload }
  if (scheme === '0x') {
    if (signer !== '0x')
      throw new InvalidError('Arbitrary signatures cannot specify a signer.')
    return from({ payload, scheme: 'arbitrary', signature })
  }
  if (signature === '0x')
    return scheme === '0x01'
      ? from({ ...metadata, scheme: 'secp256k1' })
      : from({ ...metadata, scheme: 'p256' })
  if (Hex.size(signature) !== (scheme === '0x01' ? 65 : 128))
    throw new InvalidError('Invalid protocol signature length.')
  if (scheme === '0x01') {
    if (Hex.toNumber(Hex.slice(signature, 0, 1)) > 1)
      throw new InvalidError('Recovery parity must be 0 or 1.')
    return from({
      ...metadata,
      scheme: 'secp256k1',
      signature: Signature.fromRecoveredBytes(Hex.toBytes(signature)),
    })
  }
  const s = Hex.slice(signature, 32, 64)
  if (Hex.toBigInt(s) > p256.Point.Fn.ORDER / 2n)
    throw new InvalidError('P-256 wire signatures require low-s.')
  return from({
    ...metadata,
    publicKey: {
      prefix: 4,
      x: Hex.slice(signature, 64, 96),
      y: Hex.slice(signature, 96, 128),
    },
    scheme: 'p256',
    signature: { r: Hex.slice(signature, 0, 32), s },
  })
}

export declare namespace fromTuple {
  type ErrorType =
    | assert.ErrorType
    | Hex.slice.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.toBytes.ErrorType
    | Signature.fromRecoveredBytes.ErrorType
}

/**
 * Encodes a signature entry, packing protocol signatures and normalizing P-256 high-s.
 * Does not mutate the entry. Empty protocol signatures encode as empty bytes.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * const tuple = FrameSignature.toTuple(
 *   FrameSignature.from({ signature: '0xaabb' })
 * )
 * ```
 * @param entry - Structured signature entry.
 * @returns A canonical signature tuple.
 */
export function toTuple(entry: FrameSignature): Tuple {
  assert(entry)
  const scheme =
    typeof entry.scheme === 'string' ? schemes[entry.scheme] : entry.scheme
  const signature = (() => {
    switch (entry.scheme) {
      case 0:
      case 'arbitrary':
        return entry.signature
      case 1:
      case 'secp256k1':
        return entry.signature === undefined
          ? '0x'
          : Hex.fromBytes(Signature.toRecoveredBytes(entry.signature))
      case 2:
      case 'p256': {
        if (entry.signature === undefined) return '0x'
        const { publicKey, signature } = entry
        const s = Hex.toBigInt(signature.s)
        return Hex.concat(
          Hex.fromNumber(Hex.toBigInt(signature.r), { size: 32 }),
          Hex.fromNumber(
            s > p256.Point.Fn.ORDER / 2n ? p256.Point.Fn.ORDER - s : s,
            { size: 32 },
          ),
          Hex.fromNumber(Hex.toBigInt(publicKey.x), { size: 32 }),
          Hex.fromNumber(Hex.toBigInt(publicKey.y), { size: 32 }),
        )
      }
    }
  })()
  return [
    scheme ? Hex.fromNumber(scheme, { size: 1 }) : '0x',
    entry.signer ?? '0x',
    entry.payload,
    signature,
  ]
}

export declare namespace toTuple {
  type ErrorType =
    | assert.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.concat.ErrorType
    | Signature.toRecoveredBytes.ErrorType
}

/**
 * Returns structural validity without verifying authorization.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * FrameSignature.validate(
 *   { payload: '0x', scheme: 'secp256k1' },
 *   { signed: true }
 * )
 * // @log: false
 * ```
 * @param entry - Entry to check.
 * @param options - Validation options.
 * @returns Whether the entry is structurally valid.
 */
export function validate(
  entry: FrameSignature,
  options: assert.Options = {},
): boolean {
  try {
    assert(entry, options)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when frame signature metadata or encoding is invalid. */
export class InvalidError extends Errors.BaseError {
  override readonly name = 'FrameSignature.InvalidError'
  constructor(details: string) {
    super('Invalid frame signature.', { details })
  }
}
