import { slice } from '../data/slice.js'
import type { GlobalErrorType } from '../errors/error.js'
import { TransactionTypeNotImplementedError } from '../errors/transactionEnvelope.js'
import type { Hex } from '../types/data.js'
import type {
  TransactionEnvelopeSerialized,
  TransactionEnvelopeSerializedEip1559,
  TransactionEnvelopeSerializedEip2930,
  TransactionEnvelopeSerializedEip4844,
  TransactionEnvelopeSerializedEip7702,
  TransactionEnvelopeSerializedLegacy,
  TransactionType,
} from '../types/transactionEnvelope.js'
import type { IsNarrowable, IsNever } from '../types/utils.js'

/** @internal */
export type GetSerializedTransactionType<
  serializedTransaction extends
    TransactionEnvelopeSerialized = TransactionEnvelopeSerialized,
  result =
    | (serializedTransaction extends TransactionEnvelopeSerializedEip1559
        ? 'eip1559'
        : never)
    | (serializedTransaction extends TransactionEnvelopeSerializedEip2930
        ? 'eip2930'
        : never)
    | (serializedTransaction extends TransactionEnvelopeSerializedEip4844
        ? 'eip4844'
        : never)
    | (serializedTransaction extends TransactionEnvelopeSerializedEip7702
        ? 'eip7702'
        : never)
    | (serializedTransaction extends TransactionEnvelopeSerializedLegacy
        ? 'legacy'
        : never),
> = IsNarrowable<serializedTransaction, Hex> extends true
  ? IsNever<result> extends false
    ? result
    : 'legacy'
  : TransactionType

/** @internal */
export function getSerializedTransactionType<
  const serializedTransaction extends TransactionEnvelopeSerialized,
>(
  serializedTransaction: serializedTransaction,
): GetSerializedTransactionType<serializedTransaction> {
  const serializedType = slice(serializedTransaction as Hex, 0, 1)

  if (serializedType !== '0x' && Number(serializedType) >= 0xc0)
    return 'legacy' as GetSerializedTransactionType<serializedTransaction>

  if (serializedType === '0x01')
    return 'eip2930' as GetSerializedTransactionType<serializedTransaction>

  if (serializedType === '0x02')
    return 'eip1559' as GetSerializedTransactionType<serializedTransaction>

  if (serializedType === '0x03')
    return 'eip4844' as GetSerializedTransactionType<serializedTransaction>

  if (serializedType === '0x04')
    return 'eip7702' as GetSerializedTransactionType<serializedTransaction>

  throw new TransactionTypeNotImplementedError({ type: serializedType })
}

export declare namespace getSerializedTransactionType {
  type ErrorType = TransactionTypeNotImplementedError | GlobalErrorType
}

getSerializedTransactionType.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getSerializedTransactionType.ErrorType
