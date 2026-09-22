import * as Address from './Address.js'
import * as Blobs from './Blobs.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Frame from './Frame.js'
import * as FrameSignature from './FrameSignature.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import type { Assign, Compute, PartialBy } from './internal/types.js'
import * as Rlp from './Rlp.js'
import type * as TxEnvelopeEip4844 from './TxEnvelopeEip4844.js'

/** An EIP-8141 transaction containing independently budgeted call frames. */
export type TxEnvelopeEip8141 = {
  /** Versioned blob hashes. @default [] */
  blobVersionedHashes?: readonly Hex.Hex[] | undefined
  /** Chain ID. Use bigint for IDs beyond the safe integer range. */
  chainId: number | bigint
  /** Frames to execute, in order. */
  frames: readonly Frame.Frame[]
  /** Maximum fee per blob gas, in wei. @default 0n */
  maxFeePerBlobGas?: bigint | undefined
  /** Maximum fee per gas, in wei. @default 0n */
  maxFeePerGas?: bigint | undefined
  /** Maximum priority fee per gas, in wei. @default 0n */
  maxPriorityFeePerGas?: bigint | undefined
  /** Sender nonce. @default 0n */
  nonce?: bigint | undefined
  /** Account authorizing execution. */
  sender: Address.Address
  /** PeerDAS sidecars. Excluded from transaction and signing hashes. */
  sidecars?: TxEnvelopeEip4844.Sidecars<Hex.Hex> | undefined
  /** Signature entries, including unsigned placeholders before signing. @default [] */
  signatures?: readonly FrameSignature.FrameSignature[] | undefined
  /** Transaction type. */
  type: Type
}

/** Serialized EIP-8141 transaction envelope. */
export type Serialized = `${SerializedType}${string}`

/** Serialized EIP-8141 transaction type prefix. */
export const serializedType = '0x06' as const

/** Serialized EIP-8141 transaction type. */
export type SerializedType = typeof serializedType

/** EIP-8141 transaction type. */
export const type = 'eip8141' as const

/** EIP-8141 transaction type identifier. */
export type Type = typeof type

