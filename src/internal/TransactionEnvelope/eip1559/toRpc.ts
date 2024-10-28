import type { Errors } from '../../../Errors.js'
import { Hex_fromNumber } from '../../Hex/fromNumber.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toRpc } from '../../Signature/toRpc.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Rpc,
} from './types.js'

/**
 * Converts an {@link ox#TransactionEnvelopeEip1559.TransactionEnvelope} to an {@link ox#TransactionEnvelopeEip1559.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, TransactionEnvelopeEip1559, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1'),
 * })
 *
 * const envelope_rpc = TransactionEnvelopeEip1559.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The EIP-1559 transaction envelope to convert.
 * @returns An RPC-formatted EIP-1559 transaction envelope.
 */
export function TransactionEnvelopeEip1559_toRpc(
  envelope: Omit<TransactionEnvelopeEip1559, 'type'>,
): TransactionEnvelopeEip1559_Rpc {
  const signature = Signature_extract(envelope)

  return {
    ...envelope,
    chainId: Hex_fromNumber(envelope.chainId),
    data: envelope.data ?? envelope.input,
    type: '0x2',
    ...(typeof envelope.gas === 'bigint'
      ? { gas: Hex_fromNumber(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: Hex_fromNumber(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: Hex_fromNumber(envelope.value) }
      : {}),
    ...(typeof envelope.maxFeePerGas === 'bigint'
      ? { maxFeePerGas: Hex_fromNumber(envelope.maxFeePerGas) }
      : {}),
    ...(typeof envelope.maxPriorityFeePerGas === 'bigint'
      ? { maxPriorityFeePerGas: Hex_fromNumber(envelope.maxPriorityFeePerGas) }
      : {}),
    ...(signature ? Signature_toRpc(signature) : {}),
  } as never
}

export declare namespace TransactionEnvelopeEip1559_toRpc {
  export type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
}

TransactionEnvelopeEip1559_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_toRpc.ErrorType
