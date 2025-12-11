import * as AccessList from '../core/AccessList.js'
import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type {
  Assign,
  Compute,
  OneOf,
  PartialBy,
  UnionPartialBy,
} from '../core/internal/types.js'
import * as Rlp from '../core/Rlp.js'
import * as Signature from '../core/Signature.js'
import * as TransactionEnvelope from '../core/TxEnvelope.js'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as TokenId from './TokenId.js'

/**
 * Represents a single call within a Tempo transaction.
 *
 * Tempo transactions support batching multiple calls for atomic execution.
 *
 * [Batch Calls](https://docs.tempo.xyz/protocol/transactions#batch-calls)
 */
export type Call<bigintType = bigint> = {
  /** Call data. */
  data?: Hex.Hex | undefined
  /** The target address or contract creation. */
  to?: Address.Address | undefined
  /** Value to send (in wei). */
  value?: bigintType | undefined
}

/**
 * Tempo transaction envelope (type `0x76`).
 *
 * A new EIP-2718 transaction type exclusively available on Tempo, designed for payment
 * use cases with the following features:
 *
 * - **Configurable Fee Tokens**: Pay transaction fees with any USD-denominated TIP-20 token.
 *   The Fee AMM automatically converts to the validator's preferred token.
 *
 * - **Fee Sponsorship**: A third-party fee payer can pay fees on behalf of the sender using
 *   a dual-signature scheme (sender signs tx, fee payer signs over tx + sender address).
 *
 * - **Batch Calls**: Execute multiple operations atomically in a single transaction via
 *   the `calls` array, reducing overhead and simplifying wallet management.
 *
 * - **Access Keys**: Delegate signing to secondary keys with expiry and per-TIP-20 spending
 *   limits via `keyAuthorization`. Enables passkey UX without repeated prompts.
 *
 * - **Parallelizable Nonces**: Use different `nonceKey` values to submit multiple transactions
 *   in parallel without waiting for sequential nonce confirmation.
 *
 * - **Scheduled Transactions**: Set `validAfter` and `validBefore` timestamps to define a
 *   time window for when the transaction can be included in a block.
 *
 * - **Multi-Signature Support**: Sign with secp256k1, P256 (passkeys), or WebAuthn credentials.
 *
 * [Tempo Transaction Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction)
 */
export type TxEnvelopeTempo<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = Type,
> = Compute<
  {
    /** EIP-2930 Access List. */
    accessList?: AccessList.AccessList | undefined
    /** EIP-7702 (Tempo) Authorization list for the transaction. */
    authorizationList?:
      | AuthorizationTempo.ListSigned<bigintType, numberType>
      | undefined
    /** Array of calls to execute. */
    calls: readonly Call<bigintType>[]
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Sender of the transaction. */
    from?: Address.Address | undefined
    /** Gas provided for transaction execution */
    gas?: bigintType | undefined
    /** Fee payer signature. */
    feePayerSignature?:
      | Signature.Signature<true, bigintType, numberType>
      | null
      | undefined
    /** Fee token preference. Address or ID of the TIP-20 token. */
    feeToken?: TokenId.TokenIdOrAddress | undefined
    /**
     * Key authorization for provisioning a new access key.
     *
     * When present, this transaction will add the specified key to the AccountKeychain precompile,
     * before verifying the transaction signature.
     * The authorization must be signed with the root key, the tx can be signed by the Keychain signature.
     */
    keyAuthorization?:
      | KeyAuthorization.Signed<bigintType, numberType>
      | undefined
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
    /** Nonce key for 2D nonce system (192 bits). */
    nonceKey?: bigintType | undefined
    /** Unique number identifying this transaction */
    nonce?: bigintType | undefined
    /** Transaction type */
    type: type
    /** Transaction can only be included in a block before this timestamp. */
    validBefore?: numberType | undefined
    /** Transaction can only be included in a block after this timestamp. */
    validAfter?: numberType | undefined
  } & (signed extends true
    ? {
        signature: SignatureEnvelope.SignatureEnvelope<bigintType, numberType>
      }
    : {
        signature?:
          | SignatureEnvelope.SignatureEnvelope<bigintType, numberType>
          | undefined
      })
