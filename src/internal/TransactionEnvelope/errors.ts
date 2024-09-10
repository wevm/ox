import { BaseError } from '../Errors/base.js'
import { prettyPrint } from '../Errors/utils.js'
import type { Hex } from '../Hex/types.js'
import { Value_formatGwei } from '../Value/formatGwei.js'

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

export class TransactionEnvelope_FeeCapTooHighError extends BaseError {
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

export class TransactionEnvelope_GasPriceTooHighError extends BaseError {
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

export class TransactionEnvelope_TypeNotImplementedError extends BaseError {
  override readonly name = 'TransactionEnvelope.TypeNotImplementedError'
  constructor({ type }: { type: string }) {
    super(`The provided transaction type \`${type}\` is not implemented.`)
  }
}

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
            ? ` = ${Value_formatGwei(maxPriorityFeePerGas)} gwei`
            : ''
        }) cannot be higher than the fee cap (\`maxFeePerGas\`${
          maxFeePerGas ? ` = ${Value_formatGwei(maxFeePerGas)} gwei` : ''
        }).`,
      ].join('\n'),
    )
  }
}
