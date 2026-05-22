import type * as Address from './Address.js'
import * as Errors from './Errors.js'
import type * as Hash from './Hash.js'
import * as Hex from './Hex.js'
import type { Compute, UnionPartialBy } from './internal/types.js'
import type * as Signature from './Signature.js'
import * as Transaction from './Transaction.js'
import type * as TransactionRequest from './TransactionRequest.js'
import * as TxEnvelopeEip1559 from './TxEnvelopeEip1559.js'
import * as TxEnvelopeEip2930 from './TxEnvelopeEip2930.js'
import * as TxEnvelopeEip4844 from './TxEnvelopeEip4844.js'
import * as TxEnvelopeEip7702 from './TxEnvelopeEip7702.js'
import * as TxEnvelopeLegacy from './TxEnvelopeLegacy.js'
import * as Value from './Value.js'

/** Base type for a Transaction Envelope. Transaction Envelopes inherit this type. */
export type Base<
  type extends string = string,
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Contract code or a hashed method call with encoded args */
    data?: Hex.Hex | undefined
    /** @alias `data` – added for TransactionEnvelope - Transaction compatibility. */
    input?: Hex.Hex | undefined
    /**
     * Sender of the transaction. RPC-only metadata; not part of the
     * serialized envelope. Carried here for parity with
     * {@link ox#TransactionRequest.TransactionRequest} and
     * {@link ox#Transaction.Transaction}.
     */
    from?: Address.Address | undefined
    /** Gas provided for transaction execution */
    gas?: bigintType | undefined
    /** Unique number identifying this transaction */
    nonce?: bigintType | undefined
    /** Transaction recipient */
    to?: Address.Address | null | undefined
    /** Transaction type */
    type: type
    /** Value in wei sent with this transaction */
    value?: bigintType | undefined
    /** ECDSA signature r. */
    r?: Hex.Hex | undefined
    /** ECDSA signature s. */
    s?: Hex.Hex | undefined
    /** ECDSA signature yParity. */
    yParity?: numberType | undefined
    /** @deprecated ECDSA signature v (for backwards compatibility). */
    v?: numberType | undefined
  } & (signed extends true ? { r: Hex.Hex; s: Hex.Hex } : {})
>

/** RPC representation of a {@link ox#(TransactionEnvelope:namespace).Base}. */
export type BaseRpc<
  type extends string = string,
  signed extends boolean = boolean,
> = Base<type, signed, Hex.Hex, Hex.Hex>

/** Signed representation of a {@link ox#(TransactionEnvelope:namespace).Base}. */
export type BaseSigned<type extends string = string> = Base<type, true>

/** Transaction Envelope. */
export type TxEnvelope<
  signed extends boolean = false,
  bigintType = bigint,
  numberType = number,
> = UnionPartialBy<
  | TxEnvelopeLegacy.TxEnvelopeLegacy<signed, bigintType, numberType>
  | TxEnvelopeEip2930.TxEnvelopeEip2930<signed, bigintType, numberType>
  | TxEnvelopeEip1559.TxEnvelopeEip1559<signed, bigintType, numberType>
  | TxEnvelopeEip4844.TxEnvelopeEip4844<signed, bigintType, numberType>
  | TxEnvelopeEip7702.TxEnvelopeEip7702<signed, bigintType, numberType>,
  'type'
>

/** RPC representation of a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}. */
export type Rpc<signed extends boolean = false> =
  | TxEnvelopeLegacy.Rpc<signed>
  | TxEnvelopeEip2930.Rpc<signed>
  | TxEnvelopeEip1559.Rpc<signed>
  | TxEnvelopeEip4844.Rpc<signed>
  | TxEnvelopeEip7702.Rpc<signed>

/** Serialized Transaction Envelope. */
export type Serialized =
  | TxEnvelopeLegacy.Serialized
  | TxEnvelopeEip2930.Serialized
  | TxEnvelopeEip1559.Serialized
  | TxEnvelopeEip4844.Serialized
  | TxEnvelopeEip7702.Serialized

/** Transaction Envelope type. */
export type Type =
  | TxEnvelopeLegacy.Type
  | TxEnvelopeEip2930.Type
  | TxEnvelopeEip1559.Type
  | TxEnvelopeEip4844.Type
  | TxEnvelopeEip7702.Type