>

export type Rpc<signed extends boolean = boolean> = TxEnvelopeTempo<
  signed,
  Hex.Hex,
  Hex.Hex,
  '0x76'
>

export const feePayerMagic = '0x78' as const
export type FeePayerMagic = typeof feePayerMagic

export type Serialized = `${SerializedType}${string}`

export type Signed = TxEnvelopeTempo<true>

export const serializedType = '0x76' as const
export type SerializedType = typeof serializedType

export const type = 'tempo' as const
export type Type = typeof type

/**
 * Asserts a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * TxEnvelopeTempo.assert({
 *   calls: [{ to: '0x0000000000000000000000000000000000000000', value: 0n }],
 *   chainId: 1,
 *   maxFeePerGas: 1000000000n,
 * })
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function assert(envelope: PartialBy<TxEnvelopeTempo, 'type'>) {
  const {
    calls,
    chainId,
    maxFeePerGas,
    maxPriorityFeePerGas,
    validBefore,
    validAfter,
  } = envelope

  // Calls must not be empty
  if (!calls || calls.length === 0) throw new CallsEmptyError()

  // validBefore must be greater than validAfter if both are set
  if (
    typeof validBefore === 'number' &&
    typeof validAfter === 'number' &&
    validBefore <= validAfter
  ) {
    throw new InvalidValidityWindowError({
      validBefore: validBefore,
      validAfter: validAfter,
    })
  }

  // Validate each call
  if (calls)
    for (const call of calls)
      if (call.to) Address.assert(call.to, { strict: false })

  // Validate chain ID
  if (chainId <= 0)
    throw new TransactionEnvelope.InvalidChainIdError({ chainId })

  // Validate max fee per gas
  if (maxFeePerGas && BigInt(maxFeePerGas) > 2n ** 256n - 1n)
    throw new TransactionEnvelope.FeeCapTooHighError({
      feeCap: maxFeePerGas,
    })

  if (
    maxPriorityFeePerGas &&
    maxFeePerGas &&
    maxPriorityFeePerGas > maxFeePerGas
  )
    throw new TransactionEnvelope.TipAboveFeeCapError({
      maxFeePerGas,
      maxPriorityFeePerGas,
    })
}

export declare namespace assert {
  type ErrorType =
    | Address.assert.ErrorType
    | CallsEmptyError
    | InvalidValidityWindowError
    | Errors.GlobalErrorType
}

/**
 * Deserializes a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.deserialize('0x76f84a0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0808080')
 * // @log: {
 * // @log:   type: 'tempo',
 * // @log:   nonce: 785n,
 * // @log:   maxFeePerGas: 2000000000n,
 * // @log:   gas: 1000000n,
 * // @log:   calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', value: 1000000000000000000n }],
 * // @log: }
 * ```
 *
 * @param serialized - The serialized transaction.
 * @returns Deserialized Transaction Envelope.
 */
