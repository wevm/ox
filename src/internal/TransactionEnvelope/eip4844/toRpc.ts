import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_fromNumber } from '../../Hex/fromNumber.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toRpc } from '../../Signature/toRpc.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Rpc,
} from './types.js'

/**
 * Converts an {@link ox#TransactionEnvelope.Eip4844} to an {@link ox#TransactionEnvelope.Eip4844Rpc}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, RpcRequest, TransactionEnvelopeEip4844, Value } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
 *
 * const envelope = TransactionEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   gas: 21000n,
 *   maxFeePerBlobGas: Value.fromGwei('20'),
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1'),
 * })
 *
 * const envelope_rpc = TransactionEnvelopeEip4844.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The EIP-4844 transaction envelope to convert.
 * @returns An RPC-formatted EIP-4844 transaction envelope.
 */
export function TransactionEnvelopeEip4844_toRpc(
  envelope: Omit<TransactionEnvelopeEip4844, 'type'>,
): TransactionEnvelopeEip4844_Rpc {
  const signature = Signature_extract(envelope)

  return {
    ...envelope,
    chainId: Hex_fromNumber(envelope.chainId),
    data: envelope.data ?? envelope.input,
    ...(typeof envelope.gas === 'bigint'
      ? { gas: Hex_fromNumber(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: Hex_fromNumber(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: Hex_fromNumber(envelope.value) }
      : {}),
    ...(typeof envelope.maxFeePerBlobGas === 'bigint'
      ? { maxFeePerBlobGas: Hex_fromNumber(envelope.maxFeePerBlobGas) }
      : {}),
    ...(typeof envelope.maxFeePerGas === 'bigint'
      ? { maxFeePerGas: Hex_fromNumber(envelope.maxFeePerGas) }
      : {}),
    ...(typeof envelope.maxPriorityFeePerGas === 'bigint'
      ? { maxPriorityFeePerGas: Hex_fromNumber(envelope.maxPriorityFeePerGas) }
      : {}),
    type: '0x3',
    ...(signature ? Signature_toRpc(signature) : {}),
  } as never
}

export declare namespace TransactionEnvelopeEip4844_toRpc {
  export type ErrorType = Signature_extract.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip4844_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_toRpc.ErrorType