type Typeable =
  | TxEnvelope
  | {
      readonly [key: string]: unknown
      readonly type?: string | undefined
    }

type HasDefined<envelope, key extends string> = envelope extends {
  [_ in key]: infer value
}
  ? [Exclude<value, undefined>] extends [never]
    ? false
    : true
  : false

/**
 * Asserts a {@link ox#(TransactionEnvelope:namespace).TxEnvelope} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * TransactionEnvelope.assert({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function assert(envelope: TxEnvelope) {
  const type = getType(envelope) as Type | string
  if (type === 'legacy') return TxEnvelopeLegacy.assert(envelope as never)
  if (type === 'eip2930') return TxEnvelopeEip2930.assert(envelope as never)
  if (type === 'eip1559') return TxEnvelopeEip1559.assert(envelope as never)
  if (type === 'eip4844') return TxEnvelopeEip4844.assert(envelope as never)
  if (type === 'eip7702') return TxEnvelopeEip7702.assert(envelope as never)
  return TxEnvelopeEip1559.assert(envelope as never)
}

export declare namespace assert {
  type ErrorType =
    | TxEnvelopeLegacy.assert.ErrorType
    | TxEnvelopeEip2930.assert.ErrorType
    | TxEnvelopeEip1559.assert.ErrorType
    | TxEnvelopeEip4844.assert.ErrorType
    | TxEnvelopeEip7702.assert.ErrorType
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Deserializes a {@link ox#(TransactionEnvelope:namespace).TxEnvelope} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserialize(
 *   '0x02df0180808080808080c0' as TransactionEnvelope.Serialized
 * )
 * ```
 *
 * @param serialized - The serialized transaction envelope.
 * @returns Deserialized Transaction Envelope.
 */
export function deserialize<const serialized extends Serialized | Hex.Hex>(
  serialized: serialized | Serialized | Hex.Hex,
): deserialize.ReturnType<serialized> {
  const type = getSerializedType(serialized)
  if (type === 'legacy')
    return TxEnvelopeLegacy.deserialize(serialized) as never
  if (type === 'eip2930')
    return TxEnvelopeEip2930.deserialize(serialized as never) as never
  if (type === 'eip1559')
    return TxEnvelopeEip1559.deserialize(serialized as never) as never
  if (type === 'eip4844')
    return TxEnvelopeEip4844.deserialize(serialized as never) as never
  return TxEnvelopeEip7702.deserialize(serialized as never) as never
}

export declare namespace deserialize {
  type ReturnType<serialized extends Serialized | Hex.Hex = Serialized> =
    serialized extends TxEnvelopeLegacy.Serialized
      ? TxEnvelopeLegacy.TxEnvelopeLegacy
      : serialized extends TxEnvelopeEip2930.Serialized
        ? TxEnvelopeEip2930.TxEnvelopeEip2930
        : serialized extends TxEnvelopeEip1559.Serialized
          ? TxEnvelopeEip1559.TxEnvelopeEip1559
          : serialized extends TxEnvelopeEip4844.Serialized
            ? TxEnvelopeEip4844.TxEnvelopeEip4844
            : serialized extends TxEnvelopeEip7702.Serialized
              ? TxEnvelopeEip7702.TxEnvelopeEip7702
              : TxEnvelope

