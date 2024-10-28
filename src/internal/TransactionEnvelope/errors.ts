import { Errors } from '../../Errors.js'
import type { Hex } from '../Hex/types.js'
import { Value_formatGwei } from '../Value/formatGwei.js'

/**
 * Thrown when a fee cap is too high.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * TransactionEnvelopeEip1559.assert({
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 * })
 * // @error: TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class TransactionEnvelope_FeeCapTooHighError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.FeeCapTooHighError'
  constructor({
    feeCap,
  }: {
    feeCap?: bigint | undefined
  } = {}) {
    super(
      `The fee cap (\`maxFeePerGas\`/\`maxPriorityFeePerGas\`${
        feeCap ? ` = ${Value_formatGwei(feeCap)} gwei` : ''
      }) cannot be higher than the maximum allowed value (2^256-1).`,
    )
  }
}

/**
 * Thrown when a gas price is too high.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy } from 'ox'
 *
 * TransactionEnvelopeLegacy.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 * })
 * // @error: TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).
 * ```
 */
export class TransactionEnvelope_GasPriceTooHighError extends Errors.BaseError {
  override readonly name = 'TransactionEnvelope.GasPriceTooHighError'
  constructor({
    gasPrice,
  }: {
    gasPrice?: bigint | undefined
  } = {}) {
    super(
      `The gas price (\`gasPrice\`${
        gasPrice ? ` = ${Value_formatGwei(gasPrice)} gwei` : ''
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
export class TransactionEnvelope_InvalidChainIdError extends Errors.BaseError {
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
export class TransactionEnvelope_InvalidSerializedError extends Errors.BaseError {
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
export class TransactionEnvelope_TipAboveFeeCapError extends Errors.BaseError {
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
            ? ` = ${Value_formatGwei(maxPriorityFeePerGas)} gwei`
            : ''
        }) cannot be higher than the fee cap (\`maxFeePerGas\`${
          maxFeePerGas ? ` = ${Value_formatGwei(maxFeePerGas)} gwei` : ''
        }).`,
      ].join('\n'),
    )
  }
}
