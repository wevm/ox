import * as AccessList from './AccessList.js'
import * as Blobs from './Blobs.js'
import type * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import * as Quantity from './internal/quantity.js'
import * as Tx from './internal/tx.js'
import type {
  Assign,
  Compute,
  PartialBy,
  UnionPartialBy,
} from './internal/types.js'
import * as Kzg from './Kzg.js'
import * as Rlp from './Rlp.js'
import * as Signature from './Signature.js'
import * as TransactionEnvelope from './TxEnvelope.js'
import * as TxEnvelopeEip1559 from './TxEnvelopeEip1559.js'

export type TxEnvelopeEip4844<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = Type,
> = Compute<
  TransactionEnvelope.Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList.AccessList | undefined
    /** Versioned hashes of blobs to be included in the transaction. */
    blobVersionedHashes: readonly Hex.Hex[]
    /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
    maxFeePerBlobGas?: bigintType | undefined
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
    /**
     * PeerDAS (EIP-7594) sidecars associated with this transaction. When
     * defined, the envelope serializes into the 5-element "PooledTransactions"
     * network wrapper (`rlp([tx_body, wrapper_version, blobs, commitments,
     * cell_proofs])`).
     */
    sidecars?: Sidecars<Hex.Hex> | undefined
  }
>

/**
 * PeerDAS (EIP-7594) sidecars carried alongside a type-3 transaction in the
 * `PooledTransactions` p2p message.
 *
 * - `blobs` — one 131,072-byte payload per blob (same shape as 4844).
 * - `commitments` — one KZG commitment per blob.
 * - `cellProofs` — flat list of `CELLS_PER_EXT_BLOB * blobs.length` cell KZG
 *   proofs (128 per blob). `cellProofs[i * 128 + j]` is the proof for cell
 *   `j` of `blobs[i]`'s extended form.
 */
export type Sidecars<
  type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes,
> = {
  blobs: readonly Blobs.Blob<type>[]
  commitments: readonly type[]
  cellProofs: readonly type[]
}

/** Current wire `wrapper_version` for the PeerDAS PooledTransactions wrapper. */
export const wrapperVersion = '0x01' as const

export type Rpc<signed extends boolean = boolean> = TxEnvelopeEip4844<
  signed,
  Hex.Hex,
  Hex.Hex,
  '0x3'
>

export type Serialized = `${SerializedType}${string}`

export const serializedType = '0x03' as const
export type SerializedType = typeof serializedType

export type Signed = TxEnvelopeEip4844<true>

export const type = 'eip4844' as const
export type Type = 'eip4844'

/**
 * Asserts a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip4844, Value } from 'ox'
 *
 * TxEnvelopeEip4844.assert({
 *   blobVersionedHashes: [],
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 * // @error: EmptyBlobVersionedHashesError: Blob versioned hashes must not be empty.
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function assert(envelope: PartialBy<TxEnvelopeEip4844, 'type'>) {
  const { blobVersionedHashes } = envelope
  // EIP-4844 requires at least one versioned blob hash. Treat a missing
  // field as an empty list to give callers a single, descriptive error
  // rather than a downstream RLP/serialization failure.
  if (!blobVersionedHashes || blobVersionedHashes.length === 0)
    throw new Blobs.EmptyBlobVersionedHashesError()
  for (const hash of blobVersionedHashes) {
    const size = Hex.size(hash)
    const version = Hex.toNumber(Hex.slice(hash, 0, 1))
    if (size !== 32)
      throw new Blobs.InvalidVersionedHashSizeError({ hash, size })
    if (version !== Kzg.versionedHashVersion)
      throw new Blobs.InvalidVersionedHashVersionError({
        hash,
        version,
      })
  }
  TxEnvelopeEip1559.assert(
    envelope as {} as TxEnvelopeEip1559.TxEnvelopeEip1559,
  )
}

export declare namespace assert {
  type ErrorType =
    | TxEnvelopeEip1559.assert.ErrorType
    | Hex.size.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.slice.ErrorType
    | Blobs.EmptyBlobVersionedHashesError
    | Blobs.InvalidVersionedHashSizeError
    | Blobs.InvalidVersionedHashVersionError
    | Errors.GlobalErrorType
}

/**
 * Deserializes a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip4844 } from 'ox'
 *
 * const envelope = TxEnvelopeEip4844.deserialize(
 *   '0x03ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0'
 * )
 * // @log: {
 * // @log:   blobVersionedHashes: [...],
 * // @log:   type: 'eip4844',
 * // @log:   nonce: 785n,
 * // @log:   maxFeePerGas: 2000000000n,
 * // @log:   gas: 1000000n,
 * // @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param serialized - The serialized transaction.
 * @returns Deserialized Transaction Envelope.
 */