  type ErrorType =
    | getSerializedType.ErrorType
    | TxEnvelopeLegacy.deserialize.ErrorType
    | TxEnvelopeEip2930.deserialize.ErrorType
    | TxEnvelopeEip1559.deserialize.ErrorType
    | TxEnvelopeEip4844.deserialize.ErrorType
    | TxEnvelopeEip7702.deserialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Converts an arbitrary transaction object or serialized transaction into a Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * ```
 *
 * @param envelope - The transaction envelope.
 * @param options - Options.
 * @returns Transaction Envelope.
 */
export function from<
  const envelope extends Typeable | Hex.Hex,
  const signature extends Signature.Signature | undefined = undefined,
>(
  envelope: envelope | Typeable | Hex.Hex,
  options: from.Options<signature> = {},
): from.ReturnType<envelope> {
  if (typeof envelope === 'string') return deserialize(envelope) as never

  const type = getType(envelope) as Type | string
  if (type === 'legacy')
    return TxEnvelopeLegacy.from(envelope as never, options) as never
  if (type === 'eip2930')
    return TxEnvelopeEip2930.from(envelope as never, options) as never
  if (type === 'eip1559')
    return TxEnvelopeEip1559.from(envelope as never, options) as never
  if (type === 'eip4844')
    return TxEnvelopeEip4844.from(envelope as never, options) as never
  if (type === 'eip7702')
    return TxEnvelopeEip7702.from(envelope as never, options) as never
  return TxEnvelopeEip1559.from(envelope as never, options) as never
}

export declare namespace from {
  type Options<signature extends Signature.Signature | undefined = undefined> =
    {
      /** Signature to append to the Transaction Envelope. */
      signature?: signature | Signature.Signature | undefined
    }

  type ReturnType<
    envelope extends Typeable | Hex.Hex = TxEnvelope | Hex.Hex,
    signature extends Signature.Signature | undefined = undefined,
  > = envelope extends Hex.Hex
    ? deserialize.ReturnType<envelope>
    : ReturnType_object<Extract<envelope, Typeable>, signature>

  type ReturnType_object<
    envelope extends Typeable,
    signature extends Signature.Signature | undefined = undefined,
  > =
    getType.ReturnType<envelope> extends 'legacy'
      ? TxEnvelopeLegacy.from.ReturnType<
          envelope & TxEnvelopeLegacy.TxEnvelopeLegacy,
          signature
        >
      : getType.ReturnType<envelope> extends 'eip2930'
        ? TxEnvelopeEip2930.from.ReturnType<
            envelope & TxEnvelopeEip2930.TxEnvelopeEip2930,
            signature
          >
        : getType.ReturnType<envelope> extends 'eip4844'
          ? TxEnvelopeEip4844.from.ReturnType<
              envelope & TxEnvelopeEip4844.TxEnvelopeEip4844,
              signature
            >
          : getType.ReturnType<envelope> extends 'eip7702'
            ? TxEnvelopeEip7702.from.ReturnType<
                envelope & TxEnvelopeEip7702.TxEnvelopeEip7702,
                signature
              >
            : TxEnvelopeEip1559.from.ReturnType<
                Omit<envelope, 'type'> & TxEnvelopeEip1559.TxEnvelopeEip1559,
                signature
              >

  type ErrorType =
    | deserialize.ErrorType
    | TxEnvelopeLegacy.from.ErrorType
    | TxEnvelopeEip2930.from.ErrorType
    | TxEnvelopeEip1559.from.ErrorType
    | TxEnvelopeEip4844.from.ErrorType
    | TxEnvelopeEip7702.from.ErrorType
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Returns the payload to sign for a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const payload = TransactionEnvelope.getSignPayload({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * ```
 *
 * @param envelope - The transaction envelope.
 * @returns The sign payload.
 */
export function getSignPayload(envelope: TxEnvelope<false>): Hex.Hex {
  const type = getType(envelope) as Type | string
  if (type === 'legacy')
    return TxEnvelopeLegacy.getSignPayload(envelope as never)
  if (type === 'eip2930')
    return TxEnvelopeEip2930.getSignPayload(envelope as never)
  if (type === 'eip1559')
    return TxEnvelopeEip1559.getSignPayload(envelope as never)
  if (type === 'eip4844')
    return TxEnvelopeEip4844.getSignPayload(envelope as never)
  if (type === 'eip7702')
    return TxEnvelopeEip7702.getSignPayload(envelope as never)
  return TxEnvelopeEip1559.getSignPayload(envelope as never)
}

export declare namespace getSignPayload {
  type ReturnType = Hex.Hex

