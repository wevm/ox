import type { Hex } from '../../hex/types.js'
import type { Branded, Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeLegacy<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  TransactionEnvelope_Base<
    TransactionEnvelopeLegacy_Type,
    signed,
    bigintType,
    numberType
  > & {
    /** EIP-155 Chain ID. */
    chainId?: numberType | undefined
    /** Base fee per gas. */
    gasPrice?: bigintType | undefined
  }
>

export type TransactionEnvelopeLegacy_Rpc = TransactionEnvelopeLegacy<
  true,
  Hex,
  Hex
>

export type TransactionEnvelopeLegacy_Serialized = Branded<
  `0x${string}`,
  'legacy'
>

export type TransactionEnvelopeLegacy_Signed = TransactionEnvelopeLegacy<true>

export type TransactionEnvelopeLegacy_Type = 'legacy'