export function deserialize(
  serialized: Serialized,
): Compute<TxEnvelopeEip4844> {
  const transactionOrWrapperArray = Rlp.toBytes(Hex.slice(serialized, 1))

  // PeerDAS (EIP-7594) PooledTransactions wrapper:
  //   rlp([tx_body, wrapper_version, blobs, commitments, cell_proofs])
  const hasWrapper =
    transactionOrWrapperArray.length === 5 &&
    Array.isArray(transactionOrWrapperArray[0]) &&
    !Array.isArray(transactionOrWrapperArray[1]) &&
    transactionOrWrapperArray[1] instanceof Uint8Array &&
    transactionOrWrapperArray[1].length === 1 &&
    transactionOrWrapperArray[1][0] === 0x01

  // Legacy 4-element wrapper (pre-PeerDAS) is no longer accepted.
  if (
    !hasWrapper &&
    transactionOrWrapperArray.length === 4 &&
    Array.isArray(transactionOrWrapperArray[0])
  )
    throw new LegacyBlobSidecarWrapperError({ serialized })

  const transactionArray = (
    hasWrapper
      ? (transactionOrWrapperArray[0] as ReadonlyArray<Bytes.Bytes>)
      : transactionOrWrapperArray
  ) as readonly (Bytes.Bytes | ReadonlyArray<Bytes.Bytes>)[]

  let wrapperBlobs: ReadonlyArray<Bytes.Bytes> | undefined
  let wrapperCommitments: ReadonlyArray<Bytes.Bytes> | undefined
  let wrapperCellProofs: ReadonlyArray<Bytes.Bytes> | undefined
  if (hasWrapper) {
    wrapperBlobs = transactionOrWrapperArray[2] as ReadonlyArray<Bytes.Bytes>
    wrapperCommitments =
      transactionOrWrapperArray[3] as ReadonlyArray<Bytes.Bytes>
    wrapperCellProofs =
      transactionOrWrapperArray[4] as ReadonlyArray<Bytes.Bytes>
  }

  const [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gas,
    to,
    value,
    data,
    accessList,
    maxFeePerBlobGas,
    blobVersionedHashes,
    yParity,
    r,
    s,
  ] = transactionArray

  if (!(transactionArray.length === 11 || transactionArray.length === 14))
    throw new TransactionEnvelope.InvalidSerializedError({
      attributes: {
        chainId,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        to,
        value,
        data,
        accessList,
        maxFeePerBlobGas,
        blobVersionedHashes,
        ...(transactionArray.length > 11
          ? {
              yParity,
              r,
              s,
            }
          : {}),
      },
      serialized,
      type,
    })

  let transaction = {
    blobVersionedHashes: (
      blobVersionedHashes as ReadonlyArray<Bytes.Bytes>
    ).map((b) => Tx.bytesToHex(b)),
    chainId: Number(Tx.bytesToBigIntOrZero(chainId as Bytes.Bytes)),
    type,
  } as TxEnvelopeEip4844
  const to_ = Tx.bytesToHexOrUndefined(to as Bytes.Bytes | undefined)
  if (to_) transaction.to = to_
  const gas_ = Tx.bytesToBigIntOrUndefined(gas as Bytes.Bytes | undefined)
  if (gas_ !== undefined) transaction.gas = gas_
  const data_ = Tx.bytesToHexOrUndefined(data as Bytes.Bytes | undefined)
  if (data_) transaction.data = data_
  if (nonce !== undefined)
    transaction.nonce = Tx.bytesToBigIntOrZero(nonce as Bytes.Bytes)
  const value_ = Tx.bytesToBigIntOrUndefined(value as Bytes.Bytes | undefined)
  if (value_ !== undefined) transaction.value = value_
  const maxFeePerBlobGas_ = Tx.bytesToBigIntOrUndefined(
    maxFeePerBlobGas as Bytes.Bytes | undefined,
  )
  if (maxFeePerBlobGas_ !== undefined)
    transaction.maxFeePerBlobGas = maxFeePerBlobGas_
  const maxFeePerGas_ = Tx.bytesToBigIntOrUndefined(
    maxFeePerGas as Bytes.Bytes | undefined,
  )
  if (maxFeePerGas_ !== undefined) transaction.maxFeePerGas = maxFeePerGas_
  const maxPriorityFeePerGas_ = Tx.bytesToBigIntOrUndefined(
    maxPriorityFeePerGas as Bytes.Bytes | undefined,
  )
  if (maxPriorityFeePerGas_ !== undefined)
    transaction.maxPriorityFeePerGas = maxPriorityFeePerGas_
  if (accessList && (accessList as readonly unknown[]).length !== 0)
    transaction.accessList = AccessList.fromTupleList(
      Tx.bytesTreeToHex(accessList as never) as never,
    )

  if (hasWrapper) {
    const blobs = wrapperBlobs as ReadonlyArray<Bytes.Bytes>
    const commitments = wrapperCommitments as ReadonlyArray<Bytes.Bytes>
    const cellProofs = wrapperCellProofs as ReadonlyArray<Bytes.Bytes>
    // PeerDAS cardinality: one commitment per blob, 128 cell proofs per blob,
    // one versioned hash per blob.
    if (
      blobs.length !== commitments.length ||
      cellProofs.length !== blobs.length * 128 ||
      blobs.length !== transaction.blobVersionedHashes.length
    )
      throw new TransactionEnvelope.InvalidSerializedError({
        attributes: {
          blobs: blobs.length,
          blobVersionedHashes: transaction.blobVersionedHashes.length,
          cellProofs: cellProofs.length,
          commitments: commitments.length,
        },
        serialized,
        type,
      })
    transaction.sidecars = {
      blobs: blobs.map((b) => Tx.bytesToHex(b)),
      commitments: commitments.map((c) => Tx.bytesToHex(c)),
      cellProofs: cellProofs.map((p) => Tx.bytesToHex(p)),
    }
  }

  const signature =
    r && s && yParity
      ? Signature.fromTuple([
          Tx.bytesToHex(yParity as Bytes.Bytes),
          Tx.bytesToHex(r as Bytes.Bytes),
          Tx.bytesToHex(s as Bytes.Bytes),
        ])
      : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TxEnvelopeEip4844

  assert(transaction)

  return transaction
}