  type ErrorType =
    | TxEnvelopeLegacy.getSignPayload.ErrorType
    | TxEnvelopeEip2930.getSignPayload.ErrorType
    | TxEnvelopeEip1559.getSignPayload.ErrorType
    | TxEnvelopeEip4844.getSignPayload.ErrorType
    | TxEnvelopeEip7702.getSignPayload.ErrorType
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Returns the type of a Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const type = TransactionEnvelope.getType({
 *   maxFeePerGas: 1n
 * })
 * // @log: 'eip1559'
 * ```
 *
 * @param envelope - The transaction envelope.
 * @returns Transaction Envelope type.
 */
export function getType<const envelope extends Typeable>(
  envelope: envelope | Typeable,
): getType.ReturnType<envelope> {
  const type = envelope.type
  if (type) {
    // Guard against accidental RPC-style type strings that map to a known
    // canonical envelope type ('0x0'…'0x4'). Canonical envelopes use
    // 'legacy' | 'eip2930' | 'eip1559' | 'eip4844' | 'eip7702'. RPC payloads
    // should be normalized through `TransactionRequest.fromRpc` (which
    // translates via `Transaction.fromRpcType`) before reaching the envelope
    // layer. Other custom `0x*` types (e.g. OP-Stack `0x7e`) pass through.
    if (typeof type === 'string' && type in Transaction.fromRpcType)
      throw new InvalidTypeError({ type })
    return type as never
  }

  if (
    'authorizationList' in envelope &&
    envelope.authorizationList !== undefined
  )
    return 'eip7702' as never
  if (
    ('blobs' in envelope && envelope.blobs !== undefined) ||
    ('blobVersionedHashes' in envelope &&
      envelope.blobVersionedHashes !== undefined) ||
    ('sidecars' in envelope && envelope.sidecars !== undefined) ||
    ('maxFeePerBlobGas' in envelope && envelope.maxFeePerBlobGas !== undefined)
  )
    return 'eip4844' as never
  if (
    ('maxFeePerGas' in envelope && envelope.maxFeePerGas !== undefined) ||
    ('maxPriorityFeePerGas' in envelope &&
      envelope.maxPriorityFeePerGas !== undefined)
  )
    return 'eip1559' as never
  if ('gasPrice' in envelope && envelope.gasPrice !== undefined) {
    if ('accessList' in envelope && envelope.accessList !== undefined)
      return 'eip2930' as never
    return 'legacy' as never
  }
  return 'eip1559' as never
}

export declare namespace getType {
  type ReturnType<envelope extends Typeable> = envelope extends {
    type: infer type extends string
  }
    ? type
    : HasDefined<envelope, 'authorizationList'> extends true
      ? TxEnvelopeEip7702.Type
      : HasDefined<envelope, 'blobs'> extends true
        ? TxEnvelopeEip4844.Type
        : HasDefined<envelope, 'blobVersionedHashes'> extends true
          ? TxEnvelopeEip4844.Type
          : HasDefined<envelope, 'sidecars'> extends true
            ? TxEnvelopeEip4844.Type
            : HasDefined<envelope, 'maxFeePerBlobGas'> extends true
              ? TxEnvelopeEip4844.Type
              : HasDefined<envelope, 'maxFeePerGas'> extends true
                ? TxEnvelopeEip1559.Type
                : HasDefined<envelope, 'maxPriorityFeePerGas'> extends true
                  ? TxEnvelopeEip1559.Type
                  : HasDefined<envelope, 'gasPrice'> extends true
                    ? HasDefined<envelope, 'accessList'> extends true
                      ? TxEnvelopeEip2930.Type
                      : TxEnvelopeLegacy.Type
                    : TxEnvelopeEip1559.Type

  type ErrorType = InvalidTypeError | Errors.GlobalErrorType
}

/**
 * Returns the type of a serialized Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const type = TransactionEnvelope.getSerializedType(
 *   '0x02df0180808080808080c0'
 * )
 * // @log: 'eip1559'
 * ```
 *
 * @param serialized - The serialized transaction envelope.
 * @returns Transaction Envelope type.
 */
export function getSerializedType<
  const serialized extends Serialized | Hex.Hex,
>(
  serialized: serialized | Serialized | Hex.Hex,
): getSerializedType.ReturnType<serialized> {
  if (Hex.size(serialized) === 0)
    throw new InvalidSerializedTypeError({ serialized })

  const serializedType = Hex.slice(serialized, 0, 1)
  if (serializedType === TxEnvelopeEip2930.serializedType)
    return 'eip2930' as never
  if (serializedType === TxEnvelopeEip1559.serializedType)
    return 'eip1559' as never
  if (serializedType === TxEnvelopeEip4844.serializedType)
    return 'eip4844' as never
  if (serializedType === TxEnvelopeEip7702.serializedType)
    return 'eip7702' as never
  if (Hex.toNumber(serializedType) >= 0xc0) return 'legacy' as never
  throw new InvalidSerializedTypeError({ serialized })
}

export declare namespace getSerializedType {
  type ReturnType<serialized extends Serialized | Hex.Hex = Serialized> =
    serialized extends TxEnvelopeEip2930.Serialized
      ? TxEnvelopeEip2930.Type
      : serialized extends TxEnvelopeEip1559.Serialized
        ? TxEnvelopeEip1559.Type
        : serialized extends TxEnvelopeEip4844.Serialized
          ? TxEnvelopeEip4844.Type
          : serialized extends TxEnvelopeEip7702.Serialized
            ? TxEnvelopeEip7702.Type
            : serialized extends TxEnvelopeLegacy.Serialized
              ? TxEnvelopeLegacy.Type
              : Type

