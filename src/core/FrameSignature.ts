import * as Address from './Address.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as PublicKey from './PublicKey.js'
import * as Signature from './Signature.js'

/** Signature schemes supported by EIP-8141. */
export const schemes = { arbitrary: 0, secp256k1: 1, p256: 2 } as const

/** A frame transaction signature scheme. */
export type Scheme = (typeof schemes)[keyof typeof schemes]

/** A signature entry, with empty `msg` selecting the transaction signing hash. */
export type FrameSignature = {
  /** Explicit nonzero 32-byte digest, or empty bytes for the canonical hash. */
  msg: Hex.Hex
  /** Scheme-specific signature bytes. Empty bytes may represent a signing placeholder. */
  signature: Hex.Hex
} & (
  | {
      /** Contract-defined verification. */
      scheme: 0
      /** Arbitrary signatures have no signer metadata. */
      signer?: undefined
    }
  | {
      /** Protocol-defined ECDSA verification scheme. */
      scheme: 1 | 2
      /** Signer address. Omit to use the transaction sender. */
      signer?: Address.Address | undefined
    }
)

/** RLP-ready signature entry. */
export type Tuple = readonly [
  scheme: Hex.Hex,
  signer: Hex.Hex,
  msg: Hex.Hex,
  signature: Hex.Hex,
]

const secp256k1Order =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const p256Order =
  0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n

/**
 * Asserts signature metadata and encoding constraints, without verifying the
 * signature against a message or signer. Empty signature placeholders are allowed
 * unless `signed` is true.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * FrameSignature.assert({
 *   scheme: 1,
 *   msg: '0x',
 *   signature: '0x'
 * })
 * ```
 * @param entry - Signature entry to check.
 * @param options - Validation options.
 */
export function assert(
  entry: FrameSignature,
  options: assert.Options = {},
): void {
  if (!Number.isInteger(entry.scheme) || entry.scheme < 0 || entry.scheme > 2)
    throw new InvalidError('Unsupported signature scheme.')
  if (entry.scheme === schemes.arbitrary && entry.signer !== undefined)
    throw new InvalidError('Arbitrary signatures cannot specify a signer.')
  if (entry.signer !== undefined)
    Address.assert(entry.signer, { strict: false })
  for (const field of ['msg', 'signature'] as const) {
    Hex.assert(entry[field], { strict: true })
    if (entry[field].length % 2 !== 0)
      throw new InvalidError(`${field} must contain whole bytes.`)
  }
  if (
    entry.msg !== '0x' &&
    (Hex.size(entry.msg) !== 32 || Hex.toBigInt(entry.msg) === 0n)
  )
    throw new InvalidError('msg must be empty or a nonzero 32-byte digest.')
  if (entry.scheme === schemes.arbitrary) return
  if (entry.signature === '0x' && !options.signed) return
  const size = entry.scheme === schemes.secp256k1 ? 65 : 128
  if (Hex.size(entry.signature) !== size)
    throw new InvalidError(`Signature must contain ${size} bytes.`)
  const offset = entry.scheme === schemes.secp256k1 ? 1 : 0
  if (offset && Hex.toNumber(Hex.slice(entry.signature, 0, 1)) > 1)
    throw new InvalidError('Recovery parity must be 0 or 1.')
  const r = Hex.toBigInt(Hex.slice(entry.signature, offset, offset + 32))
  const s = Hex.toBigInt(Hex.slice(entry.signature, offset + 32, offset + 64))
  const order = entry.scheme === schemes.secp256k1 ? secp256k1Order : p256Order
  if (r === 0n || r >= order || s === 0n || s > order / 2n)
    throw new InvalidError(
      'Signature scalars must be in range and use low-s encoding.',
    )
}

