import type * as Errors from '../../../Errors.js'
import type { Signature_extract } from '../../Signature/extract.js'
import type { UnionCompute } from '../../types.js'
import { TransactionEnvelopeEip1559_toRpc } from '../eip1559/toRpc.js'
import type { TransactionEnvelopeEip1559_Rpc } from '../eip1559/types.js'
import { TransactionEnvelopeEip2930_toRpc } from '../eip2930/toRpc.js'
import type { TransactionEnvelopeEip2930_Rpc } from '../eip2930/types.js'
import { TransactionEnvelopeEip4844_toRpc } from '../eip4844/toRpc.js'
import type { TransactionEnvelopeEip4844_Rpc } from '../eip4844/types.js'
import { TransactionEnvelope_TypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_toRpc } from '../legacy/toRpc.js'
import type { TransactionEnvelopeLegacy_Rpc } from '../legacy/types.js'
import type { TransactionEnvelope_GetType } from './getType.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Converts an {@link ox#TransactionEnvelope.TransactionEnvelope} to an {@link ox#TransactionEnvelope.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   gas: 21000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1'),
 * })
 *
 * const envelope_rpc = TransactionEnvelope.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The transaction envelope to convert.
 * @returns An RPC-formatted transaction envelope.
 */
export function TransactionEnvelope_toRpc<envelope extends TransactionEnvelope>(
  envelope: envelope,
): TransactionEnvelope_toRpc.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy_toRpc(envelope) as never
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930_toRpc(envelope) as never
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559_toRpc(envelope) as never
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844_toRpc(envelope) as never
  throw new TransactionEnvelope_TypeNotImplementedError({
    type: (envelope as any).type,
  })
}

export declare namespace TransactionEnvelope_toRpc {
  export type ReturnType<
    envelope extends TransactionEnvelope = TransactionEnvelope,
  > = UnionCompute<
    | (TransactionEnvelope_GetType<envelope> extends 'legacy'
        ? TransactionEnvelopeLegacy_Rpc
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip2930'
        ? TransactionEnvelopeEip2930_Rpc
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip1559'
        ? TransactionEnvelopeEip1559_Rpc
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip4844'
        ? TransactionEnvelopeEip4844_Rpc
        : never)
  >

  export type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
}

TransactionEnvelope_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_toRpc.ErrorType