/**
 * Asserts that an EIP-8141 envelope satisfies structural transaction constraints.
 *
 * Accepts unsigned signature entries for construction. Does not verify signatures,
 * account authorization, balances, or blob proofs.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * TxEnvelopeEip8141.assert({
 *   chainId: 1,
 *   frames: [{ gas: 50_000n, mode: 'verify' }],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function assert(envelope: PartialBy<TxEnvelopeEip8141, 'type'>): void {
  const {
    blobVersionedHashes = [],
    chainId,
    frames,
    maxFeePerBlobGas = 0n,
    maxFeePerGas = 0n,
    maxPriorityFeePerGas = 0n,
    nonce = 0n,
    sender,
    signatures = [],
  } = envelope
  if (
    (typeof chainId !== 'bigint' &&
      (typeof chainId !== 'number' || !Number.isSafeInteger(chainId))) ||
    BigInt(chainId) < 0n ||
    BigInt(chainId) >= 2n ** 256n
  )
    throw new InvalidError(
      'chainId must be an unsigned 256-bit integer; use bigint for large IDs.',
    )
  Address.assert(sender, { strict: false })
  for (const [field, value, bits] of [
    ['maxFeePerBlobGas', maxFeePerBlobGas, 256n],
    ['maxFeePerGas', maxFeePerGas, 256n],
    ['maxPriorityFeePerGas', maxPriorityFeePerGas, 256n],
    ['nonce', nonce, 64n],
  ] as const)
    if (typeof value !== 'bigint' || value < 0n || value >= 2n ** bits)
      throw new InvalidError(
        `${field} must be an unsigned ${bits}-bit integer.`,
      )
  if (maxPriorityFeePerGas > maxFeePerGas)
    throw new InvalidError('maxPriorityFeePerGas exceeds maxFeePerGas.')
  if (!Array.isArray(frames) || frames.length === 0 || frames.length > 64)
    throw new InvalidError('Expected between 1 and 64 frames.')
  if (!Array.isArray(signatures) || !Array.isArray(blobVersionedHashes))
    throw new InvalidError(
      'Signatures and blob versioned hashes must be lists.',
    )
  for (const hash of blobVersionedHashes) {
    Hex.assert(hash, { strict: true })
    if (Hex.size(hash) !== 32 || Hex.slice(hash, 0, 1) !== '0x01')
      throw new InvalidError(
        'Blob versioned hashes must contain 32 bytes and version 0x01.',
      )
  }
  if (blobVersionedHashes.length === 0 && maxFeePerBlobGas !== 0n)
    throw new InvalidError('maxFeePerBlobGas must be zero without blobs.')
  let gas = 0n
  let stateGas = 0n
  let previousBatch = false
  let expiry = false
  let tokens = 0n
  let size = 0n
  let intrinsic = 12_000n + BigInt(frames.length) * 475n
  const count = (data: Hex.Hex) => {
    for (const byte of Hex.toBytes(data)) tokens += byte === 0 ? 1n : 4n
    size += BigInt(Hex.size(data))
  }
  for (const [index, frame] of (frames as readonly Frame.Frame[]).entries()) {
    Frame.assert(frame)
    const flags =
      typeof frame.flags === 'string'
        ? Frame.flags[frame.flags]
        : (frame.flags ?? 0)
    const batch = (flags & 4) !== 0
    if (
      flags & 2 &&
      frame.target !== undefined &&
      !Address.isEqual(frame.target, sender)
    )
      throw new InvalidError('Execution approval must target the sender.')
    if ((batch || previousBatch) && flags & 3)
      throw new InvalidError('Atomic batches cannot contain approval frames.')
    if (batch) {
      const next = frames[index + 1]
      if (!next || next.mode === 1 || next.mode === 'verify')
        throw new InvalidError(
          'An atomic batch requires a following non-verify frame.',
        )
    }
    previousBatch = batch
    if (
      (frame.mode === 1 || frame.mode === 'verify') &&
      frame.target?.toLowerCase() ===
        '0x0000000000000000000000000000000000008141'
    ) {
      if (
        expiry ||
        flags !== 0 ||
        (frame.stateGas ?? 0n) !== 0n ||
        Hex.size(frame.data ?? '0x') !== 8
      )
        throw new InvalidError('Invalid or duplicate expiry verifier frame.')
      expiry = true
    }
    gas += frame.gas ?? 0n
    stateGas += frame.stateGas ?? 0n
    count(frame.data ?? '0x')
    if (
      (frame.value ?? 0n) > 0n &&
      frame.target !== undefined &&
      !Address.isEqual(frame.target, sender)
    )
      intrinsic += 6_000n
  }
  for (const entry of signatures) {
    const [scheme, signer, payload, signature] = FrameSignature.toTuple(entry)
    intrinsic += scheme === '0x' ? 100n : scheme === '0x01' ? 2_800n : 6_700n
    count(signer)
    count(payload)
    count(signature)
  }
  if (gas + stateGas >= 2n ** 64n)
    throw new InvalidError('Combined frame gas must be less than 2^64.')
  if (
    intrinsic + tokens * 4n + gas > 16_777_216n ||
    intrinsic + size * 64n > 16_777_216n
  )
    throw new InvalidError('Transaction execution gas exceeds 16777216.')
}
export declare namespace assert {
  type ErrorType =
    | InvalidError
    | Frame.assert.ErrorType
    | FrameSignature.toTuple.ErrorType
    | Address.assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Deserializes an EIP-8141 transaction body or PeerDAS network wrapper.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * const serialized = TxEnvelopeEip8141.serialize({
 *   chainId: 1,
 *   frames: [{}],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 *
 * const envelope = TxEnvelopeEip8141.deserialize(serialized)
 * ```
 *
 * @param serialized - Serialized transaction or network wrapper.
 * @returns The transaction envelope.
 */
