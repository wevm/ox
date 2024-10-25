import type { Hex } from '../../Hex.js'
import * as Value from '../../Value.js'
import { BaseError } from '../Errors/base.js'
import { prettyPrint } from '../Errors/utils.js'

/**
 * Thrown when a transaction type cannot be inferred.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const tx = TransactionEnvelope.from({
 *   chainId: 1,
 * })
 * // @error: TransactionEnvelope.CannotInferTypeError: Cannot infer a transaction type from provided transaction.
 * ```
 *
 * ### Solution
 *
 * Provide a `type` to the transaction, or a property that will infer the type.
 *
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const tx = TransactionEnvelope.from({
 *   chainId: 1,
 *   type: 'eip1559', // [!code ++]
 * })
 * ```
 */
export class TransactionEnvelope_CannotInferTypeError extends BaseError {
  override readonly name = 'TransactionEnvelope.CannotInferTypeError'
  constructor({ transaction }: { transaction: Record<string, unknown> }) {
    super('Cannot infer a transaction type from provided transaction.', {
      metaMessages: [
        'Provided Transaction:',
        '{',
        prettyPrint(transaction),
        '}',
        '',
        'To infer the type, either provide:',
        '- a `type` to the Transaction, or',
        '- an EIP-1559 Transaction with `maxFeePerGas`, or',
        '- an EIP-2930 Transaction with `gasPrice` & `accessList`, or',
        '- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or',
        '- an EIP-7702 Transaction with `authorizationList`, or',
        '- a Legacy Transaction with `gasPrice`',
      ],
    })
  }
}

/**
 * Thrown when a fee cap is too high.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * TransactionEnvelope.assert({
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   type: 'eip1559',
 * })
 * // @error: TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class TransactionEnvelope_FeeCapTooHighError extends BaseError {
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
 * import { TransactionEnvelope } from 'ox'
 *
 * TransactionEnvelope.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   type: 'legacy',
 * })
 * // @error: TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class TransactionEnvelope_GasPriceTooHighError extends BaseError {
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
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * TransactionEnvelopeEip1559.assert({ chainId: 0 })
 * // @error: TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.
 * ```
 */
export class TransactionEnvelope_InvalidChainIdError extends BaseError {
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
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * TransactionEnvelopeEip1559.deserialize('0x02c0')
 * // @error: TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.
 * // @error: Serialized Transaction: "0x02c0"
 * // @error: Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList
 * ```
 */
export class TransactionEnvelope_InvalidSerializedError extends BaseError {
  override readonly name = 'TransactionEnvelope.InvalidSerializedError'
  constructor({
    attributes,
    serializedTransaction,
    type,
  }: {
    attributes: Record<string, unknown>
    serializedTransaction: Hex
    type: string
  }) {
    const missing = Object.entries(attributes)
      .map(([key, value]) => (typeof value === 'undefined' ? key : undefined))
      .filter(Boolean)
    super(`Invalid serialized transaction of type "${type}" was provided.`, {
      metaMessages: [
        `Serialized Transaction: "${serializedTransaction}"`,
        missing.length > 0 ? `Missing Attributes: ${missing.join(', ')}` : '',
      ].filter(Boolean),
    })
  }
}

/**
 * Thrown when a transaction type is not implemented.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { TransactionEnvelope } from 'ox'
 *
 * TransactionEnvelope.from({ type: 'foo' })
 * // @error: TransactionEnvelope.TypeNotImplementedError: The provided transaction type `foo` is not implemented.
 * ```
 */
export class TransactionEnvelope_TypeNotImplementedError extends BaseError {
  override readonly name = 'TransactionEnvelope.TypeNotImplementedError'
  constructor({ type }: { type: string }) {
    super(`The provided transaction type \`${type}\` is not implemented.`)
  }
}

/**
 * Thrown when a tip is higher than a fee cap.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * TransactionEnvelopeEip1559.assert({
 *   chainId: 1,
 *   maxFeePerGas: 10n,
 *   maxPriorityFeePerGas: 11n,
 * })
 * // @error: TransactionEnvelope.TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).
 * ```
 */
export class TransactionEnvelope_TipAboveFeeCapError extends BaseError {
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