  type ErrorType =
    | Hex.size.ErrorType
    | Hex.slice.ErrorType
    | Hex.toNumber.ErrorType
    | InvalidSerializedTypeError
    | Errors.GlobalErrorType
}

/**
 * Hashes a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const hash = TransactionEnvelope.hash(
 *   {
 *     chainId: 1,
 *     maxFeePerGas: 1n,
 *     type: 'eip1559'
 *   },
 *   { presign: true }
 * )
 * ```
 *
 * @param envelope - The transaction envelope to hash.
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function hash<presign extends boolean = false>(
  envelope: TxEnvelope<presign extends true ? false : true>,
  options: hash.Options<presign> = {},
): hash.ReturnType {
  const type = getType(envelope) as Type | string
  if (type === 'legacy')
    return TxEnvelopeLegacy.hash(envelope as never, options)
  if (type === 'eip2930')
    return TxEnvelopeEip2930.hash(envelope as never, options)
  if (type === 'eip1559')
    return TxEnvelopeEip1559.hash(envelope as never, options)
  if (type === 'eip4844')
    return TxEnvelopeEip4844.hash(envelope as never, options)
  if (type === 'eip7702')
    return TxEnvelopeEip7702.hash(envelope as never, options)
  return TxEnvelopeEip1559.hash(envelope as never, options)
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
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const serialized = TransactionEnvelope.serialize({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * ```
 *
 * @param envelope - The transaction envelope to serialize.
 * @param options - Options.
 * @returns Serialized transaction envelope.
 */
export function serialize<const envelope extends Typeable>(
  envelope: envelope | Typeable,
  options: serialize.Options = {},
): serialize.ReturnType<envelope> {
  const type = getType(envelope) as Type | string
  if (type === 'legacy')
    return TxEnvelopeLegacy.serialize(envelope as never, options) as never
  if (type === 'eip2930')
    return TxEnvelopeEip2930.serialize(envelope as never, options) as never
  if (type === 'eip1559')
    return TxEnvelopeEip1559.serialize(envelope as never, options) as never
  if (type === 'eip4844')
    return TxEnvelopeEip4844.serialize(envelope as never, options) as never
  if (type === 'eip7702')
    return TxEnvelopeEip7702.serialize(envelope as never, options) as never
  return TxEnvelopeEip1559.serialize(envelope as never, options) as never
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature.Signature | undefined
    /** PeerDAS sidecars to append, producing the 5-element network wrapper. */
    sidecars?: TxEnvelopeEip4844.Sidecars<Hex.Hex> | undefined
  }

  type ReturnType<envelope extends Typeable = TxEnvelope> =
    getType.ReturnType<envelope> extends 'legacy'
      ? TxEnvelopeLegacy.Serialized
      : getType.ReturnType<envelope> extends 'eip2930'
        ? TxEnvelopeEip2930.Serialized
        : getType.ReturnType<envelope> extends 'eip4844'
          ? TxEnvelopeEip4844.Serialized
          : getType.ReturnType<envelope> extends 'eip7702'
            ? TxEnvelopeEip7702.Serialized
            : TxEnvelopeEip1559.Serialized