export declare namespace deserialize {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an arbitrary transaction object into an EIP-4844 Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, TxEnvelopeEip4844, Value } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   chainId: 1,
 *   blobVersionedHashes,
 *   maxFeePerBlobGas: Value.fromGwei('3'),
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the transaction envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import {
 *   Blobs,
 *   Secp256k1,
 *   TxEnvelopeEip4844,
 *   Value
 * } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   maxFeePerBlobGas: Value.fromGwei('3'),
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TxEnvelopeEip4844.getSignPayload(envelope),
 *   privateKey: '0x...'
 * })
 *
 * const envelope_signed = TxEnvelopeEip4844.from(envelope, {
 *   // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   blobVersionedHashes: [...],
 * // @log:   chainId: 1,
 * // @log:   maxFeePerBlobGas: 3000000000n,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip4844',
 * // @log:   value: 1000000000000000000n,
 * // @log:   r: 125...n,
 * // @log:   s: 642...n,
 * // @log:   yParity: 0,
 * // @log: }
 * ```
 *
 * @example
 * ### From Serialized
 *
 * It is possible to instantiate an EIP-4844 Transaction Envelope from a {@link ox#TxEnvelopeEip4844.Serialized} value.
 *
 * ```ts twoslash
 * import { TxEnvelopeEip4844 } from 'ox'
 *
 * const envelope = TxEnvelopeEip4844.from(
 *   '0x03f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261'
 * )
 * // @log: {
 * // @log:   blobVersionedHashes: [...],
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip4844',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param envelope - The transaction object to convert.
 * @param options - Options.
 * @returns An EIP-4844 Transaction Envelope.
 */
export function from<
  const envelope extends UnionPartialBy<TxEnvelopeEip4844, 'type'> | Serialized,
  const signature extends Signature.Signature | undefined = undefined,
>(
  envelope: envelope | UnionPartialBy<TxEnvelopeEip4844, 'type'> | Serialized,
  options: from.Options<signature> = {},
): from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope_ = (
    typeof envelope === 'string' ? deserialize(envelope) : envelope
  ) as TxEnvelopeEip4844

  assert(envelope_)

  return {
    ...envelope_,
    ...(signature ? Signature.from(signature) : {}),
    type: 'eip4844',
  } as never
}

export declare namespace from {
  type Options<signature extends Signature.Signature | undefined = undefined> =
    {
      signature?: signature | Signature.Signature | undefined
    }

  type ReturnType<
    envelope extends UnionPartialBy<TxEnvelopeEip4844, 'type'> | Hex.Hex =
      | TxEnvelopeEip4844
      | Hex.Hex,
    signature extends Signature.Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex.Hex
      ? TxEnvelopeEip4844
      : Assign<
          envelope,
          (signature extends Signature.Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip4844'
          }
        >
  >

  type ErrorType =
    | deserialize.ErrorType
    | assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the payload to sign for a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, Secp256k1, TxEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n
 * })
 *
 * const payload = TxEnvelopeEip4844.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({
 *   payload,
 *   privateKey: '0x...'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function getSignPayload(
  envelope: TxEnvelopeEip4844,
): getSignPayload.ReturnType {
  return hash(envelope, { presign: true })
}

export declare namespace getSignPayload {
  type ReturnType = Hex.Hex

  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Hashes a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, TxEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n
 * })
 *
 * const hash = TxEnvelopeEip4844.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-4844 Transaction Envelope to hash.
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function hash<presign extends boolean = false>(
  envelope: TxEnvelopeEip4844<presign extends true ? false : true>,
  options: hash.Options<presign> = {},
): hash.ReturnType {
  const { presign } = options
  return Hash.keccak256(
    serialize({
      ...envelope,
      // Hashing must operate on the bare type-3 envelope, never the
      // PeerDAS PooledTransactions network wrapper.
      sidecars: undefined,
      ...(presign
        ? {
            r: undefined,
            s: undefined,
            yParity: undefined,
            v: undefined,
          }
        : {}),
    }),
  )
}

export declare namespace hash {
  type Options<presign extends boolean = false> = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: presign | boolean | undefined
  }

  type ReturnType = Hex.Hex

  type ErrorType =
    | Hash.keccak256.ErrorType
    | serialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, TxEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 *
 * const serialized = TxEnvelopeEip4844.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import {
 *   Blobs,
 *   Secp256k1,
 *   TxEnvelopeEip4844,
 *   Value
 * } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   maxFeePerBlobGas: Value.fromGwei('3'),
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TxEnvelopeEip4844.getSignPayload(envelope),
 *   privateKey: '0x...'
 * })
 *
 * const serialized = TxEnvelopeEip4844.serialize(envelope, {
 *   // [!code focus]
 *   signature // [!code focus]
 * }) // [!code focus]
 *
 * // ... send `serialized` transaction to JSON-RPC `eth_sendRawTransaction`
 * ```
 *
 * @param envelope - The Transaction Envelope to serialize.
 * @param options - Options.
 * @returns The serialized Transaction Envelope.
 */
export function serialize(
  envelope: PartialBy<TxEnvelopeEip4844, 'type'>,
  options: serialize.Options = {},
): Serialized {
  const {
    blobVersionedHashes,
    chainId,
    gas,
    nonce,
    to,
    value,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    accessList,
    data,
    input,
  } = envelope

  assert(envelope)

  const accessTupleList = AccessList.toTupleList(accessList)

  const signature = Signature.extract(options.signature || envelope)

  const serialized = [
    Hex.fromNumber(chainId),
    Tx.quantityToHex(nonce),
    Tx.quantityToHex(maxPriorityFeePerGas),
    Tx.quantityToHex(maxFeePerGas),
    Tx.quantityToHex(gas),
    to ?? '0x',
    Tx.quantityToHex(value),
    data ?? input ?? '0x',
    accessTupleList,
    Tx.quantityToHex(maxFeePerBlobGas),
    blobVersionedHashes ?? [],
    ...(signature ? Signature.toTuple(signature) : []),
  ] as const

  const sidecars = options.sidecars || envelope.sidecars
  if (sidecars) {
    // PeerDAS (EIP-7594) PooledTransactions wrapper:
    //   rlp([tx_body, wrapper_version, blobs, commitments, cell_proofs])
    return Hex.concat(
      '0x03',
      Rlp.fromHex([
        serialized,
        wrapperVersion,
        sidecars.blobs as readonly Hex.Hex[],
        sidecars.commitments as readonly Hex.Hex[],
        sidecars.cellProofs as readonly Hex.Hex[],
      ]),
    ) as Serialized
  }

  return Hex.concat('0x03', Rlp.fromHex(serialized)) as Serialized
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature.Signature | undefined
    /** PeerDAS sidecars to append, producing the 5-element network wrapper. */
    sidecars?: Sidecars<Hex.Hex> | undefined
  }

  type ErrorType =
    | assert.ErrorType
    | Hex.fromNumber.ErrorType
    | Signature.toTuple.ErrorType
    | Hex.concat.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844} to an {@link ox#TxEnvelopeEip4844.Rpc}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import {
 *   Blobs,
 *   RpcRequest,
 *   TxEnvelopeEip4844,
 *   Value
 * } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, {
 *   kzg
 * })
 *
 * const envelope = TxEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   gas: 21000n,
 *   maxFeePerBlobGas: Value.fromGwei('20'),
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1')
 * })
 *
 * const envelope_rpc = TxEnvelopeEip4844.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc]
 * })
 * ```
 *
 * @param envelope - The EIP-4844 transaction envelope to convert.
 * @returns An RPC-formatted EIP-4844 transaction envelope.
 */
