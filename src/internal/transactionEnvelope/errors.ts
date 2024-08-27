import { BaseError } from '../errors/base.js'
import type { Hex } from '../hex/types.js'
import { Value_formatGwei } from '../value/formatGwei.js'

export class CannotInferTransactionTypeError extends BaseError {
  override readonly name = 'CannotInferTransactionTypeError'
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

export class FeeCapTooHighError extends BaseError {
  override readonly name = 'FeeCapTooHighError'
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

export class GasPriceTooHighError extends BaseError {
  override readonly name = 'GasPriceTooHighError'
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

export class InvalidChainIdError extends BaseError {
  override readonly name = 'InvalidChainIdError'
  constructor({ chainId }: { chainId?: number | undefined }) {
    super(
      typeof chainId !== 'undefined'
        ? `Chain ID "${chainId}" is invalid.`
        : 'Chain ID is invalid.',
    )
  }
}

export class InvalidSerializedTransactionError extends BaseError {
  override readonly name = 'InvalidSerializedTransactionError'
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

export class TransactionTypeNotImplementedError extends BaseError {
  override readonly name = 'TransactionTypeNotImplementedError'
  constructor({ type }: { type: string }) {
    super(`The provided transaction type \`${type}\` is not implemented.`)
  }
}

export class TipAboveFeeCapError extends BaseError {
  override readonly name = 'TipAboveFeeCapError'
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

function prettyPrint(
  args: Record<string, bigint | number | string | undefined | false | unknown>,
) {
  const entries = Object.entries(args)
    .map(([key, value]) => {
      if (value === undefined || value === false) return null
      return [key, value]
    })
    .filter(Boolean) as [string, string][]
  const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0)
  return entries
    .map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`)
    .join('\n')
}