export function deserialize(serialized: Serialized): TxEnvelopeEip8141 {
  Hex.assert(serialized, { strict: true })
  if (Hex.slice(serialized, 0, 1) !== serializedType)
    throw new InvalidError('Expected transaction type 0x06.')
  const decoded = Rlp.toHex(Hex.slice(serialized, 1))
  if (!Array.isArray(decoded))
    throw new InvalidError('Expected a transaction list.')
  const wrapped = Array.isArray(decoded[0])
  const body = wrapped ? decoded[0] : decoded
  if (!Array.isArray(body) || body.length !== 7)
    throw new InvalidError('Expected seven transaction fields.')
  const [chainId, nonce, sender, frames, signatures, fees, hashes] = body
  if (
    typeof sender !== 'string' ||
    !Array.isArray(frames) ||
    !Array.isArray(signatures) ||
    !Array.isArray(fees) ||
    fees.length !== 3 ||
    !Array.isArray(hashes) ||
    hashes.some((hash) => typeof hash !== 'string')
  )
    throw new InvalidError('Invalid transaction field shape.')
  const integer = (value: unknown): bigint => {
    if (
      typeof value !== 'string' ||
      (value !== '0x' && value.startsWith('0x00'))
    )
      throw new InvalidError('Expected a minimally encoded integer.')
    return value === '0x' ? 0n : Hex.toBigInt(value as Hex.Hex)
  }
  const id = integer(chainId)
  const envelope: TxEnvelopeEip8141 = {
    blobVersionedHashes: hashes as Hex.Hex[],
    chainId: id <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(id) : id,
    frames: frames.map((frame) => Frame.fromTuple(frame as Frame.Tuple)),
    maxFeePerBlobGas: integer(fees[2]),
    maxFeePerGas: integer(fees[1]),
    maxPriorityFeePerGas: integer(fees[0]),
    nonce: integer(nonce),
    sender: sender as Address.Address,
    signatures: signatures.map((entry) =>
      FrameSignature.fromTuple(entry as FrameSignature.Tuple),
    ),
    type,
  }
  if (wrapped) {
    if (
      decoded.length !== 5 ||
      decoded[1] !== '0x01' ||
      !Array.isArray(decoded[2]) ||
      !Array.isArray(decoded[3]) ||
      !Array.isArray(decoded[4])
    )
      throw new InvalidError('Expected a version 1 PeerDAS wrapper.')
    envelope.sidecars = {
      blobs: decoded[2] as Hex.Hex[],
      cellProofs: decoded[4] as Hex.Hex[],
      commitments: decoded[3] as Hex.Hex[],
    }
  }
  assert(envelope)
  // Re-encoding rejects nonminimal RLP lengths as well as malformed nested lists.
  if (serialize(envelope).toLowerCase() !== serialized.toLowerCase())
    throw new InvalidError('Noncanonical transaction encoding.')
  return envelope
}
export declare namespace deserialize {
  type ErrorType =
    | assert.ErrorType
    | Hex.slice.ErrorType
    | Rlp.toHex.ErrorType
    | serialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Creates an EIP-8141 transaction envelope from an object or serialized transaction.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * const envelope = TxEnvelopeEip8141.from({
 *   chainId: 1,
 *   frames: [{ flags: 'approveExecutionAndPayment', gas: 50_000n, mode: 'verify' }],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 * ```
 *
 * @param envelope - An envelope object or serialized transaction.
 * @returns The envelope with its transaction type.
 */
export function from<
  const envelope extends PartialBy<TxEnvelopeEip8141, 'type'> | Serialized,
>(envelope: envelope): from.ReturnType<envelope> {
  const value = (
    typeof envelope === 'string' ? deserialize(envelope) : envelope
  ) as PartialBy<TxEnvelopeEip8141, 'type'>
  assert(value)
  return { ...value, type } as from.ReturnType<envelope>
}
export declare namespace from {
  type ReturnType<
    envelope extends PartialBy<TxEnvelopeEip8141, 'type'> | Serialized,
  > = envelope extends Serialized
    ? TxEnvelopeEip8141
    : Compute<Assign<envelope, { readonly type: Type }>>
  type ErrorType =
    | assert.ErrorType
    | deserialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the canonical signing payload of an EIP-8141 envelope.
 *
 * Elides signature bytes only for entries with an empty payload. Explicit-payload
 * signatures remain committed. The envelope is not mutated.
 *
 * @example
 * ### Signing
 *
 * ```ts twoslash
 * import { Address, FrameSignature, Secp256k1, TxEnvelopeEip8141 } from 'ox'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
 * const envelope = TxEnvelopeEip8141.from({
 *   chainId: 1,
 *   frames: [{ flags: 'approveExecutionAndPayment', gas: 50_000n, mode: 'verify' }],
 *   sender,
 *   signatures: [FrameSignature.from({ scheme: 'secp256k1' })]
 * })
 *
 * const payload = TxEnvelopeEip8141.getSignPayload(envelope)
 * const signature = Secp256k1.sign({ payload, privateKey })
 * const signed = TxEnvelopeEip8141.from({
 *   ...envelope,
 *   signatures: [FrameSignature.from({ scheme: 'secp256k1', signature })]
 * })
 * ```
 *
 * @param envelope - The transaction envelope to sign.
 * @returns The canonical signing digest.
 */
export function getSignPayload(
  envelope: PartialBy<TxEnvelopeEip8141, 'type'>,
): Hex.Hex {
  return hash(envelope, { presign: true })
}
export declare namespace getSignPayload {
  type ErrorType = hash.ErrorType
}

/**
 * Hashes an EIP-8141 transaction, excluding its blob sidecars.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * const hash = TxEnvelopeEip8141.hash({
 *   chainId: 1,
 *   frames: [{}],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to hash.
 * @param options - Hashing options.
 * @returns The transaction hash or signing digest.
 */
export function hash(
  envelope: PartialBy<TxEnvelopeEip8141, 'type'>,
  options: hash.Options = {},
): Hex.Hex {
  assert(envelope)
  const body = toTuple(envelope)
  if (options.presign)
    body[4] = body[4].map((entry) =>
      entry[2] === '0x' ? [entry[0], entry[1], entry[2], '0x'] : entry,
    )
  return Hash.keccak256(Hex.concat(serializedType, Rlp.fromHex(body)))
}
export declare namespace hash {
  type Options = {
    /** Whether to compute the canonical signing digest. @default false */
    presign?: boolean | undefined
  }
  type ErrorType =
    | assert.ErrorType
    | Hash.keccak256.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes an EIP-8141 envelope, including a PeerDAS wrapper when sidecars exist.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * const serialized = TxEnvelopeEip8141.serialize({
 *   chainId: 1,
 *   frames: [{ gas: 50_000n, mode: 'sender' }],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to serialize.
 * @returns The serialized transaction.
 */
export function serialize(
  envelope: PartialBy<TxEnvelopeEip8141, 'type'>,
): Serialized {
  assert(envelope)
  const body = toTuple(envelope)
  const { sidecars } = envelope
  if (sidecars) {
    const { blobs, cellProofs, commitments } = sidecars
    const hashes = envelope.blobVersionedHashes ?? []
    if (
      hashes.length === 0 ||
      blobs.length !== hashes.length ||
      commitments.length !== hashes.length ||
      cellProofs.length !== hashes.length * 128
    )
      throw new InvalidError('PeerDAS sidecar counts do not match blob hashes.')
    for (const [index, blob] of blobs.entries()) {
      Hex.assert(blob, { strict: true })
      const commitment = commitments[index]!
      Hex.assert(commitment, { strict: true })
      if (
        Hex.size(blob) !== Blobs.bytesPerBlob ||
        Hex.size(commitment) !== 48 ||
        Blobs.commitmentToVersionedHash(commitment).toLowerCase() !==
          hashes[index]!.toLowerCase()
      )
        throw new InvalidError('Invalid blob size or commitment.')
    }
    for (const proof of cellProofs) {
      Hex.assert(proof, { strict: true })
      if (Hex.size(proof) !== 48)
        throw new InvalidError('Cell proofs must contain 48 bytes.')
    }
    return Hex.concat(
      serializedType,
      Rlp.fromHex([body, '0x01', blobs, commitments, cellProofs]),
    ) as Serialized
  }
  return Hex.concat(serializedType, Rlp.fromHex(body)) as Serialized
}
export declare namespace serialize {
  type ErrorType =
    | assert.ErrorType
    | Rlp.fromHex.ErrorType
    | Hex.concat.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns whether an EIP-8141 envelope satisfies structural constraints.
 *
 * @example
 * ### Basic Usage
 *
 * ```ts twoslash
 * import { TxEnvelopeEip8141 } from 'ox'
 *
 * const valid = TxEnvelopeEip8141.validate({
 *   chainId: 1,
 *   frames: [{}],
 *   sender: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 * @returns Whether the envelope is structurally valid.
 */
export function validate(
  envelope: PartialBy<TxEnvelopeEip8141, 'type'>,
): boolean {
  try {
    assert(envelope)
    return true
  } catch {
    return false
  }
}
export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when an EIP-8141 envelope is structurally invalid. */
export class InvalidError extends Errors.BaseError {
  override readonly name = 'TxEnvelopeEip8141.InvalidError'
  constructor(reason: string) {
    super(reason)
  }
}

function toTuple(envelope: PartialBy<TxEnvelopeEip8141, 'type'>) {
  const quantity = (value: bigint | number | undefined): Hex.Hex =>
    value ? Hex.fromBytes(Bytes.fromNumber(value)) : '0x'
  return [
    quantity(envelope.chainId),
    quantity(envelope.nonce),
    envelope.sender,
    envelope.frames.map((frame) => Frame.toTuple(frame)),
    (envelope.signatures ?? []).map((entry) => FrameSignature.toTuple(entry)),
    [
      quantity(envelope.maxPriorityFeePerGas),
      quantity(envelope.maxFeePerGas),
      quantity(envelope.maxFeePerBlobGas),
    ],
    envelope.blobVersionedHashes ?? [],
  ] satisfies [
    Hex.Hex,
    Hex.Hex,
    Address.Address,
    Frame.Tuple[],
    FrameSignature.Tuple[],
    Hex.Hex[],
    readonly Hex.Hex[],
  ]
}