export function toRpc(envelope: toRpc.Input): Rpc {
  const signature = Signature.extract(envelope)

  return {
    ...envelope,
    chainId: Quantity.fromNumberish(envelope.chainId),
    data: envelope.data ?? envelope.input,
    ...(envelope.gas !== undefined
      ? { gas: Quantity.fromNumberish(envelope.gas) }
      : {}),
    ...(envelope.nonce !== undefined
      ? { nonce: Quantity.fromNumberish(envelope.nonce) }
      : {}),
    ...(envelope.value !== undefined
      ? { value: Quantity.fromNumberish(envelope.value) }
      : {}),
    ...(envelope.maxFeePerBlobGas !== undefined
      ? { maxFeePerBlobGas: Quantity.fromNumberish(envelope.maxFeePerBlobGas) }
      : {}),
    ...(envelope.maxFeePerGas !== undefined
      ? { maxFeePerGas: Quantity.fromNumberish(envelope.maxFeePerGas) }
      : {}),
    ...(envelope.maxPriorityFeePerGas !== undefined
      ? {
          maxPriorityFeePerGas: Quantity.fromNumberish(
            envelope.maxPriorityFeePerGas,
          ),
        }
      : {}),
    type: '0x3',
    ...(signature ? Signature.toRpc(signature) : {}),
  } as never
}