export declare namespace assert {
  type Options = {
    /** Require complete protocol signature bytes. Does not perform cryptographic verification. @default false */
    signed?: boolean | undefined
  }
  type ErrorType =
    | InvalidError
    | Address.assert.ErrorType
    | Hex.assert.ErrorType
    | Hex.toBigInt.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.slice.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Constructs a signature entry, preserving its literal types.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * const entry = FrameSignature.from({
 *   scheme: 0,
 *   msg: '0x',
 *   signature: '0xaabb'
 * })
 * ```
 * @param entry - Signature entry to construct.
 * @returns A structurally validated copy.
 */
export function from<const entry extends FrameSignature>(
  entry: entry | FrameSignature,
): entry {
  assert(entry)
  return { ...entry } as entry
}

export declare namespace from {
  type ErrorType = assert.ErrorType
}

/**
 * Encodes a secp256k1 signature as `yParity || r || s`.
 *
 * @example
 * ```ts twoslash
 * import { Hex, Secp256k1, FrameSignature } from 'ox'
 * const signature = Secp256k1.sign({
 *   payload: Hex.fromNumber(1, { size: 32 }),
 *   privateKey: Hex.fromNumber(1, { size: 32 })
 * })
 * const entry = FrameSignature.fromSecp256k1(signature)
 * ```
 * @param signature - Low-s recovered signature.
 * @param options - Signature metadata.
 * @returns A secp256k1 entry.
 */
export function fromSecp256k1(
  signature: Signature.Signature,
  options: fromSecp256k1.Options = {},
) {
  const entry = {
    scheme: schemes.secp256k1,
    ...options,
    msg: options.msg ?? '0x',
    signature: Hex.fromBytes(Signature.toRecoveredBytes(signature)),
  }
  assert(entry, { signed: true })
  return entry
}

export declare namespace fromSecp256k1 {
  type Options = {
    /** Signer address. Omit to use the transaction sender. */
    signer?: Address.Address | undefined
    /** Explicit digest. Omit to sign the canonical transaction hash. */
    msg?: Hex.Hex | undefined
  }
  type ErrorType =
    | assert.ErrorType
    | Signature.toRecoveredBytes.ErrorType
    | Hex.fromBytes.ErrorType
}

/**
 * Encodes a P-256 signature as `r || s || qx || qy`, normalizing high-s signatures.
 * Does not verify the signature or public key against a message.
 *
 * @example
 * ```ts twoslash
 * import { Hex, P256, FrameSignature } from 'ox'
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
 * @param options - Public key and signature metadata.
 * @returns A P-256 entry.
 */
export function fromP256(
  signature: Signature.Signature<false>,
  options: fromP256.Options,
) {
  PublicKey.assert(options.publicKey, { compressed: false })
  Signature.assert(signature)
  const r = Hex.toBigInt(signature.r)
  const s = Hex.toBigInt(signature.s)
  if (r === 0n || r >= p256Order || s === 0n || s >= p256Order)
    throw new InvalidError('P-256 signature scalars must be in range.')
  const { publicKey, ...metadata } = options
  const entry = {
    scheme: schemes.p256,
    ...metadata,
    msg: options.msg ?? '0x',
    signature: Hex.concat(
      Hex.fromNumber(r, { size: 32 }),
      Hex.fromNumber(s > p256Order / 2n ? p256Order - s : s, { size: 32 }),
      Hex.fromNumber(Hex.toBigInt(publicKey.x), { size: 32 }),
      Hex.fromNumber(Hex.toBigInt(publicKey.y), { size: 32 }),
    ),
  }
  assert(entry, { signed: true })
  return entry
}

export declare namespace fromP256 {
  type Options = fromSecp256k1.Options & {
    /** Uncompressed P-256 public key. */
    publicKey: PublicKey.PublicKey
  }
  type ErrorType =
    | assert.ErrorType
    | PublicKey.assert.ErrorType
    | Signature.assert.ErrorType
    | Hex.fromNumber.ErrorType
    | Hex.concat.ErrorType
}

/**
 * Decodes an RLP-ready signature tuple, preserving implicit signer and message fields.
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
 * @returns A structurally validated entry, possibly containing a signing placeholder.
 */
export function fromTuple(tuple: Tuple): FrameSignature {
  if (!Array.isArray(tuple) || tuple.length !== 4)
    throw new InvalidError('Expected [scheme, signer, msg, signature].')
  const [scheme, signer, msg, signature] = tuple
  Hex.assert(signer, { strict: true })
  if (scheme !== '0x' && scheme !== '0x01' && scheme !== '0x02')
    throw new InvalidError(
      'Expected a canonical scheme encoding: empty bytes, 0x01, or 0x02.',
    )
  const entry = {
    scheme: (scheme === '0x' ? 0 : Hex.toNumber(scheme)) as Scheme,
    ...(signer === '0x' ? {} : { signer }),
    msg,
    signature,
  } as FrameSignature
  assert(entry)
  return entry
}

export declare namespace fromTuple {
  type ErrorType = assert.ErrorType
}

/**
 * Converts a signature entry to its RLP-ready tuple, retaining raw signature bytes.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * const tuple = FrameSignature.toTuple({
 *   scheme: 0,
 *   msg: '0x',
 *   signature: '0xaabb'
 * })
 * ```
 * @param entry - Signature entry, possibly containing a signing placeholder.
 * @returns A canonical signature tuple.
 */
export function toTuple(entry: FrameSignature): Tuple {
  assert(entry)
  return [
    entry.scheme ? Hex.fromNumber(entry.scheme, { size: 1 }) : '0x',
    entry.signer ?? '0x',
    entry.msg,
    entry.signature,
  ]
}

export declare namespace toTuple {
  type ErrorType = assert.ErrorType | Hex.fromNumber.ErrorType
}

/**
 * Returns whether signature metadata and encoding satisfy structural constraints.
 * This does not verify that the signature authorizes a message or signer.
 *
 * @example
 * ```ts twoslash
 * import { FrameSignature } from 'ox'
 * FrameSignature.validate(
 *   { scheme: 1, msg: '0x', signature: '0x' },
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