  type ErrorType =
    | TxEnvelopeLegacy.serialize.ErrorType
    | TxEnvelopeEip2930.serialize.ErrorType
    | TxEnvelopeEip1559.serialize.ErrorType
    | TxEnvelopeEip4844.serialize.ErrorType
    | TxEnvelopeEip7702.serialize.ErrorType
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#(TransactionEnvelope:namespace).TxEnvelope} to an {@link ox#(TransactionEnvelope:namespace).Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope_rpc = TransactionEnvelope.toRpc({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * ```
 *
 * @param envelope - The transaction envelope.
 * @returns RPC representation.
 */
export function toRpc<const envelope extends TxEnvelope>(
  envelope: envelope | TxEnvelope,
): toRpc.ReturnType<envelope> {
  const type = getType(envelope) as Type | string
  if (type === 'legacy')
    return TxEnvelopeLegacy.toRpc(envelope as never) as never
  if (type === 'eip2930')
    return TxEnvelopeEip2930.toRpc(envelope as never) as never
  if (type === 'eip1559')
    return TxEnvelopeEip1559.toRpc(envelope as never) as never
  if (type === 'eip4844')
    return TxEnvelopeEip4844.toRpc(envelope as never) as never
  if (type === 'eip7702')
    return TxEnvelopeEip7702.toRpc(envelope as never) as never
  return TxEnvelopeEip1559.toRpc(envelope as never) as never
}

export declare namespace toRpc {
  export type ReturnType<envelope extends Typeable = TxEnvelope> =
    getType.ReturnType<envelope> extends 'legacy'
      ? TxEnvelopeLegacy.Rpc
      : getType.ReturnType<envelope> extends 'eip2930'
        ? TxEnvelopeEip2930.Rpc
        : getType.ReturnType<envelope> extends 'eip4844'
          ? TxEnvelopeEip4844.Rpc
          : getType.ReturnType<envelope> extends 'eip7702'
            ? TxEnvelopeEip7702.Rpc
            : TxEnvelopeEip1559.Rpc

  export type ErrorType =
    | TxEnvelopeLegacy.toRpc.ErrorType
    | TxEnvelopeEip2930.toRpc.ErrorType
    | TxEnvelopeEip1559.toRpc.ErrorType
    | TxEnvelopeEip4844.toRpc.ErrorType
    | TxEnvelopeEip7702.toRpc.ErrorType
    | InvalidTypeError
    | Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#(TransactionEnvelope:namespace).TxEnvelope} to a {@link ox#TransactionRequest.TransactionRequest}.
 *
 * Flattens any EIP-7594 `sidecars` back into the top-level `blobs` field.
 * Signature fields (`r`, `s`, `yParity`, `v`) are preserved — Ox's
 * `TransactionRequest` extends the Execution API `GenericTransaction`
 * shape to optionally carry signed payloads. Pair with
 * {@link ox#TransactionRequest.(toRpc:function)} to produce an
 * `eth_sendTransaction`-shaped payload.
 *
 * Note: the 4844 round-trip
 * `TxEnvelope → TransactionRequest → TxEnvelope` is **lossy** —
 * `sidecars.commitments` and `sidecars.cellProofs` are not preserved on
 * the `TransactionRequest` shape. Callers that need full round-trip
 * parity must carry sidecars out of band.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope, TxEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TxEnvelopeEip1559.from({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: 1n
 * })
 *
 * const request =
 *   TransactionEnvelope.toTransactionRequest(envelope)
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 1n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip1559',
 * // @log:   value: 1n,
 * // @log: }
 * ```
 *
 * @param envelope - The transaction envelope to convert.
 * @returns A transaction request.
 */
export function toTransactionRequest(
  envelope: TxEnvelope,
): TransactionRequest.TransactionRequest {
  const {
    // Flatten sidecars; surface their `blobs` payload instead.
    sidecars,
    blobs,
    ...rest
  } = envelope as TxEnvelope & {
    sidecars?: TxEnvelopeEip4844.Sidecars<Hex.Hex> | undefined
    blobs?: readonly Hex.Hex[] | undefined
  }

  const request: TransactionRequest.TransactionRequest = { ...rest }

  const blobs_ = blobs ?? sidecars?.blobs
  if (blobs_) request.blobs = blobs_

  return request
}

export declare namespace toTransactionRequest {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Validates a {@link ox#(TransactionEnvelope:namespace).TxEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const valid = TransactionEnvelope.validate({
 *   chainId: 1,
 *   maxFeePerGas: 1n,
 *   type: 'eip1559'
 * })
 * // @log: true
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function validate(envelope: TxEnvelope) {
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
 * Thrown when a fee cap is too high.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip1559 } from 'ox'
 *
 * TxEnvelopeEip1559.assert({
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
 *   chainId: 1
 * })
 * // @error: TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class FeeCapTooHighError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.FeeCapTooHighError'
  constructor({
    feeCap,
  }: {
    feeCap?: bigint | undefined
  } = {}) {
    super(
      `The fee cap (\`maxFeePerGas\`/\`maxPriorityFeePerGas\`${
        feeCap ? ` = ${Value.formatGwei(feeCap)} gwei` : ''
      }) cannot be higher than the maximum allowed value (2^256-1).`,
    )
  }
}

/**
 * Thrown when a gas price is too high.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeLegacy } from 'ox'
 *
 * TxEnvelopeLegacy.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1
 * })
 * // @error: TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class GasPriceTooHighError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.GasPriceTooHighError'
  constructor({
    gasPrice,
  }: {
    gasPrice?: bigint | undefined
  } = {}) {
    super(
      `The gas price (\`gasPrice\`${
        gasPrice ? ` = ${Value.formatGwei(gasPrice)} gwei` : ''
      }) cannot be higher than the maximum allowed value (2^256-1).`,
    )
  }
}

/**
 * Thrown when a chain ID is invalid.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip1559 } from 'ox'
 *
 * TxEnvelopeEip1559.assert({ chainId: 0 })
 * // @error: TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.
 * ```
 */
export class InvalidChainIdError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.InvalidChainIdError'
  constructor({ chainId }: { chainId?: number | undefined }) {
    super(
      typeof chainId !== 'undefined'
        ? `Chain ID "${chainId}" is invalid.`
        : 'Chain ID is invalid.',
    )
  }
}

/**
 * Thrown when a serialized transaction is invalid.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip1559 } from 'ox'
 *
 * TxEnvelopeEip1559.deserialize('0x02c0')
 * // @error: TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.
 * // @error: Serialized Transaction: "0x02c0"
 * // @error: Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList
 * ```
 */
export class InvalidSerializedError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.InvalidSerializedError'
  constructor({
    attributes,
    serialized,
    type,
  }: {
    attributes: Record<string, unknown>
    serialized: Hex.Hex
    type: string
  }) {
    const missing = Object.entries(attributes)
      .map(([key, value]) => (typeof value === 'undefined' ? key : undefined))
      .filter(Boolean)
    super(`Invalid serialized transaction of type "${type}" was provided.`, {
      metaMessages: [
        `Serialized Transaction: "${serialized}"`,
        missing.length > 0 ? `Missing Attributes: ${missing.join(', ')}` : '',
      ].filter(Boolean),
    })
  }
}