export declare namespace toRpc {
  /** Numberish input accepted by {@link ox#TxEnvelopeEip4844.(toRpc:function)}. */
  export type Input = Omit<
    TxEnvelopeEip4844<boolean, Hex.Hex | bigint | number, Hex.Hex | number>,
    'type'
  >

  export type ErrorType = Signature.extract.ErrorType | Errors.GlobalErrorType
}

/**
 * Validates a {@link ox#TxEnvelopeEip4844.TxEnvelopeEip4844}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip4844, Value } from 'ox'
 *
 * const valid = TxEnvelopeEip4844.assert({
 *   blobVersionedHashes: [],
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1')
 * })
 * // @log: false
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function validate(envelope: PartialBy<TxEnvelopeEip4844, 'type'>) {
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

/**
 * Thrown when attempting to deserialize a legacy 4-element EIP-4844 network
 * wrapper. Only the PeerDAS (EIP-7594) 5-element wrapper with
 * `wrapper_version = 0x01` is accepted.
 */
export class LegacyBlobSidecarWrapperError extends Errors.BaseError {
  override readonly name = 'TxEnvelopeEip4844.LegacyBlobSidecarWrapperError'
  constructor({ serialized }: { serialized: Hex.Hex }) {
    super(
      'Legacy 4-element EIP-4844 blob-sidecar network wrapper is not supported.',
      {
        metaMessages: [
          `Serialized Transaction: "${serialized}"`,
          'Expected: PeerDAS 5-element wrapper `rlp([tx_body, wrapper_version=0x01, blobs, commitments, cell_proofs])`.',
        ],
      },
    )
  }
}
