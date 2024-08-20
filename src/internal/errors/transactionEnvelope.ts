import { BaseError } from './base.js'

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
