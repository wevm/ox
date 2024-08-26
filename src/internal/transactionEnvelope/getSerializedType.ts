import type { GlobalErrorType } from '../errors/error.js'
import { Hex_slice } from '../hex/slice.js'
import type { Hex } from '../hex/types.js'
import type { IsNarrowable, IsNever } from '../types.js'
import { TransactionTypeNotImplementedError } from './errors.js'
import type {
  TransactionEnvelope_Serialized,
  TransactionEnvelope_SerializedEip1559,
  TransactionEnvelope_SerializedEip2930,
  TransactionEnvelope_SerializedEip4844,
  TransactionEnvelope_SerializedEip7702,
  TransactionEnvelope_SerializedLegacy,
  TransactionEnvelope_Type,
} from './types.js'

/** @internal */
export type GetSerializedType<
  serializedTransaction extends
    TransactionEnvelope_Serialized = TransactionEnvelope_Serialized,
  result =
    | (serializedTransaction extends TransactionEnvelope_SerializedEip1559
        ? 'eip1559'
        : never)
    | (serializedTransaction extends TransactionEnvelope_SerializedEip2930
        ? 'eip2930'
        : never)
    | (serializedTransaction extends TransactionEnvelope_SerializedEip4844
        ? 'eip4844'
        : never)
    | (serializedTransaction extends TransactionEnvelope_SerializedEip7702
        ? 'eip7702'
        : never)
    | (serializedTransaction extends TransactionEnvelope_SerializedLegacy
        ? 'legacy'
        : never),
> = IsNarrowable<serializedTransaction, Hex> extends true
  ? IsNever<result> extends false
    ? result
    : 'legacy'
  : TransactionEnvelope_Type

/** @internal */
export function TransactionEnvelope_getSerializedType<
  const serialized extends TransactionEnvelope_Serialized,
>(serialized: serialized): GetSerializedType<serialized> {
  const serializedType = Hex_slice(serialized as Hex, 0, 1)

  if (serializedType !== '0x' && Number(serializedType) >= 0xc0)
    return 'legacy' as GetSerializedType<serialized>

  if (serializedType === '0x01')
    return 'eip2930' as GetSerializedType<serialized>

  if (serializedType === '0x02')
    return 'eip1559' as GetSerializedType<serialized>

  if (serializedType === '0x03')
    return 'eip4844' as GetSerializedType<serialized>

  if (serializedType === '0x04')
    return 'eip7702' as GetSerializedType<serialized>

  throw new TransactionTypeNotImplementedError({ type: serializedType })
}

/** @internal */
export declare namespace TransactionEnvelope_getSerializedType {
  type ErrorType = TransactionTypeNotImplementedError | GlobalErrorType
}
