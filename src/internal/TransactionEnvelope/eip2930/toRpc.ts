import type * as Errors from '../../../Errors.js'
import type * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import { fromNumber } from '../../Hex/fromNumber.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toRpc } from '../../Signature/toRpc.js'

/**
 * Converts an {@link ox#TransactionEnvelope.Eip2930} to an {@link ox#TransactionEnvelope.Eip2930Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gas: 21000n,
 *   maxFeePerGas: Value.fromGwei('20'),
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1'),
 * })
 *
 * const envelope_rpc = TransactionEnvelopeEip2930.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The EIP-2930 transaction envelope to convert.
 * @returns An RPC-formatted EIP-2930 transaction envelope.
 */
export function toRpc(
  envelope: Omit<TransactionEnvelopeEip2930.TransactionEnvelope, 'type'>,
): TransactionEnvelopeEip2930.Rpc {
  const signature = Signature_extract(envelope)!

  return {
    ...envelope,
    chainId: fromNumber(envelope.chainId),
    data: envelope.data ?? envelope.input,
    ...(typeof envelope.gas === 'bigint'
      ? { gas: fromNumber(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: fromNumber(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: fromNumber(envelope.value) }
      : {}),
    ...(typeof envelope.gasPrice === 'bigint'
      ? { gasPrice: fromNumber(envelope.gasPrice) }
      : {}),
    type: '0x1',
    ...(signature ? Signature_toRpc(signature) : {}),
  } as never
}

export declare namespace toRpc {
  export type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
}

toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as toRpc.ErrorType