export function deserialize(serialized: Serialized): Compute<TxEnvelopeTempo> {
  const transactionArray = Rlp.toHex(Hex.slice(serialized, 1))

  const [
    chainId,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gas,
    calls,
    accessList,
    nonceKey,
    nonce,
    validBefore,
    validAfter,
    feeToken,
    feePayerSignatureOrSender,
    authorizationList,
    keyAuthorizationOrSignature,
    maybeSignature,
  ] = transactionArray as readonly Hex.Hex[]

  const keyAuthorization = Array.isArray(keyAuthorizationOrSignature)
    ? keyAuthorizationOrSignature
    : undefined
  const signature = keyAuthorization
    ? maybeSignature
    : keyAuthorizationOrSignature

  if (
    !(
      transactionArray.length === 13 ||
      transactionArray.length === 14 ||
      transactionArray.length === 15
    )
  )
    throw new TransactionEnvelope.InvalidSerializedError({
      attributes: {
        authorizationList,
        chainId,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        calls,
        accessList,
        keyAuthorization,
        nonceKey,
        nonce,
        validBefore,
        validAfter,
        feeToken,
        feePayerSignatureOrSender,
        ...(transactionArray.length > 12
          ? {
              signature,
            }
          : {}),
      },
      serialized,
      type,
    })

  let transaction = {
    chainId: Number(chainId),
    type,
  } as TxEnvelopeTempo

  if (Hex.validate(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex.validate(nonce))
    transaction.nonce = nonce === '0x' ? 0n : BigInt(nonce)
  if (Hex.validate(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (Hex.validate(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
    transaction.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas)
  if (Hex.validate(nonceKey))
    transaction.nonceKey = nonceKey === '0x' ? 0n : BigInt(nonceKey)
  if (Hex.validate(validBefore) && validBefore !== '0x')
    transaction.validBefore = Number(validBefore)
  if (Hex.validate(validAfter) && validAfter !== '0x')
    transaction.validAfter = Number(validAfter)
  if (Hex.validate(feeToken) && feeToken !== '0x')
    transaction.feeToken = feeToken

  // Parse calls array
  if (calls && calls !== '0x') {
    const callsArray = calls as unknown as readonly Hex.Hex[][]
    transaction.calls = callsArray.map((callTuple) => {
      const [to, value, data] = callTuple
      const call: Call = {}
      if (to && to !== '0x') call.to = to
      if (value && value !== '0x') call.value = BigInt(value)
      if (data && data !== '0x') call.data = data
      return call
    })
  }

  if (accessList?.length !== 0 && accessList !== '0x')
    transaction.accessList = AccessList.fromTupleList(accessList as never)

  if (authorizationList?.length !== 0 && authorizationList !== '0x')
    transaction.authorizationList = AuthorizationTempo.fromTupleList(
      authorizationList as never,
    )

  if (
    feePayerSignatureOrSender !== '0x' &&
    feePayerSignatureOrSender !== undefined
  ) {
    if (
      feePayerSignatureOrSender === '0x00' ||
      Address.validate(feePayerSignatureOrSender)
    )
      transaction.feePayerSignature = null
    else
      transaction.feePayerSignature = Signature.fromTuple(
        feePayerSignatureOrSender as never,
      )
  }

  if (keyAuthorization)
    transaction.keyAuthorization = KeyAuthorization.fromTuple(
      keyAuthorization as never,
    )

  const signatureEnvelope = signature
    ? SignatureEnvelope.deserialize(signature)
    : undefined
  if (signatureEnvelope)
    transaction = {
      ...transaction,
      signature: signatureEnvelope,
    }

  assert(transaction)

  return transaction
}

export declare namespace deserialize {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an arbitrary transaction object into a Tempo Transaction Envelope.
 *
 * Use this to create transaction envelopes with Tempo-specific features like batched calls,
 * fee tokens, access keys, and scheduled execution. Attach a signature using the `signature`
 * option after signing with {@link ox#TxEnvelopeTempo.(getSignPayload:function)}.
 *
 * [Tempo Transaction Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction)
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({ // [!code focus]
 *   chainId: 1, // [!code focus]
 *   calls: [{ // [!code focus]
 *     data: '0xdeadbeef', // [!code focus]
 *     to: '0x0000000000000000000000000000000000000000', // [!code focus]
 *   }], // [!code focus]
 *   maxFeePerGas: Value.fromGwei('10'), // [!code focus]
 *   maxPriorityFeePerGas: Value.fromGwei('1'), // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the transaction envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, Value } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x0000000000000000000000000000000000000000',
 *   }],
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TxEnvelopeTempo.from(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   calls: [{ to: '0x0000000000000000000000000000000000000000', value: 1000000000000000000n }],
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   type: 'tempo',
 * // @log:   r: 125...n,
 * // @log:   s: 642...n,
 * // @log:   yParity: 0,
 * // @log: }
 * ```
 *
 * @example
 * ### From Serialized
 *
 * It is possible to instantiate a Tempo Transaction Envelope from a {@link ox#TxEnvelopeTempo.Serialized} value.
 *
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from('0x76f84a0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0808080')
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   calls: [{
 * // @log:     data: '0xdeadbeef',
 * // @log:     to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * // @log:   }],
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   type: 'tempo',
 * // @log: }
 * ```
 *
 * @param envelope - The transaction object to convert.
 * @param options - Options.
 * @returns A Tempo Transaction Envelope.
 */
export function from<
  const envelope extends UnionPartialBy<TxEnvelopeTempo, 'type'> | Serialized,
  const signature extends SignatureEnvelope.from.Value | undefined = undefined,
>(
  envelope: envelope | UnionPartialBy<TxEnvelopeTempo, 'type'> | Serialized,
  options: from.Options<signature> = {},
): from.ReturnValue<envelope, signature> {
  const { feePayerSignature, signature } = options

  const envelope_ = (
    typeof envelope === 'string' ? deserialize(envelope) : envelope
  ) as TxEnvelopeTempo

  assert(envelope_)

  return {
    ...envelope_,
    ...(signature ? { signature: SignatureEnvelope.from(signature) } : {}),
    ...(feePayerSignature
      ? { feePayerSignature: Signature.from(feePayerSignature) }
      : {}),
    type: 'tempo',
  } as never
}

export declare namespace from {
  type Options<
    signature extends SignatureEnvelope.from.Value | undefined = undefined,
  > = {
    feePayerSignature?: Signature.Signature | null | undefined
    signature?: signature | SignatureEnvelope.from.Value | undefined
  }

  type ReturnValue<
    envelope extends UnionPartialBy<TxEnvelopeTempo, 'type'> | Hex.Hex =
      | TxEnvelopeTempo
      | Hex.Hex,
    signature extends SignatureEnvelope.from.Value | undefined = undefined,
  > = Compute<
    envelope extends Hex.Hex
      ? TxEnvelopeTempo
      : Assign<
          envelope,
          (signature extends SignatureEnvelope.from.Value
            ? { signature: SignatureEnvelope.from.ReturnValue<signature> }
            : {}) & {
            readonly type: 'tempo'
          }
        >
  >

  type ErrorType =
    | deserialize.ErrorType
    | assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Serializes a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}.
 *
 * RLP-encodes the transaction with type prefix `0x76`. For fee sponsorship, use `format: 'feePayer'`
 * to serialize with the fee payer magic `0x78` and the sender address.
 *
 * [RLP Encoding](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#rlp-encoding)
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Value } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x0000000000000000000000000000000000000000',
 *   }],
 *   maxFeePerGas: Value.fromGwei('10'),
 * })
 *
 * const serialized = TxEnvelopeTempo.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, Value } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x0000000000000000000000000000000000000000',
 *   }],
 *   maxFeePerGas: Value.fromGwei('10'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TxEnvelopeTempo.serialize(envelope, { // [!code focus]
 *   signature, // [!code focus]
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
  envelope: PartialBy<TxEnvelopeTempo, 'type'>,
  options: serialize.Options = {},
): Serialized {
  const {
    accessList,
    authorizationList,
    calls,
    chainId,
    feeToken,
    gas,
    keyAuthorization,
    nonce,
    nonceKey,
    maxFeePerGas,
    maxPriorityFeePerGas,
    validBefore,
    validAfter,
  } = envelope

  assert(envelope)

  const accessTupleList = AccessList.toTupleList(accessList)
  const signature = options.signature || envelope.signature

  const authorizationTupleList =
    AuthorizationTempo.toTupleList(authorizationList)

  // Encode calls as RLP list of [to, value, data] tuples
  const callsTupleList = calls.map((call) => [
    call.to ?? '0x',
    call.value ? Hex.fromNumber(call.value) : '0x',
    call.data ?? '0x',
  ])

  const feePayerSignatureOrSender = (() => {
    if (options.sender) return options.sender
    const feePayerSignature =
      typeof options.feePayerSignature !== 'undefined'
        ? options.feePayerSignature
        : envelope.feePayerSignature
    if (feePayerSignature === null) return '0x00'
    if (!feePayerSignature) return '0x'
    return Signature.toTuple(feePayerSignature)
  })()

  const serialized = [
    Hex.fromNumber(chainId),
    maxPriorityFeePerGas ? Hex.fromNumber(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex.fromNumber(maxFeePerGas) : '0x',
    gas ? Hex.fromNumber(gas) : '0x',
    callsTupleList,
    accessTupleList,
    nonceKey ? Hex.fromNumber(nonceKey) : '0x',
    nonce ? Hex.fromNumber(nonce) : '0x',
    typeof validBefore === 'number' ? Hex.fromNumber(validBefore) : '0x',
    typeof validAfter === 'number' ? Hex.fromNumber(validAfter) : '0x',
    typeof feeToken === 'bigint' || typeof feeToken === 'string'
      ? TokenId.toAddress(feeToken)
      : '0x',
    feePayerSignatureOrSender,
    authorizationTupleList,
    ...(keyAuthorization ? [KeyAuthorization.toTuple(keyAuthorization)] : []),
    ...(signature
      ? [SignatureEnvelope.serialize(SignatureEnvelope.from(signature))]
      : []),
  ] as const

  return Hex.concat(
    options.format === 'feePayer' ? feePayerMagic : serializedType,
    Rlp.fromHex(serialized),
  ) as Serialized
}

export declare namespace serialize {
  type Options = {
    /**
     * Sender signature to append to the serialized envelope.
     */
    signature?: SignatureEnvelope.from.Value | undefined
  } & OneOf<
    | {
        /**
         * Sender address to cover the fee of.
         */
        sender: Address.Address
        /**
         * Whether to serialize the transaction in the fee payer format.
         *
         * - If `'feePayer'`, then the transaction will be serialized in the fee payer format.
         * - If `undefined` (default), then the transaction will be serialized in the normal format.
         */
        format: 'feePayer'
      }
    | {
        /**
         * Fee payer signature or the sender to cover the fee of.
         *
         * - If `Signature.Signature`, then this is the fee payer signature.
         * - If `null`, then this indicates the envelope is intended to be signed by a fee payer.
         */
        feePayerSignature?: Signature.Signature | null | undefined
        format?: undefined
      }
  >

  type ErrorType =
    | assert.ErrorType
    | Hex.fromNumber.ErrorType
    | Signature.toTuple.ErrorType
    | Hex.concat.ErrorType
    | Rlp.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the payload to sign for a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}.
 *
 * Computes the keccak256 hash of the unsigned serialized transaction. Sign this payload
 * with secp256k1, P256, or WebAuthn, then attach the signature via {@link ox#TxEnvelopeTempo.(from:function)}.
 *
 * [Tempo Transaction Specification](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction)
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   }],
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 * })
 *
 * const payload = TxEnvelopeTempo.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function getSignPayload(
  envelope: TxEnvelopeTempo,
): getSignPayload.ReturnValue {
  return hash(envelope, { presign: true })
}

