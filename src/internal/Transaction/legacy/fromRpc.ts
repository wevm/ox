import type * as Errors from '../../../Errors.js'
import { Signature_extract } from '../../Signature/extract.js'
import type { TransactionLegacy, TransactionLegacy_Rpc } from './types.js'

/**
 * Converts an {@link ox#Transaction.LegacyRpc} to an {@link ox#Transaction.Legacy}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionLegacy } from 'ox'
 *
 * const transaction = TransactionLegacy.fromRpc({
 *   hash: '0x353fdfc38a2f26115daadee9f5b8392ce62b84f410957967e2ed56b35338cdd0',
 *   nonce: '0x357',
 *   blockHash:
 *     '0xc350d807505fb835650f0013632c5515592987ba169bbc6626d9fc54d91f0f0b',
 *   blockNumber: '0x12f296f',
 *   transactionIndex: '0x2',
 *   from: '0x814e5e0e31016b9a7f138c76b7e7b2bb5c1ab6a6',
 *   to: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
 *   value: '0x9b6e64a8ec60000',
 *   gas: '0x43f5d',
 *   gasPrice: '0x2ca6ae494',
 *   input:
 *     '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006643504700000000000000000000000000000000000000000000000000000000000000040b080604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec600000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000009b6e64a8ec60000000000000000000000000000000000000000000000000000019124bb5ae978c000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b80000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b8000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c00000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000060000000000000000000000000c56c7a0eaa804f854b536a5f3d5f49d2ec4b12b800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000190240001b9872b',
 *   r: '0x635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d',
 *   s: '0x50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f0540',
 *   v: '0x1b',
 *   chainId: '0x1',
 *   type: '0x0',
 * })
 * ```
 *
 * @param transaction - The Legacy RPC transaction to convert.
 * @returns An instantiated {@link ox#Transaction.Legacy}.
 */
export function TransactionLegacy_fromRpc<
  const transaction extends TransactionLegacy_Rpc<boolean> | null,
  pending extends boolean = false,
>(
  transaction: transaction | TransactionLegacy_Rpc<boolean> | null,
  _options?: TransactionLegacy_fromRpc.Options<pending>,
): transaction extends TransactionLegacy_Rpc<pending>
  ? TransactionLegacy<pending>
  : null {
  if (!transaction) return null as never

  const signature = Signature_extract(transaction)!

  return {
    blockHash: transaction.blockHash ?? null,
    blockNumber: transaction.blockNumber
      ? BigInt(transaction.blockNumber)
      : null,
    chainId: transaction.chainId ? Number(transaction.chainId) : undefined,
    data: transaction.input,
    from: transaction.from,
    gas: BigInt(transaction.gas ?? 0n),
    gasPrice: BigInt(transaction.gasPrice ?? 0n),
    hash: transaction.hash,
    input: transaction.input,
    nonce: BigInt(transaction.nonce ?? 0n),
    to: transaction.to,
    transactionIndex: transaction.transactionIndex
      ? Number(transaction.transactionIndex)
      : null,
    type: 'legacy',
    value: BigInt(transaction.value ?? 0n),
    v: signature.yParity === 0 ? 27 : 28,
    ...signature,
  } as never
}

export declare namespace TransactionLegacy_fromRpc {
  type Options<pending extends boolean = false> = {
    pending?: pending | boolean | undefined
  }

  type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
}

TransactionLegacy_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionLegacy_fromRpc.ErrorType
