import type { Signature_Legacy } from '../../signature/types.js'
import type { Branded, Compute, ExactPartial } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeLegacy_Type = 'legacy'

export type TransactionEnvelopeLegacy = Compute<
  TransactionEnvelope_Base<TransactionEnvelopeLegacy_Type> & {
    /** EIP-155 Chain ID. */
    chainId?: number | undefined
    /** Base fee per gas. */
    gasPrice?: bigint | undefined
  } & ExactPartial<Signature_Legacy>
>

export type TransactionEnvelopeLegacy_Serialized = Branded<
  `0x${string}`,
  'legacy'
>