/** Thrown when a serialized transaction type cannot be resolved. */
export class InvalidSerializedTypeError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.InvalidSerializedTypeError'

  constructor({ serialized }: { serialized: Hex.Hex }) {
    super('Serialized transaction type is invalid.', {
      metaMessages: [`Serialized Transaction: "${serialized}"`],
    })
  }
}

/** Thrown when a transaction envelope type cannot be resolved. */
export class InvalidTypeError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.InvalidTypeError'

  constructor({ type }: { type?: string | undefined } = {}) {
    super(
      type
        ? `Transaction type "${type}" is invalid.`
        : 'Cannot infer transaction type from provided envelope.',
    )
  }
}

/**
 * Thrown when a tip is higher than a fee cap.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeEip1559 } from 'ox'
 *
 * TxEnvelopeEip1559.assert({
 *   chainId: 1,
 *   maxFeePerGas: 10n,
 *   maxPriorityFeePerGas: 11n
 * })
 * // @error: TransactionEnvelope.TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).
 * ```
 */
export class TipAboveFeeCapError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.TipAboveFeeCapError'
  constructor({
    maxPriorityFeePerGas,
    maxFeePerGas,
  }: {
    maxPriorityFeePerGas?: bigint | undefined
    maxFeePerGas?: bigint | undefined
  } = {}) {
    super(
      [
        `The provided tip (\`maxPriorityFeePerGas\`${
          maxPriorityFeePerGas
            ? ` = ${Value.formatGwei(maxPriorityFeePerGas)} gwei`
            : ''
        }) cannot be higher than the fee cap (\`maxFeePerGas\`${
          maxFeePerGas ? ` = ${Value.formatGwei(maxFeePerGas)} gwei` : ''
        }).`,
      ].join('\n'),
    )
  }
}
