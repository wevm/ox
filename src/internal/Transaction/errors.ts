import { Errors } from '../../Errors.js'

/**
 * Thrown when a transaction type is not implemented.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Transaction } from 'ox'
 *
 * Transaction.toRpc({ type: 'foo' })
 * // @error: Transaction.TypeNotImplementedError: The provided transaction type `foo` is not implemented.
 * ```
 */
export class Transaction_TypeNotImplementedError extends Errors.BaseError {
  override readonly name = 'Transaction.TypeNotImplementedError'
  constructor({ type }: { type: string }) {
    super(`The provided transaction type \`${type}\` is not implemented.`)
  }
}
