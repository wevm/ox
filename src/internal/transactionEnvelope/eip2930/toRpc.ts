import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_from } from '../../hex/from.js'
import { Signature_extract } from '../../signature/extract.js'
import { Signature_toRpc } from '../../signature/toRpc.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Rpc,
} from './types.js'

/**
 * Converts an {@link TransactionEnvelope#Eip2930} to an {@link TransactionEnvelope#Eip2930Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc, TransactionEnvelopeEip2930, Value } from 'ox'
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
 * const request = JsonRpc.defineRequest({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The EIP-2930 transaction envelope to convert.
 * @returns An RPC-formatted EIP-2930 transaction envelope.
 */
export function TransactionEnvelopeEip2930_toRpc(
  envelope: Omit<TransactionEnvelopeEip2930, 'type'>,
): TransactionEnvelopeEip2930_Rpc {
  const signature = Signature_extract(envelope)!

  return {
    ...envelope,
    chainId: Hex_from(envelope.chainId),
    data: envelope.data ?? envelope.input,
    ...(typeof envelope.gas === 'bigint'
      ? { gas: Hex_from(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: Hex_from(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: Hex_from(envelope.value) }
      : {}),
    ...(typeof envelope.gasPrice === 'bigint'
      ? { gasPrice: Hex_from(envelope.gasPrice) }
      : {}),
    type: '0x1',
    ...(signature ? Signature_toRpc(signature) : {}),
  } as never
}

export declare namespace TransactionEnvelopeEip2930_toRpc {
  export type ErrorType = Signature_extract.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip2930_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_toRpc.ErrorType
