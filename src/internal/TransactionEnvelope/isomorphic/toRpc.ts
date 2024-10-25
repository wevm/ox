import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Signature_extract } from '../../Signature/extract.js'
import type { UnionCompute } from '../../types.js'
import type { GetType } from './getType.js'

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
 * @param transaction - The transaction to convert.
 * @returns An RPC-formatted transaction.
 */
export function toRpc<envelope extends TransactionEnvelope.TransactionEnvelope>(
  envelope: envelope,
): TransactionEnvelope_toRpc.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy.toRpc(envelope) as never
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930.toRpc(envelope) as never
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559.toRpc(envelope) as never
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844.toRpc(envelope) as never
  throw new TransactionEnvelope.TypeNotImplementedError({
    type: (envelope as any).type,
  })
}

export declare namespace TransactionEnvelope_toRpc {
  export type ReturnType<
    envelope extends
      TransactionEnvelope.TransactionEnvelope = TransactionEnvelope.TransactionEnvelope,
  > = UnionCompute<
    | (GetType<envelope> extends 'legacy'
        ? TransactionEnvelopeLegacy.Rpc
        : never)
    | (GetType<envelope> extends 'eip2930'
        ? TransactionEnvelopeEip2930.Rpc
        : never)
    | (GetType<envelope> extends 'eip1559'
        ? TransactionEnvelopeEip1559.Rpc
        : never)
    | (GetType<envelope> extends 'eip4844'
        ? TransactionEnvelopeEip4844.Rpc
        : never)
  >

  export type ErrorType = Signature_extract.ErrorType | GlobalErrorType
}

toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_toRpc.ErrorType