export declare namespace getSignPayload {
  type ReturnValue = Hex.Hex

  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Hashes a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   }],
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TxEnvelopeTempo.getSignPayload(envelope),
 *   privateKey: '0x...'
 * })
 *
 * const envelope_signed = TxEnvelopeTempo.from(envelope, { signature })
 *
 * const hash = TxEnvelopeTempo.hash(envelope_signed) // [!code focus]
 * ```
 *
 * @param envelope - The Tempo Transaction Envelope to hash.
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function hash<presign extends boolean = false>(
  envelope: TxEnvelopeTempo<presign extends true ? false : true>,
  options: hash.Options<presign> = {},
): hash.ReturnValue {
  const serialized = serialize({
    ...envelope,
    ...(options.presign
      ? {
          signature: undefined,
        }
      : {}),
  })
  return Hash.keccak256(serialized)
}

export declare namespace hash {
  type Options<presign extends boolean = false> = {
    /**
     * Whether to hash this transaction for signing.
     *
     * @default false
     */
    presign?: presign | boolean | undefined
  }

  type ReturnValue = Hex.Hex

  type ErrorType =
    | Hash.keccak256.ErrorType
    | serialize.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Returns the fee payer payload to sign for a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}.
 *
 * Fee sponsorship uses a dual-signature scheme: the sender signs the transaction, then a fee payer
 * signs over the transaction with the sender's address to commit to paying fees. The fee payer's
 * signature includes the `feeToken` and `sender_address`, using magic byte `0x78` for domain separation.
 *
 * [Fee Payer Signature](https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#fee-payer-signature)
 * [Fee Sponsorship Guide](https://docs.tempo.xyz/protocol/transactions#fee-sponsorship)
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1 } from 'ox'
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const envelope = TxEnvelopeTempo.from({
 *   chainId: 1,
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   }],
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 * })
 *
 * const payload = TxEnvelopeTempo.getFeePayerSignPayload(envelope, {
 *   sender: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
 * }) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the fee payer sign payload for.
 * @param options - Options.
 * @returns The fee payer sign payload.
 */
export function getFeePayerSignPayload(
  envelope: TxEnvelopeTempo,
  options: getFeePayerSignPayload.Options,
): getFeePayerSignPayload.ReturnValue {
  const { sender } = options
  const serialized = serialize(
    { ...envelope, signature: undefined },
    {
      sender,
      format: 'feePayer',
    },
  )
  return Hash.keccak256(serialized)
}

export declare namespace getFeePayerSignPayload {
  type Options = {
    /**
     * Sender address to cover the fee of.
     */
    sender: Address.Address
  }

  type ReturnValue = Hex.Hex

  type ErrorType = hash.ErrorType | Errors.GlobalErrorType
}

/**
 * Validates a {@link ox#TxEnvelopeTempo.TxEnvelopeTempo}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * const valid = TxEnvelopeTempo.validate({
 *   calls: [{
 *     data: '0xdeadbeef',
 *     to: '0x0000000000000000000000000000000000000000',
 *   }],
 *   chainId: 1,
 *   maxFeePerGas: 1000000000n,
 * })
 * // @log: true
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function validate(envelope: PartialBy<TxEnvelopeTempo, 'type'>) {
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
 * Thrown when a transaction's calls list is empty.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * TxEnvelopeTempo.assert({
 *   calls: [],
 *   chainId: 1,
 * })
 * // @error: TxEnvelopeTempo.CallsEmptyError: Calls list cannot be empty.
 * ```
 */
export class CallsEmptyError extends Errors.BaseError {
  override readonly name = 'TxEnvelopeTempo.CallsEmptyError'
  constructor() {
    super('Calls list cannot be empty.')
  }
}

/**
 * Thrown when validBefore is not greater than validAfter.
 *
 * @example
 * ```ts twoslash
 * import { TxEnvelopeTempo } from 'ox/tempo'
 *
 * TxEnvelopeTempo.assert({
 *   calls: [{ to: '0x0000000000000000000000000000000000000000' }],
 *   chainId: 1,
 *   validBefore: 100,
 *   validAfter: 200,
 * })
 * // @error: TxEnvelopeTempo.InvalidValidityWindowError: validBefore (100) must be greater than validAfter (200).
 * ```
 */
export class InvalidValidityWindowError extends Errors.BaseError {
  override readonly name = 'TxEnvelopeTempo.InvalidValidityWindowError'
  constructor({
    validBefore,
    validAfter,
  }: {
    validBefore: number
    validAfter: number
  }) {
    super(
      `validBefore (${validBefore}) must be greater than validAfter (${validAfter}).`,
    )
  }
}
