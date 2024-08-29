import type { Branded, Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeLegacy<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelope_Base<TransactionEnvelopeLegacy_Type, signed> & {
      /** EIP-155 Chain ID. */
      chainId?: number | undefined
      /** Base fee per gas. */
      gasPrice?: bigint | undefined
    }
  >

export type TransactionEnvelopeLegacy_Serialized = Branded<
  `0x${string}`,
  'legacy'
>

export type TransactionEnvelopeLegacy_Signed = TransactionEnvelopeLegacy<true>

export type TransactionEnvelopeLegacy_Type = 'legacy'
